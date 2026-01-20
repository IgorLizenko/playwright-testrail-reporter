import { stripVTControlCharacters } from 'util';

import type { TestCase, TestError, TestResult, TestStep } from '@playwright/test/reporter';

import { parseArrayOfTags, parseSingleTag, REGEX_TAG_STEP } from '@reporter/utils/tags';

import type { AttachmentData } from '@types-internal/playwright-reporter.types';
import { TestRailCaseStatus, type TestRailPayloadUpdateRunResult } from '@types-internal/testrail-api.types';

import logger from '@logger';

/**
 * Formats a duration in milliseconds to a human-readable string.
 * @param ms The duration in milliseconds
 * @returns A formatted string in the format "Xs" for durations under 1 minute, or "Xm Ys" for durations over 1 minute
 */
function formatMilliseconds(ms: number): string {
    // Round up to 1 second if test duration is 0
    const millisecondsToUse = ms || 1;

    const seconds = Math.ceil(millisecondsToUse / 1000);

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

/**
 * Formats a single test error into a readable string.
 * @param error The test error object to format
 * @returns A formatted error message string with control characters stripped
 */
function formatSingleError(error: TestError): string {
    const errorMessage = error.stack ?? error.message ?? 'Unknown error';

    return stripVTControlCharacters(errorMessage);
}

/**
 * Formats an array of test errors into a single readable message.
 * @param arrayErrors Array of test errors to format
 * @returns A formatted string containing all error messages. If multiple errors exist, they are numbered and separated by newlines
 */
function formatErrorMessage(arrayErrors: TestResult['errors']): string {
    if (arrayErrors.length === 0) {
        return 'Unknown error';
    }

    if (arrayErrors.length === 1) {
        return formatSingleError(arrayErrors[0]);
    }

    return arrayErrors.map((error, index) => {
        return `Error #${index + 1}: ${formatSingleError(error)}`;
    }).join('\n\n');
}

/**
 * Formats a success message for a passed test.
 * @param title The test title
 * @param duration The formatted test duration
 * @returns A formatted success message string
 */
function formatPassedMessage(title: string, duration: string): string {
    return `${title} passed in ${duration}`;
}

/**
 * Formats a failure message for a failed test.
 * @param params Object containing test details
 * @param params.title The test title
 * @param params.duration The formatted test duration
 * @param params.errors Array of test errors
 * @returns A formatted failure message string including error details
 */
function formatFailedMessage({
    title,
    duration,
    errors
}: {
    title: string,
    duration: string,
    errors: TestError[]
}): string {
    return `${title} failed in ${duration}:\n\n${formatErrorMessage(errors)}`;
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
    const duration = formatMilliseconds(testResult.duration);

    switch (testResult.status) {
        case 'passed':
            return formatPassedMessage(testCase.title, duration);
        case 'failed':
            return formatFailedMessage({
                title: testCase.title,
                duration,
                errors: testResult.errors
            });
        case 'timedOut':
            return `${testCase.title} timed out in ${duration}`;
        case 'interrupted':
            return `${testCase.title} interrupted`;
        case 'skipped':
            return `${testCase.title} skipped`;
        default:
            return `${testCase.title} finished with unknown status`;
    }
}

/**
 * Updates test results based on test steps by matching TestRail case IDs.
 * For each non-errored test step, extracts all TestRail case IDs from its title and marks
 * the corresponding test results as passed. A single test step can contain multiple TestRail case IDs.
 *
 * @param {Object} params - The parameters object
 * @param {TestRailPayloadUpdateRunResult[]} params.arrayTestResults - Array of test results to be updated
 * @param {TestStep[]} params.arrayTestSteps - Array of test steps to process
 * @param {TestCase['title']} params.testName - The name of the test case
 * @returns {TestRailPayloadUpdateRunResult[]} Updated array of test results with modified status_id values
 */
function alterTestResultsFromSteps({
    arrayTestResults,
    arrayTestSteps,
    testName
}: {
    arrayTestResults: TestRailPayloadUpdateRunResult[],
    arrayTestSteps: TestStep[],
    testName: TestCase['title']
}): TestRailPayloadUpdateRunResult[] {
    const updatedResults = structuredClone(arrayTestResults);

    for (const testStep of arrayTestSteps) {
        const arrayMatchingCaseIds = testStep.title.matchAll(REGEX_TAG_STEP);

        for (const regexResult of arrayMatchingCaseIds) {
            const parsedCaseId = parseInt(regexResult[1], 10);

            const matchingTestResult = updatedResults.find((testResult) => testResult.case_id === parsedCaseId);
            const duration = formatMilliseconds(testStep.duration);

            if (matchingTestResult && !testStep.error) {
                matchingTestResult.status_id = TestRailCaseStatus.passed;
                matchingTestResult.comment = formatPassedMessage(`${testName} (${testStep.title})`, duration);
                matchingTestResult.elapsed = duration;
            } else {
                logger.error(`Test step contains invalid TestRail case ID: ${parsedCaseId}`);
            }
        }
    }

    return updatedResults;
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

    let arrayTestResults: TestRailPayloadUpdateRunResult[] = [];

    if (parsedTags.length > 0) {
        arrayTestResults = parsedTags.map((tag) => (
            tag.arrayCaseIds.map((caseId) => ({
                case_id: caseId,
                status_id: convertTestStatus(testResult.status),
                comment: generateTestComment(testCase, testResult),
                elapsed: formatMilliseconds(testResult.duration)
            }))
        )).flat();

        const arrayTaggedSteps = testResult.steps
            .filter((step) => step.category === 'test.step' && step.title.match(REGEX_TAG_STEP));

        if (arrayTaggedSteps.length > 0) {
            logger.debug(`Tagged steps detected for ${testCase.title}`);
            arrayTestResults = alterTestResultsFromSteps({
                arrayTestResults,
                arrayTestSteps: arrayTaggedSteps,
                testName: testCase.title
            });
        }
    }

    return arrayTestResults;
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