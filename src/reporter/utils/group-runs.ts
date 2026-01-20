import type { AttachmentData, CaseResultMatch, FinalResult, RunCreated } from '@types-internal/playwright-reporter.types';
import type { TestRailPayloadAddAttachment, TestRailPayloadUpdateRunResult } from '@types-internal/testrail-api.types';
import { TestRailCaseStatus } from '@types-internal/testrail-api.types';

import logger from '@logger';

/**
 * Groups test results by test runs based on case IDs.
 * @param arrayTestResults Array of TestRail run results
 * @param arrayTestRuns Array of runs with their case IDs
 * @returns Array of final results grouped by runs
 */
function groupTestResults(arrayTestResults: TestRailPayloadUpdateRunResult[], arrayTestRuns: RunCreated[]): FinalResult[] {
    if (arrayTestRuns.length === 0) {
        logger.error('No test runs provided');
    }

    return arrayTestRuns.map((run) => {
        const arrayCaseResults = arrayTestResults.filter((result) => {
            return run.arrayCaseIds.includes(result.case_id);
        });

        if (arrayCaseResults.length === 0) {
            logger.error(`No matching cases found for run ID: ${run.runId}`);
        }

        return {
            runId: run.runId,
            arrayCaseResults
        };
    });
}

/**
 * Compares two test case results by their status priority
 * Priority order: passed > failed > blocked > untested
 * @param a First test case result
 * @param b Second test case result
 * @returns Positive if b has higher priority, negative if a has higher priority
 */
function compareByStatusPriority(a: TestRailPayloadUpdateRunResult, b: TestRailPayloadUpdateRunResult): number {
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
    const caseResultsMap = new Map<number, TestRailPayloadUpdateRunResult[]>();
    for (const result of singleResult.arrayCaseResults) {
        const existing = caseResultsMap.get(result.case_id);
        if (!existing) {
            caseResultsMap.set(result.case_id, [result]);
        } else {
            existing.push(result);
        }
    }

    const filteredResults: TestRailPayloadUpdateRunResult[] = [];
    for (const [, caseResults] of caseResultsMap) {
        if (caseResults.length === 1) {
            filteredResults.push(caseResults[0]);
        } else {
            logger.warn('Multiple results found for case ID:', caseResults[0].case_id);
            const sortedResults = caseResults.sort(compareByStatusPriority);
            filteredResults.push(sortedResults[0]);
        }
    }
    return {
        runId: singleResult.runId,
        arrayCaseResults: filteredResults
    };
}

/**
 * Groups attachments with their corresponding test results based on case IDs.
 * @param {AttachmentData[]} arrayAttachments - Array of attachment data containing case IDs and files
 * @param {CaseResultMatch[]} arrayCaseResults - Array of case-to-result mappings
 * @returns {TestRailPayloadAddAttachment[]} Array of mapped attachments with result IDs and file data
 */
function groupAttachments(arrayAttachments: AttachmentData[], arrayCaseResults: CaseResultMatch[]): TestRailPayloadAddAttachment[] {
    if (arrayAttachments.length === 0 || arrayCaseResults.length === 0) {
        return [];
    }

    const mappedAttachments: TestRailPayloadAddAttachment[] = [];

    arrayAttachments.forEach((attachment) => {
        const matchingResult = arrayCaseResults.find((mapping) =>
            mapping.caseId === attachment.caseId
        );

        if (matchingResult) {
            mappedAttachments.push(...attachment.arrayFiles.map((file) => ({
                resultId: matchingResult.resultId,
                attachment: file
            })));
        } else {
            logger.error('No matching result found for attachments of case ID:', attachment.caseId);
        }
    });

    return mappedAttachments;
}

function compileFinalResults(arrayTestResults: TestRailPayloadUpdateRunResult[], arrayTestRuns: RunCreated[]): FinalResult[] {
    const arrayAllResults = groupTestResults(arrayTestResults, arrayTestRuns);
    return arrayAllResults.map((finalResult) => filterDuplicatingCases(finalResult));
}

export { groupTestResults, filterDuplicatingCases, groupAttachments, compileFinalResults };