import type {
    FullConfig, FullResult, Reporter, Suite, TestCase, TestResult
} from '@playwright/test/reporter';

import { TestRail } from '@testrail-api/testrail-api';

import { groupTestResults } from '@reporter/utils/group-runs';
import { parseTestTags } from '@reporter/utils/tags';
import { convertTestResult } from '@reporter/utils/test-results';
import { validateSettings } from '@reporter/utils/validate-settings';

import { ReporterOptions } from '@types-internal/playwright-reporter.types';
import type { TestRailCaseResult, TestRailRunWithAdditionalData } from '@types-internal/testrail-api.types';

import logger from '@logger';

class TestRailReporter implements Reporter {
    private readonly testRailClient: TestRail;

    private readonly isSetupCorrectly: boolean = false;

    private arrayTestRunPromises: Promise<TestRailRunWithAdditionalData | null>[] = [];
    private arrayTestResults: TestRailCaseResult[];

    constructor(options: ReporterOptions) {
        this.isSetupCorrectly = validateSettings(options);
        logger.debug('Setting up TestRail API client');
        this.testRailClient = new TestRail(options);

        this.arrayTestResults = [];
    }

    onBegin?(_config: FullConfig, suite: Suite): void {
        if (!this.isSetupCorrectly) {
            logger.error('Reporter options are not valid, skipping creating test runs');
            return;
        }

        const runsToCreate = parseTestTags(suite.allTests().map((test) => test.tags).flat());
        logger.debug('Runs to create', runsToCreate);

        if (runsToCreate) {
            this.arrayTestRunPromises = runsToCreate.map((projectSuiteCombo) => {
                logger.info(`Creating a test run for project ${projectSuiteCombo.projectId} and suite ${projectSuiteCombo.suiteId}...`);
                const name = `Playwright Run ${new Date().toUTCString()}`;
                return this.testRailClient.addTestRun({
                    projectId: projectSuiteCombo.projectId,
                    suiteId: projectSuiteCombo.suiteId,
                    name,
                    cases: projectSuiteCombo.arrayCaseIds
                });
            });
        } else {
            logger.warn('No tags in expected format found');
        }
    }

    onTestEnd(testCase: TestCase, testResult: TestResult): void {
        logger.debug(`Finished test ${testCase.title}: ${testResult.status}`);
        this.arrayTestResults.push(...convertTestResult({ testCase, testResult }));
    }

    async onEnd(result: FullResult): Promise<void> {
        if (!this.isSetupCorrectly) {
            logger.error('Reporter options are not valid, skipping updating test runs');
            return;
        }

        if (result.status !== 'passed' && result.status !== 'failed') {
            return;
        }

        // Wait for all runs to be created
        const runs = await Promise.all(this.arrayTestRunPromises);
        const arrayTestRuns = runs.filter((run) => run !== null).map((validRun) => {
            return {
                projectId: validRun.projectId,
                suiteId: validRun.suiteId,
                arrayCaseIds: validRun.cases,
                runId: validRun.id
            };
        });

        const finalResults = groupTestResults(this.arrayTestResults, arrayTestRuns);
        logger.debug('Test runs to update', finalResults);

        if (finalResults.length === 0) {
            logger.warn('No test runs to update');

            return;
        }

        for (const finalResult of finalResults) {
            logger.info(`Adding results to run ${finalResult.runId}...`);
            await this.testRailClient.addTestRunResults(finalResult.runId, finalResult.arrayCaseResults);
        }

        logger.info('All test runs have been updated 🥳');
    }

    printsToStdio(): boolean {
        return true;
    }
}

export { TestRailReporter };