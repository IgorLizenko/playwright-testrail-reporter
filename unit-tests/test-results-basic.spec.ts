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
            parallelIndex: 0
        };

        const testCase = {
            title: 'Basic test'
        } as TestCase;

        it('Should generate passed comment', function () {
            const testResult = { ...fullTestResult };
            expect(generateTestComment(testCase, testResult)).toEqual('Basic test passed in 1s');
        });

        it('Should generate passed comment for a test that runs for several minutes', function () {
            const testResult = { ...fullTestResult, duration: 360_000 };
            expect(generateTestComment(testCase, testResult)).toEqual('Basic test passed in 6m 0s');
        });

        it('Should generate failed comment with unknown error', function () {
            const testResult = { ...fullTestResult, status: 'failed' as const };
            expect(generateTestComment(testCase, testResult)).toEqual('Basic test failed: Unknown error');
        });

        it('Should generate failed comment with custom error', function () {
            const testResult = { ...fullTestResult, status: 'failed' as const, errors: [{ message: 'Custom error' }] };
            expect(generateTestComment(testCase, testResult)).toEqual('Basic test failed: Custom error');
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