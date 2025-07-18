import type { TestCase, TestResult } from '@playwright/test/reporter';

import { convertTestStatus, generateTestComment } from '@reporter/utils/test-results';

import { TestRailCaseStatus } from '@types-internal/testrail-api.types';

describe('Test results basic unit tests', function () {
    describe('Convert test status tests', function () {
        it('Should convert passed status to passed', function () {
            expect(convertTestStatus('passed')).toEqual(TestRailCaseStatus.passed);
        });

        it('Should convert failed status to failed', function () {
            expect(convertTestStatus('failed')).toEqual(TestRailCaseStatus.failed);
        });

        it('Should convert timedOut status to failed', function () {
            expect(convertTestStatus('timedOut')).toEqual(TestRailCaseStatus.failed);
        });

        it('Should convert interrupted status to failed', function () {
            expect(convertTestStatus('interrupted')).toEqual(TestRailCaseStatus.failed);
        });

        it('Should convert skipped status to blocked', function () {
            expect(convertTestStatus('skipped')).toEqual(TestRailCaseStatus.blocked);
        });

        it('Should convert unknown status to untested', function () {
            const status = 'unknown' as TestResult['status'];
            expect(convertTestStatus(status)).toEqual(TestRailCaseStatus.untested);
        });
    });

    describe('Generate test comment', function () {
        const fullTestResult: TestResult = {
            status: 'passed' as const,
            duration: 650,
            error: undefined,
            errors: [],
            retry: 0,
            startTime: new Date('2025-04-15T14:32:20.000Z'),
            attachments: [],
            stdout: [],
            stderr: [],
            steps: [],
            workerIndex: 0,
            parallelIndex: 0,
            annotations: []
        };

        const testCase = {
            title: 'Basic test'
        } as TestCase;

        it('Should generate passed comment', function () {
            const testResult = { ...fullTestResult };
            expect(generateTestComment(testCase, testResult)).toEqual('Basic test passed in 1s');
        });

        it('Should generate passed comment if test is in passed status but has some errors', function () {
            const testResult = { ...fullTestResult, errors: [{ stack: 'Custom error' }] };
            expect(generateTestComment(testCase, testResult)).toEqual('Basic test passed in 1s');
        });

        it('Should generate passed comment for a test that runs for several minutes', function () {
            const testResult = { ...fullTestResult, duration: 360_000 };
            expect(generateTestComment(testCase, testResult)).toEqual('Basic test passed in 6m 0s');
        });

        it('Should generate failed comment with unknown error', function () {
            const testResult = { ...fullTestResult, status: 'failed' as const };
            expect(generateTestComment(testCase, testResult)).toEqual('Basic test failed in 1s:\n\nUnknown error');
        });

        it('Should generate failed comment with unknown error if test has an empty errors array', function () {
            const testResult = { ...fullTestResult, status: 'failed' as const, errors: [] };
            expect(generateTestComment(testCase, testResult)).toEqual('Basic test failed in 1s:\n\nUnknown error');
        });

        it('Should generate failed comment with custom error', function () {
            const testResult = { ...fullTestResult, status: 'failed' as const, errors: [{ stack: 'Custom error' }] };
            expect(generateTestComment(testCase, testResult)).toEqual('Basic test failed in 1s:\n\nCustom error');
        });

        it('Should generate failed comment for errors with no stack', function () {
            const testResult = { ...fullTestResult, status: 'failed' as const, errors: [{ message: 'Custom error' }] };
            expect(generateTestComment(testCase, testResult)).toEqual('Basic test failed in 1s:\n\nCustom error');
        });

        it('Should generate failed comment for existing errors array with no message', function () {
            const testResult = { ...fullTestResult, status: 'failed' as const, errors: [{}] };
            expect(generateTestComment(testCase, testResult)).toEqual('Basic test failed in 1s:\n\nUnknown error');
        });

        it('Should format errors if test had several of them', function () {
            const testResult = {
                ...fullTestResult,
                status: 'failed' as const,
                errors: [{ stack: 'Custom error 1' }, { stack: 'Custom error 2' }, { stack: 'Another error' }]
            };
            expect(generateTestComment(testCase, testResult)).toEqual('Basic test failed in 1s:\n\nError #1: Custom error 1\n\nError #2: Custom error 2\n\nError #3: Another error');
        });

        it('Should format errors if test had several of them and some of them are unvalid', function () {
            const testResult = {
                ...fullTestResult,
                status: 'failed' as const,
                errors: [{ stack: 'Custom error 1' }, {}, { stack: 'Another error' }]
            };
            expect(generateTestComment(testCase, testResult)).toEqual('Basic test failed in 1s:\n\nError #1: Custom error 1\n\nError #2: Unknown error\n\nError #3: Another error');
        });

        it('Should generate timed out comment', function () {
            const testResult = { ...fullTestResult, status: 'timedOut' as const };
            expect(generateTestComment(testCase, testResult)).toEqual('Basic test timed out in 1s');
        });

        it('Should generate interrupted comment', function () {
            const testResult = { ...fullTestResult, status: 'interrupted' as const };
            expect(generateTestComment(testCase, testResult)).toEqual('Basic test interrupted');
        });

        it('Should generate skipped comment', function () {
            const testResult = { ...fullTestResult, status: 'skipped' as const };
            expect(generateTestComment(testCase, testResult)).toEqual('Basic test skipped');
        });

        it('Should generate unknown status comment', function () {
            // Using a type assertion to test the default case while maintaining type safety
            const testResult = { ...fullTestResult, status: 'failed' as TestResult['status'] | 'unknown' };
            testResult.status = 'unknown';
            expect(generateTestComment(testCase, testResult as TestResult)).toEqual('Basic test finished with unknown status');
        });
    });
});