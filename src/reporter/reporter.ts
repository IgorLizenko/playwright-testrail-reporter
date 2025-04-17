import type {
    FullConfig, FullResult, Reporter, Suite, TestCase, TestResult
} from '@playwright/test/reporter';

import { TestRail } from '@testrail-api/testrail-api';

import { filterDuplicatingCases, groupTestResults } from '@reporter/utils/group-runs';
import { parseSingleTestTags } from '@reporter/utils/tags';
import { convertTestResult } from '@reporter/utils/test-results';
import { validateSettings } from '@reporter/utils/validate-settings';

import type { ProjectSuiteCombo, ReporterOptions } from '@types-internal/playwright-reporter.types';
import type { TestRailCaseResult } from '@types-internal/testrail-api.types';

import logger from '@logger';

class TestRailReporter implements Reporter {
    private readonly testRailClient: TestRail;

    private readonly isSetupCorrectly: boolean = false;

    private arrayTestRuns: ProjectSuiteCombo[] | undefined;
    private arrayTestResults: TestRailCaseResult[];

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
        if (!this.isSetupCorrectly) {
            logger.error('Reporter options are not valid, no test runs will be created');
            return;
        }

        if (result.status !== 'passed' && result.status !== 'failed') {
            logger.warn('Test run was either interrupted or timed out, no test runs will be created');

            return;
        }

        if (!this.arrayTestRuns) {
            logger.warn('No tags in expected format found');

            return;
        }

        logger.debug('Runs to create', this.arrayTestRuns);

        const arrayTestRunsCreated = [];

        for (const projectSuiteCombo of this.arrayTestRuns) {
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

        const finalResults = groupTestResults(this.arrayTestResults, arrayTestRunsCreated).map((finalResult) => {
            return filterDuplicatingCases(finalResult);
        });
        logger.debug('Test runs to update', finalResults);

        if (finalResults.length === 0) {
            logger.warn('No test runs to update');

            return;
        }

        const arrayRunIds = finalResults.map((finalResult) => finalResult.runId);

        logger.info(`Adding results to runs ${arrayRunIds.join(', ')}`);
        await Promise.all(finalResults.map((finalResult) => this.testRailClient.addTestRunResults(finalResult.runId, finalResult.arrayCaseResults)));

        if (this.closeRuns) {
            logger.info(`Closing runs ${arrayRunIds.join(', ')}`);
            await Promise.all(finalResults.map((finalResult) => this.testRailClient.closeTestRun(finalResult.runId)));
        }

        const finalMessage = this.closeRuns
            ? 'All test runs have been updated and closed ✅'
            : 'All test runs have been updated ✅';

        logger.info(finalMessage);
    }

    printsToStdio(): boolean {
        return true;
    }
}

export { TestRailReporter };