import { stripVTControlCharacters } from 'util';

import type { TestCase, TestResult } from '@playwright/test/reporter';

import { parseSingleTestTags } from '@reporter/utils/tags';

import { TestRailCaseResult, TestRailCaseStatus } from '@types-internal/testrail-api.types';

/**
 * Converts a Playwright test status to the corresponding TestRail status.
 * @param status The Playwright test status ('passed', 'failed', 'timedOut', 'skipped', 'interrupted').
 * @returns The corresponding TestRail status:
 * - passed -> TestRailCaseStatus.passed
 * - failed/timedOut/interrupted -> TestRailCaseStatus.failed
 * - skipped -> TestRailCaseStatus.blocked
 * - others -> TestRailCaseStatus.untested
 */
export function convertTestStatus(status: TestResult['status']): TestRailCaseStatus {
    switch (status) {
        case 'passed':
            return TestRailCaseStatus.passed;
        case 'failed':
        case 'timedOut':
        case 'interrupted':
            return TestRailCaseStatus.failed;
        case 'skipped':
            return TestRailCaseStatus.blocked;
        default:
            return TestRailCaseStatus.untested;
    }
}

/**
 * Generates a comment string based on the Playwright test result.
 * @param testResult The Playwright test result object.
 * @returns A descriptive comment based on the test status:
 * - passed: "Test passed in {duration}ms"
 * - failed: "Test failed: {error message}"
 * - timedOut: "Test timed out in {duration}ms"
 * - interrupted: "Test interrupted"
 * - skipped: "Test skipped"
 * - unknown: "Test finished with unknown status"
 */
export function generateTestComment(testCase: TestCase, testResult: TestResult): string {
    const errorMessage = stripVTControlCharacters(testResult.errors[0]?.message ?? 'Unknown error');

    switch (testResult.status) {
        case 'passed':
            return `${testCase.title} passed in ${testResult.duration}ms`;
        case 'failed':
            return `${testCase.title} failed: ${errorMessage}`;
        case 'timedOut':
            return `${testCase.title} timed out in ${testResult.duration}ms`;
        case 'interrupted':
            return `${testCase.title} interrupted`;
        case 'skipped':
            return `${testCase.title} skipped`;
        default:
            return `${testCase.title} finished with unknown status`;
    }
}

/**
 * Converts Playwright test results to TestRail case results.
 * @param params Object containing test case and result information
 * @param params.testCase Playwright test case containing tags with TestRail case IDs
 * @param params.testResult Playwright test result with status and other details
 * @returns Array of TestRail case results. Each result includes:
 * - case_id: TestRail case ID extracted from tags
 * - status_id: Converted TestRail status based on test result
 * - comment: Generated comment about test execution
 * Returns empty array if no TestRail case IDs found in tags
 */
export function convertTestResult({
    testCase,
    testResult
}: {
    testCase: TestCase,
    testResult: TestResult
}): TestRailCaseResult[] {
    const parsedTags = parseSingleTestTags(testCase.tags);

    if (parsedTags) {
        return parsedTags.map((tag) => (
            tag.arrayCaseIds.map((caseId) => ({
                case_id: caseId,
                status_id: convertTestStatus(testResult.status),
                comment: generateTestComment(testCase, testResult)
            }))
        )).flat();
    }

    return [];
}