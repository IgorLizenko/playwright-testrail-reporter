/* eslint-disable @typescript-eslint/naming-convention */
import { Agent } from 'https';

import axios, { AxiosError, AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';

import { ReporterOptions } from '@types-internal/playwright-reporter.types';
import { TestRailCase, TestRailCaseStatus, TestRailProject, TestRailRun, TestRailRunWithAdditionalData, TestRailSuite } from '@types-internal/testrail-api.types';

import logger from '@logger';

class TestRail {
    private readonly client: AxiosInstance;
    private readonly httpsAgent: Agent;

    constructor(options: ReporterOptions) {
        this.httpsAgent = new Agent({ rejectUnauthorized: false });
        this.client = axios.create({
            httpsAgent: this.httpsAgent,
            headers: {
                'Content-Type': 'application/json'
            },
            baseURL: `${options.domain}/index.php?`,
            auth: {
                username: options.username,
                password: options.password
            }
        });

        axiosRetry(this.client, {
            retries: 3,
            retryDelay: (...arg) => axiosRetry.exponentialDelay(...arg),
            retryCondition: (error: AxiosError): boolean => {
                return Boolean(
                    axiosRetry.isNetworkOrIdempotentRequestError(error)
                    || (error.response?.status && error.response.status >= 500)
                );
            },
            onRetry: (retryCount, error) => {
                const requestUrl = error.config?.url ?? 'unknown';
                logger.warn('Retrying request', {
                    attempt: retryCount,
                    url: requestUrl,
                    error: error.message
                });
            }
        });

        logger.debug('TestRail API client initialized', {
            baseUrl: options.domain,
            retries: 3
        });
    }

    /**
     * Creates a new test run in TestRail for the specified project and suite.
     * @param options Options for creating a test run
     * @param options.projectId ID of the TestRail project
     * @param options.suiteId ID of the test suite in the project
     * @param options.name Name of the test run
     * @param options.cases Array of test case IDs to include in the run
     * @returns Promise that resolves to TestRailRunWithAdditionalData with extended run information or null if creation fails
     */
    async addTestRun({
        projectId,
        suiteId,
        name,
        cases
    }: {
        projectId: TestRailProject['id'],
        suiteId: TestRailSuite['id'],
        name: TestRailRun['name'],
        cases: TestRailCase['id'][]
    }): Promise<TestRailRunWithAdditionalData | null> {
        return this.client.post(`/api/v2/add_run/${projectId}`, {
            suite_id: suiteId,
            name,
            case_ids: cases
        }).then((response: { data: TestRailRun }) => {
            logger.debug(`Run created with ID: ${response.data.id}`);

            return {
                ...response.data,
                projectId,
                suiteId,
                cases
            };
        }).catch((error: unknown) => {
            const errorPayload = (error as AxiosError).response?.data ?? error;

            logger.error(`Failed to create a test run for project ${projectId} and suite ${suiteId}`, errorPayload);

            return null;
        });
    }

    /**
     * Adds test results to an existing test run in TestRail.
     * @param runId ID of the test run to add results to
     * @param results Array of test case results, each containing:
     * - case_id: ID of the test case
     * - status_id: Optional status of the test case (passed, failed, etc.)
     * - comment: Optional comment or error message
     * @returns Promise that resolves to the updated TestRail run
     */
    async addTestRunResults(runId: TestRailRun['id'], results: {
        case_id: TestRailCase['id'],
        status_id?: TestRailCaseStatus,
        comment?: string
    }[]): Promise<TestRailRun | null> {
        return this.client.post(`/api/v2/add_results_for_cases/${runId}`, JSON.stringify({ results }))
            .then((response: { data: TestRailRun }) => {
                logger.debug(`Results added to run ${runId}`);

                return response.data;
            })
            .catch((error: unknown) => {
                const errorPayload = (error as AxiosError).response?.data ?? error;

                logger.error(`Failed to add test run results for run ID ${runId}`, errorPayload);

                return null;
            });
    }

    /**
     * Closes an existing test run in TestRail.
     * @param runId ID of the test run to close
     * @returns Promise that resolves when the run is closed
     */
    async closeTestRun(rundId: TestRailRun['id']): Promise<void> {
        await this.client.post(`/api/v2/close_run/${rundId}`)
            .then(() => {
                logger.debug(`Run ${rundId} closed`);
            })
            .catch((error: unknown) => {
                const errorPayload = (error as AxiosError).response?.data ?? error;

                logger.error(`Failed to close test run for run ID ${rundId}`, errorPayload);

                return null;
            });
    }
}

export { TestRail };