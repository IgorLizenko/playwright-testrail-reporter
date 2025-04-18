import type {
    FullConfig, FullResult, Reporter, Suite, TestCase, TestResult
} from '@playwright/test/reporter';

import { TestRail } from '@testrail-api/testrail-api';

import { resolvePromisesInChunks } from '@reporter/utils/chunk-promise';
import { filterDuplicatingCases, groupAttachments, groupTestResults } from '@reporter/utils/group-runs';
import { parseArrayOfTags } from '@reporter/utils/tags';
import { convertTestResult, extractAttachmentData } from '@reporter/utils/test-results';
import { validateSettings } from '@reporter/utils/validate-settings';

import type { AttachmentData, CaseResultMatch, FinalResult, ProjectSuiteCombo, ReporterOptions, RunCreated } from '@types-internal/playwright-reporter.types';
import type { TestRailPayloadUpdateRunResult } from '@types-internal/testrail-api.types';

import logger from '@logger';

class TestRailReporter implements Reporter {
    private readonly testRailClient: TestRail;

    private readonly isSetupCorrectly: boolean = false;

    private arrayTestRuns: ProjectSuiteCombo[] | null;
    private readonly arrayTestResults: TestRailPayloadUpdateRunResult[];
    private readonly arrayAttachments: AttachmentData[];

    private readonly includeAllCases: boolean;
    private readonly includeAttachments: boolean;
    private readonly closeRuns: boolean;

    private readonly chunkSize: number = 2;

    constructor(options: ReporterOptions) {
        this.isSetupCorrectly = validateSettings(options);
        logger.debug('Setting up TestRail API client');
        this.testRailClient = new TestRail(options);

        this.arrayTestResults = [];
        this.arrayAttachments = [];
        this.arrayTestRuns = null;

        // Remember reporter options as 'options' object is not accessible after constructor
        this.includeAllCases = options.includeAllCases ?? false;
        this.includeAttachments = options.includeAttachments ?? false;
        this.closeRuns = options.closeRuns ?? false;

        logger.debug('Reporter options', {
            includeAllCases: this.includeAllCases,
            includeAttachments: this.includeAttachments,
            closeRuns: this.closeRuns
        });
    }

    onBegin?(_config: FullConfig, suite: Suite): void {
        this.arrayTestRuns = parseArrayOfTags(suite.allTests().map((test) => test.tags).flat());
        logger.debug('Runs to create', this.arrayTestRuns);

        if (!this.arrayTestRuns) {
            logger.warn('No tags in expected format found, no test runs will be created');
        }
    }

    onTestEnd(testCase: TestCase, testResult: TestResult): void {
        logger.debug(`Test "${testCase.title}" finished with ${testResult.status} status`);
        this.arrayTestResults.push(...convertTestResult({ testCase, testResult }));
        this.arrayAttachments.push(...extractAttachmentData({ testCase, testResult }));
    }

    async onEnd(result: FullResult): Promise<void> {
        if (!this.shouldCreateRuns(result)) {
            return;
        }

        const arrayTestRunsCreated = await this.createTestRuns(this.arrayTestRuns!);

        const finalResults = this.compileFinalResults(this.arrayTestResults, arrayTestRunsCreated);
        logger.debug('Test runs to update', finalResults);

        if (finalResults.length === 0) {
            logger.warn('No test runs to update');

            return;
        }

        const arrayRunsUpdated = await this.addResultsToRuns(finalResults);

        if (this.includeAttachments) {
            await this.addAttachments(this.arrayAttachments, arrayRunsUpdated);
        }

        if (this.closeRuns) {
            await this.closeTestRuns(finalResults.map((finalResult) => finalResult.runId));
        }

        const finalMessage = this.closeRuns
            ? 'All test runs have been updated and closed ✅'
            : 'All test runs have been updated ✅';

        logger.info(finalMessage);
    }

