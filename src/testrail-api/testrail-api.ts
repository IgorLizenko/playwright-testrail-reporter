import { createReadStream } from 'fs';
import { Agent } from 'https';

import axios, { AxiosError, AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import formData from 'form-data';

import type { ReporterOptions } from '@types-internal/playwright-reporter.types';
import type { TestRailBaseRun, TestRailPayloadAddAttachment, TestRailPayloadCreateRun, TestRailPayloadUpdateRunResult, TestRailResponseAttachmentAdded, TestRailResponseRunCreated, TestRailResponseRunUpdated } from '@types-internal/testrail-api.types';

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
     * Creates a new test run in TestRail.
     *
     * @param {Object} options - Configuration object for test run creation
     * @param {number} options.projectId - The ID of the TestRail project
     * @param {number} options.suiteId - The ID of the test suite within the project
     * @param {string} options.name - The name to assign to the new test run
     * @param {number[]} options.cases - An array of test case IDs to be included in the run
     * @param {boolean} options.includeAllCases - Whether to include all test cases from the suite
     * @returns {Promise<TestRailResponseRunCreated | null>} The created test run data with additional information, or null if creation fails
     */
    async addTestRun({
        projectId,
        suiteId,
        name,
        cases,
        includeAllCases
    }: TestRailPayloadCreateRun): Promise<TestRailResponseRunCreated | null> {
        return this.client.post(`/api/v2/add_run/${projectId}`, {
            suite_id: suiteId,
            name,
            case_ids: cases,
            include_all: includeAllCases
        }).then((response: { data: TestRailResponseRunCreated }) => {
            logger.debug(`Run created with ID: ${response.data.id}`);

            return response.data;
        }).catch((error: unknown) => {
            const errorPayload = (error as AxiosError).response?.data ?? error;
            logger.error(`Failed to create a test run for project ${projectId} and suite ${suiteId}`, errorPayload);

            return null;
        });
    }

    /**
     * Adds test results to an existing test run in TestRail.
     *
     * @param {number} runId - The ID of the test run to update
     * @param {TestRailPayloadUpdateRunResult[]} results - Array of test result objects
     * @param {number} results[].case_id - The ID of the test case
     * @param {number} [results[].status_id] - The status ID of the test result (e.g., passed, failed)
     * @param {string} [results[].comment] - Additional comments or error messages for the test result
     * @returns {Promise<TestRailResponseRunUpdated[] | null>} Array of updated test results, or null if update fails
     */
    async addTestRunResults(runId: TestRailBaseRun['id'], results: TestRailPayloadUpdateRunResult[]): Promise<TestRailResponseRunUpdated[] | null> {
        return this.client.post(`/api/v2/add_results_for_cases/${runId}`, JSON.stringify({ results }))
            .then((response: { data: TestRailResponseRunUpdated[] }) => {
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
    async closeTestRun(runId: TestRailBaseRun['id']): Promise<void> {
        await this.client.post(`/api/v2/close_run/${runId}`)
            .then(() => {
                logger.debug(`Run ${runId} closed`);
            })
            .catch((error: unknown) => {
                const errorPayload = (error as AxiosError).response?.data ?? error;
                logger.error(`Failed to close test run for run ID ${runId}`, errorPayload);
            });
    }

    /**
     * Adds an attachment to a test result in TestRail.
     * @param resultId ID of the test result to which the attachment will be added
     * @param attachment Attachment content to be added
     * @returns Promise that resolves with the attachment ID, or null if the attachment fails to add
     */
    async addAttachmentToResult({
        resultId,
        attachment
    }: TestRailPayloadAddAttachment): Promise<TestRailResponseAttachmentAdded | null> {
        const form = new formData();
        form.append('attachment', createReadStream(attachment));
        const formHeaders = form.getHeaders();

        return this.client.post(`/api/v2/add_attachment_to_result/${resultId}`, form, {
            headers: {
                ...formHeaders
            }
        })
            .then((response: { data: TestRailResponseAttachmentAdded }) => {
                logger.debug(`Attachment added to result ${resultId}`);

                return response.data;
            })
            .catch((error: unknown) => {
                const errorPayload = (error as AxiosError).response?.data ?? error;
                logger.error(`Failed to add attachment to result for result ID ${resultId}`, errorPayload);

                return null;
            });
    }
}

export { TestRail };