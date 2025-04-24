import { stripVTControlCharacters } from 'util';

import type { TestCase, TestError, TestResult, TestStep } from '@playwright/test/reporter';

import { parseArrayOfTags, parseSingleTag, REGEX_TAG_STEP } from '@reporter/utils/tags';

import type { AttachmentData } from '@types-internal/playwright-reporter.types';
import { TestRailCaseStatus, TestRailPayloadUpdateRunResult } from '@types-internal/testrail-api.types';

import logger from '@logger';

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

function formatSingleError(error: TestError): string {
    const errorMessage = error.stack ?? error.message ?? 'Unknown error';

    return stripVTControlCharacters(errorMessage);
}

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

function formatPassedMessage(title: string, duration: string): string {
    return `${title} passed in ${duration}`;
}

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
 * For each non-errored test step that contains a valid TestRail case ID, marks the corresponding test result as passed.
 *
 * @param {TestRailPayloadUpdateRunResult[]} arrayTestResults - Array of test results to be updated
 * @param {TestStep[]} testSteps - Array of test steps to process
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
            const parsedCaseId = parseInt(regexResult[1]);

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

    if (parsedTags) {
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