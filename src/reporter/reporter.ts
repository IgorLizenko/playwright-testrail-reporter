import type {
    FullConfig, FullResult, Reporter, Suite, TestCase, TestResult
} from '@playwright/test/reporter';

import { TestRail } from '@testrail-api/testrail-api';

import { filterDuplicatingCases, groupTestResults } from '@reporter/utils/group-runs';
import { parseSingleTestTags } from '@reporter/utils/tags';
import { convertTestResult } from '@reporter/utils/test-results';
import { validateSettings } from '@reporter/utils/validate-settings';

import type { FinalResult, ProjectSuiteCombo, ReporterOptions, RunCreated } from '@types-internal/playwright-reporter.types';
import type { TestRailCaseResult } from '@types-internal/testrail-api.types';

import logger from '@logger';

class TestRailReporter implements Reporter {
    private readonly testRailClient: TestRail;

    private readonly isSetupCorrectly: boolean = false;

    private arrayTestRuns: ProjectSuiteCombo[] | undefined;
    private readonly arrayTestResults: TestRailCaseResult[];

    private readonly closeRuns: boolean;
    private readonly includeAllCases: boolean;

    constructor(options: ReporterOptions) {
        this.isSetupCorrectly = validateSettings(options);
        logger.debug('Setting up TestRail API client');
        this.testRailClient = new TestRail(options);

        this.arrayTestResults = [];

        this.closeRuns = options.closeRuns ?? false;
        this.includeAllCases = options.includeAllCases ?? false;
    }

    onBegin?(_config: FullConfig, suite: Suite): void {
        this.arrayTestRuns = parseSingleTestTags(suite.allTests().map((test) => test.tags).flat());
        logger.debug('Runs to create', this.arrayTestRuns);
    }

    onTestEnd(testCase: TestCase, testResult: TestResult): void {
        logger.debug(`Test "${testCase.title}" finished with ${testResult.status} status`);
        this.arrayTestResults.push(...convertTestResult({ testCase, testResult }));
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

        if (result.status !== 'passed' && result.status !== 'failed') {
            logger.warn('Test run was either interrupted or timed out, no test runs will be created');

            return false;
        }

        if (!this.arrayTestRuns) {
            logger.warn('No tags in expected format found');

            return false;
        }

        return true;
    }

    private async createTestRuns(arrayTestRuns: ProjectSuiteCombo[]): Promise<RunCreated[]> {
        logger.debug('Runs to create', arrayTestRuns);

        const arrayTestRunsCreated = [];

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

    private compileFinalResults(arrayTestResults: TestRailCaseResult[], arrayTestRuns: RunCreated[]): FinalResult[] {
        return groupTestResults(arrayTestResults, arrayTestRuns).map((finalResult) => {
            return filterDuplicatingCases(finalResult);
        });
    }

    private async addResultsToRuns(arrayTestRuns: FinalResult[]): Promise<void> {
        logger.info(`Adding results to runs ${arrayTestRuns.map((run) => run.runId).join(', ')}`);
        await Promise.all(arrayTestRuns.map((run) => this.testRailClient.addTestRunResults(run.runId, run.arrayCaseResults)));
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