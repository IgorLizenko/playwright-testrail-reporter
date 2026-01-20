import type { ProjectSuiteCombo } from '@types-internal/playwright-reporter.types';
import type { TestRailPayloadUpdateRunResult } from '@types-internal/testrail-api.types';
import { TestRailCaseStatus } from '@types-internal/testrail-api.types';

import logger from '@logger';

/**
 * Filters out empty test runs from the provided array.
 * A run is considered empty if it has no results or all results are skipped (blocked status).
 * @param arrayTestRuns Array of test runs to filter
 * @param arrayTestResults Array of all test results
 * @returns Array of non-empty test runs
 */
function filterOutEmptyRuns(arrayTestRuns: ProjectSuiteCombo[], arrayTestResults: TestRailPayloadUpdateRunResult[]): ProjectSuiteCombo[] {
    const nonEmptyRuns = arrayTestRuns.filter((run) => {
        const resultsForRun = arrayTestResults.filter((result) => run.arrayCaseIds.includes(result.case_id));

        if (resultsForRun.length === 0) {
            return false;
        }

        const hasNonSkippedResult = resultsForRun.some((result) => result.status_id !== TestRailCaseStatus.blocked);

        return hasNonSkippedResult;
    });

    logger.debug(`Run filtration done, initial runs: ${arrayTestRuns.length}, filtered runs: ${nonEmptyRuns.length}`);

    if (nonEmptyRuns.length !== arrayTestRuns.length) {
        logger.warn(`Filtered out ${arrayTestRuns.length - nonEmptyRuns.length} empty test runs`);
    }

    return nonEmptyRuns;
}

export { filterOutEmptyRuns };