    private shouldCreateRuns(result: FullResult): boolean {
        if (!this.isSetupCorrectly) {
            logger.error('Reporter options are not valid, no test runs will be created');
            return false;
        }

        if (result.status === 'interrupted') {
            logger.warn('Test run was interrupted, no test runs will be created');
            return false;
        }

        if (result.status === 'timedout') {
            logger.warn('Test run was timed out, no test runs will be created');
            return false;
        }

        if (!this.arrayTestRuns) {
            logger.warn('No test runs to create due to absence of tags in expected format');

            return false;
        }

        return true;
    }

    private async createTestRuns(arrayTestRuns: ProjectSuiteCombo[]): Promise<RunCreated[]> {
        logger.debug('Runs to create', arrayTestRuns);

        const results = await Promise.all(arrayTestRuns.map(async (projectSuiteCombo) => {
            logger.info(`Creating a test run for project ${projectSuiteCombo.projectId} and suite ${projectSuiteCombo.suiteId}...`);
            const name = `Playwright Run ${new Date().toUTCString()}`;
            const response = await this.testRailClient.addTestRun({
                projectId: projectSuiteCombo.projectId,
                suiteId: projectSuiteCombo.suiteId,
                name,
                cases: projectSuiteCombo.arrayCaseIds,
                includeAllCases: this.includeAllCases
            });

            if (response === null) {
                return null;
            }

            return {
                runId: response.id,
                ...projectSuiteCombo
            };
        }));

        const arrayTestRunsCreated = results.filter((result) => result !== null);

        logger.debug('Runs created', arrayTestRunsCreated);

        return arrayTestRunsCreated;
    }

    private compileFinalResults(arrayTestResults: TestRailPayloadUpdateRunResult[], arrayTestRuns: RunCreated[]): FinalResult[] {
        return groupTestResults(arrayTestResults, arrayTestRuns).map((finalResult) => {
            return filterDuplicatingCases(finalResult);
        });
    }

    private async addResultsToRuns(arrayTestRuns: FinalResult[]): Promise<CaseResultMatch[]> {
        logger.info(`Adding results to runs ${arrayTestRuns.map((run) => run.runId).join(', ')}`);
        const results = await Promise.all(arrayTestRuns.map(async (run) => {
            const result = await this.testRailClient.addTestRunResults(run.runId, run.arrayCaseResults);

            if (result === null) {
                return null;
            }

            if (result.length !== run.arrayCaseResults.length) {
                logger.error(`Number of results does not match number of cases when updating test run ${run.runId}`);

                return null;
            }

            // Match request payload to response by index
            const arrayMatchedCasesToResults = run.arrayCaseResults.map((caseResult, index) => {
                return {
                    caseId: caseResult.case_id,
                    resultId: result[index].id
                };
            });

            return arrayMatchedCasesToResults;
        }));

        return results.flat().filter((result) => result !== null);
    }

    private async addAttachments(arrayAttachments: AttachmentData[], arrayRunsUpdated: CaseResultMatch[]): Promise<void> {
        const arrayAttachmentPayloads = groupAttachments(arrayAttachments, arrayRunsUpdated);

        if (arrayAttachmentPayloads.length === 0) {
            logger.info('No attachments to add');

            return;
        }

        logger.info(`Adding attachments to results ${arrayAttachmentPayloads.map((payload) => payload.resultId).join(', ')}`);

        await resolvePromisesInChunks({
            arrayInputData: arrayAttachmentPayloads,
            functionToCall: (payload) => this.testRailClient.addAttachmentToResult(payload),
            chunkSize: this.chunkSize
        });
    }

    private async closeTestRuns(arrayRunIds: number[]): Promise<void> {
        logger.info(`Closing runs ${arrayRunIds.join(', ')}`);
        await resolvePromisesInChunks({
            arrayInputData: arrayRunIds,
            functionToCall: (runId) => this.testRailClient.closeTestRun(runId),
            chunkSize: this.chunkSize
        });
    }

    printsToStdio(): boolean {
        return true;
    }
}

export { TestRailReporter };