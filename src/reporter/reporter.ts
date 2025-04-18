import type {
    FullConfig, FullResult, Reporter, Suite, TestCase, TestResult
} from '@playwright/test/reporter';

import { TestRail } from '@testrail-api/testrail-api';

import { filterDuplicatingCases, groupTestResults } from '@reporter/utils/group-runs';
import { parseSingleTestTags } from '@reporter/utils/tags';
import { convertTestResult, extractAttachmentData } from '@reporter/utils/test-results';
import { validateSettings } from '@reporter/utils/validate-settings';

import type { AttachmentData, FinalResult, ProjectSuiteCombo, ReporterOptions, RunCreated, RunUpdated } from '@types-internal/playwright-reporter.types';
import type { TestRailPayloadUpdateRunResult } from '@types-internal/testrail-api.types';

import logger from '@logger';

class TestRailReporter implements Reporter {
    private readonly testRailClient: TestRail;

    private readonly isSetupCorrectly: boolean = false;

    private arrayTestRuns: ProjectSuiteCombo[] | undefined;
    private readonly arrayTestResults: TestRailPayloadUpdateRunResult[];
    private readonly arrayAttachments: AttachmentData[];

    private readonly includeAllCases: boolean;
    private readonly includeAttachments: boolean;
    private readonly closeRuns: boolean;

    constructor(options: ReporterOptions) {
        this.isSetupCorrectly = validateSettings(options);
        logger.debug('Setting up TestRail API client');
        this.testRailClient = new TestRail(options);

        this.arrayTestResults = [];
        this.arrayAttachments = [];

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
        this.arrayTestRuns = parseSingleTestTags(suite.allTests().map((test) => test.tags).flat());
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

        await this.addResultsToRuns(finalResults);

        /* if (this.includeAttachments) {
            await this.addAttachments(this.arrayAttachments);
        } */

        if (this.closeRuns) {
            await this.closeTestRuns(finalResults.map((finalResult) => finalResult.runId));
        }

        const finalMessage = this.closeRuns
            ? 'All test runs have been updated and closed '
            : 'All test runs have been updated ';

        logger.info(finalMessage);
    }

    private shouldCreateRuns(result: FullResult): boolean {
        if (!this.isSetupCorrectly) {
            logger.error('Reporter options are not valid, no test runs will be created');
            return false;
        }

        if (result.status !== 'passed' && result.status !== 'failed') {
            logger.warn('Test run was either interrupted or timed out, no test runs will be created');

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

        const arrayTestRunsCreated: RunCreated[] = [];

        for (const projectSuiteCombo of arrayTestRuns) {
            logger.info(`Creating a test run for project ${projectSuiteCombo.projectId} and suite ${projectSuiteCombo.suiteId}...`);

            const name = `Playwright Run ${new Date().toUTCString()}`;
            const response = await this.testRailClient.addTestRun({
                projectId: projectSuiteCombo.projectId,
                suiteId: projectSuiteCombo.suiteId,
                name,
                cases: projectSuiteCombo.arrayCaseIds,
                includeAllCases: this.includeAllCases
            });

            if (response !== null) {
                arrayTestRunsCreated.push({
                    runId: response.id,
                    ...projectSuiteCombo
                });
            }
        }

        logger.debug('Runs created', arrayTestRunsCreated);

        return arrayTestRunsCreated;
    }

    private compileFinalResults(arrayTestResults: TestRailPayloadUpdateRunResult[], arrayTestRuns: RunCreated[]): FinalResult[] {
        return groupTestResults(arrayTestResults, arrayTestRuns).map((finalResult) => {
            return filterDuplicatingCases(finalResult);
        });
    }

    private async addResultsToRuns(arrayTestRuns: FinalResult[]): Promise<RunUpdated[]> {
        logger.info(`Adding results to runs ${arrayTestRuns.map((run) => run.runId).join(', ')}`);
        const results = await Promise.all(arrayTestRuns.map(async (run) => {
            const result = await this.testRailClient.addTestRunResults(run.runId, run.arrayCaseResults);

            if (result === null) {
                return null;
            }

            if (result.length !== run.arrayCaseResults.length) {
                logger.error('Number of results does not match number of cases');
                return null;
            }

            // Match request payload to response by index
            const arrayMatchedCasesToResults = run.arrayCaseResults.map((caseResult, index) => {
                return {
                    caseId: caseResult.case_id,
                    resultId: result[index].id
                };
            });

            return {
                runId: run.runId,
                arrayMatchedCasesToResults
            };
        }));

        return results.filter((result) => result !== null);
    }

    private async closeTestRuns(arrayRunIds: number[]): Promise<void> {
        logger.info(`Closing runs ${arrayRunIds.join(', ')}`);
        await Promise.all(arrayRunIds.map((runId) => this.testRailClient.closeTestRun(runId)));
    }

    printsToStdio(): boolean {
        return true;
    }
}

export { TestRailReporter };