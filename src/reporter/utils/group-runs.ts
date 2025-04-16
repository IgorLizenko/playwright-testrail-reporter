import type { FinalResult, RunCreated } from '@types-internal/playwright-reporter.types';
import type { TestRailCaseResult } from '@types-internal/testrail-api.types';
import { TestRailCaseStatus } from '@types-internal/testrail-api.types';

/**
 * Groups test results by test runs based on case IDs.
 * @param runsCreated Array of runs with their case IDs
 * @returns Array of final results grouped by runs
 */
function groupTestResults(arrayTestResults: TestRailCaseResult[], arrayTestRuns: RunCreated[]): FinalResult[] {
    return arrayTestRuns.map((run) => {
        const arrayCaseResults = arrayTestResults.filter((result) => {
            return run.arrayCaseIds.includes(result.case_id);
        });

        return {
            runId: run.runId,
            arrayCaseResults
        };
    });
}

/**
 * Compares two test case results by their status priority
 * Priority order: passed > failed > blocked > untested > retest
 * @param a First test case result
 * @param b Second test case result
 * @returns Positive if b has higher priority, negative if a has higher priority
 */
function compareByStatusPriority(a: TestRailCaseResult, b: TestRailCaseResult): number {
    const priorityOrder: Record<TestRailCaseStatus, number> = {
        [TestRailCaseStatus.passed]: 4,
        [TestRailCaseStatus.failed]: 3,
        [TestRailCaseStatus.blocked]: 2,
        [TestRailCaseStatus.untested]: 1
    };
    return priorityOrder[b.status_id] - priorityOrder[a.status_id];
}

/**
 * Filters out duplicating cases from a single run's results.
 * @param singleResult The final result containing run ID and array of case results
 * @returns The same final result with no duplicating cases
 */
function filterDuplicatingCases(singleResult: FinalResult): FinalResult {
    const caseResultsMap = new Map<number, TestRailCaseResult[]>();
    for (const result of singleResult.arrayCaseResults) {
        const existing = caseResultsMap.get(result.case_id) ?? [];
        caseResultsMap.set(result.case_id, [...existing, result]);
    }

    const filteredResults: TestRailCaseResult[] = [];
    for (const [, caseResults] of caseResultsMap) {
        if (caseResults.length === 1) {
            filteredResults.push(caseResults[0]);
        } else {
            const sortedResults = caseResults.sort(compareByStatusPriority);
            filteredResults.push(sortedResults[0]);
        }
    }
    return {
        runId: singleResult.runId,
        arrayCaseResults: filteredResults
    };
}

export { groupTestResults, filterDuplicatingCases };