import type { TestCase, TestResult } from '@playwright/test/reporter';

import { convertTestResult } from '@reporter/utils/test-results';

import { TestRailCaseStatus } from '@types-internal/testrail-api.types';

describe('Generate test result based on Playwright TestCase and TestResult', () => {
    const fullTestResult: TestResult = {
        status: 'passed' as const,
        duration: 25_000,
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

    const fullTestCase: TestCase = {
        title: 'Basic test',
        tags: ['@111-222-333']
    } as TestCase;

    it('Should convert test and result to TestRail case result', () => {
        const testResult = { ...fullTestResult };
        const testCase = { ...fullTestCase };
        expect(convertTestResult({ testCase, testResult })).toEqual([
            {
                case_id: 333,
                status_id: TestRailCaseStatus.passed,
                comment: 'Basic test passed in 25s'
            }
        ]);
    });

    it('Should return empty array if test has no tags', () => {
        const testCase = { ...fullTestCase, tags: [] };
        const testResult = { ...fullTestResult };
        expect(convertTestResult({ testCase, testResult })).toEqual([]);
    });
});