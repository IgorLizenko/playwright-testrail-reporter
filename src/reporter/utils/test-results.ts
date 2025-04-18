import { stripVTControlCharacters } from 'util';

import type { TestCase, TestResult } from '@playwright/test/reporter';

import { parseArrayOfTags, parseSingleTag } from '@reporter/utils/tags';

import type { AttachmentData } from '@types-internal/playwright-reporter.types';
import { TestRailCaseStatus, TestRailPayloadUpdateRunResult } from '@types-internal/testrail-api.types';

function formatMilliseconds(ms: number): string {
    const seconds = Math.ceil(ms / 1000);

    if (seconds < 60) {
        return `${seconds}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Converts a Playwright test status to the corresponding TestRail status.
 * @param status The Playwright test status ('passed', 'failed', 'timedOut', 'skipped', 'interrupted').
 * @returns The corresponding TestRail status:
 * - passed -> TestRailCaseStatus.passed
 * - failed/timedOut/interrupted -> TestRailCaseStatus.failed
 * - skipped -> TestRailCaseStatus.blocked
 * - others -> TestRailCaseStatus.untested
 */
function convertTestStatus(status: TestResult['status']): TestRailCaseStatus {
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

function formatErrorMessage(arrayErrors: TestResult['errors']): string {
    if (arrayErrors.length === 0) {
        return 'Unknown error';
    }

    if (arrayErrors.length === 1) {
        return stripVTControlCharacters(arrayErrors[0].message ?? 'Unknown error');
    }

    return arrayErrors.map((error, index) => {
        return `Error #${index + 1}: ${stripVTControlCharacters(error.message ?? 'Unknown error')}`;
    }).join('\n');
}

/**
 * Generates a comment string based on the Playwright test result.
 * @param testResult The Playwright test result object.
 * @returns A descriptive comment based on the test status:
 * - passed: "Test passed in {duration} seconds"
 * - failed: "Test failed: {error message}"
 * - timedOut: "Test timed out in {duration} seconds"
 * - interrupted: "Test interrupted"
 * - skipped: "Test skipped"
 * - unknown: "Test finished with unknown status"
 */
function generateTestComment(testCase: TestCase, testResult: TestResult): string {
    const durationString = formatMilliseconds(testResult.duration);

    switch (testResult.status) {
        case 'passed':
            return `${testCase.title} passed in ${durationString}`;
        case 'failed':
            return `${testCase.title} failed:\n${formatErrorMessage(testResult.errors)}`;
        case 'timedOut':
            return `${testCase.title} timed out in ${durationString}`;
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
function convertTestResult({
    testCase,
    testResult
}: {
    testCase: TestCase,
    testResult: TestResult
}): TestRailPayloadUpdateRunResult[] {
    const parsedTags = parseArrayOfTags(testCase.tags);

    if (parsedTags) {
        return parsedTags.map((tag) => (
            tag.arrayCaseIds.map((caseId) => ({
                case_id: caseId,
                status_id: convertTestStatus(testResult.status),
                comment: generateTestComment(testCase, testResult),
                elapsed: formatMilliseconds(testResult.duration)
            }))
        )).flat();
    }

    return [];
}

/**
 * Extracts attachment data from test results based on TestRail case IDs found in test tags.
 * @param {Object} params - The parameters object
 * @param {TestCase} params.testCase - The test case containing tags with TestRail case IDs
 * @param {TestResult} params.testResult - The test result containing attachments
 * @returns {AttachmentData[]} Array of attachment data objects, each containing a TestRail case ID and array of file paths.
 * Returns empty array if no attachments present or no valid TestRail case IDs found in tags.
 */
function extractAttachmentData({
    testCase,
    testResult
}: {
    testCase: TestCase,
    testResult: TestResult
}): AttachmentData[] {
    if (testResult.attachments.length === 0) {
        return [];
    }

    const arrayParsedValidTags = testCase.tags
        .map((tag) => parseSingleTag(tag))
        .filter((parsedTag) => parsedTag !== null);

    if (arrayParsedValidTags.length === 0) {
        return [];
    }

    return arrayParsedValidTags.map((tag) => {
        return {
            caseId: tag.caseId,
            arrayFiles: testResult.attachments
                .filter((attachment) => attachment.path)
                .map((attachment) => attachment.path!)
        };
    }).flat();
}

export { convertTestStatus, generateTestComment, convertTestResult, extractAttachmentData };