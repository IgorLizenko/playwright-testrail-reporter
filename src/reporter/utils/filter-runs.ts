import type { ProjectSuiteCombo } from '@types-internal/playwright-reporter.types';
import type { TestRailPayloadUpdateRunResult } from '@types-internal/testrail-api.types';
import { TestRailCaseStatus } from '@types-internal/testrail-api.types';

import logger from '@logger';

function filterOutEmptyRuns(arrayTestRuns: ProjectSuiteCombo[], arrayTestResults: TestRailPayloadUpdateRunResult[]): ProjectSuiteCombo[] {
    const filteredOutTestRuns = arrayTestRuns.filter((run) => {
        const resultsForRun = arrayTestResults.filter((result) => run.arrayCaseIds.includes(result.case_id));

        if (resultsForRun.length === 0) {
            return false;
        }

        const hasNonSkippedResult = resultsForRun.some((result) => result.status_id !== TestRailCaseStatus.blocked);

        return hasNonSkippedResult;
    });

    logger.debug(`Run filtration done, initial runs: ${arrayTestRuns.length}, filtered runs: ${filteredOutTestRuns.length}`);

    if (filteredOutTestRuns.length !== arrayTestRuns.length) {
        logger.warn(`Filtered out ${arrayTestRuns.length - filteredOutTestRuns.length} empty test runs`);
    }

    return filteredOutTestRuns;
}

export { filterOutEmptyRuns };