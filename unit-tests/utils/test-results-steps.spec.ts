import { TestCase, TestResult, TestStep } from '@playwright/test/reporter';

import { convertTestResult } from '@reporter/utils/test-results';

import logger from '@logger';

jest.mock('@logger', () => ({
    error: jest.fn(),
    debug: jest.fn()
}));

describe('Test results with test steps', () => {
    const testStepRegular = {
        title: 'Just a step',
        duration: 5_000,
        category: 'test.step'
    } as TestStep;

    const testStepNotMatching = {
        title: 'Step 1 @R99999',
        duration: 5_000,
        category: 'test.step'
    } as TestStep;

    const testStepPassing = {
        title: 'Step 1 @C555',
        duration: 5_000,
        category: 'test.step'
    } as TestStep;

    const testStepFailing = {
        title: 'Step 1 @555',
        duration: 5_000,
        category: 'test.step',
        error: { message: 'Custom error', stack: 'Stack' }
    } as TestStep;

    const testStepMultitag = {
        title: 'Step 1 @555 @444',
        duration: 5_000,
        category: 'test.step'
    } as TestStep;

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
        tags: ['@111-222-555', '@111-222-444', '@111-222-333']
    } as TestCase;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('Should log an error is steps do not match case ids', () => {
        const testResult = { ...fullTestResult, steps: [testStepNotMatching] };
        const testCase = { ...fullTestCase };
        convertTestResult({ testCase, testResult });
        expect(logger.error).toHaveBeenCalledWith('Test step contains invalid TestRail case ID: 99999');
    });

    it('Should log debug message if tagged steps detected', () => {
        const testResult = { ...fullTestResult, steps: [testStepPassing] };
        const testCase = { ...fullTestCase };
        convertTestResult({ testCase, testResult });
        expect(logger.debug).toHaveBeenCalledWith('Tagged steps detected for Basic test');
    });

    it('Should not log debug message if no steps are detected', () => {
        const testResult = { ...fullTestResult };
        const testCase = { ...fullTestCase };
        convertTestResult({ testCase, testResult });
        expect(logger.debug).not.toHaveBeenCalled();
    });

    it('Should not log debug message if test steps are not tagged', () => {
        const testResult = { ...fullTestResult, steps: [testStepRegular] };
        const testCase = { ...fullTestCase };
        convertTestResult({ testCase, testResult });
        expect(logger.debug).not.toHaveBeenCalled();
    });

    it('Should rewrite passed test results if the whole test fails', () => {
        const testResult = { ...fullTestResult, steps: [testStepPassing], status: 'failed' as const };
        const testCase = { ...fullTestCase };
        const results = convertTestResult({ testCase, testResult });
        expect(results).toEqual([
            {
                case_id: 555,
                comment: 'Basic test (Step 1 @C555) passed in 5s',
                elapsed: '5s',
                status_id: 1
            },
            {
                case_id: 444,
                comment: 'Basic test failed in 25s:\n\nUnknown error',
                elapsed: '25s',
                status_id: 5
            },
            {
                case_id: 333,
                comment: 'Basic test failed in 25s:\n\nUnknown error',
                elapsed: '25s',
                status_id: 5
            }
        ]);
    });

    it('Should rewrite passed test results for steps with multiple tags', () => {
        const testResult = { ...fullTestResult, steps: [testStepMultitag], status: 'failed' as const };
        const testCase = { ...fullTestCase };
        const results = convertTestResult({ testCase, testResult });
        expect(results).toEqual([
            {
                case_id: 555,
                comment: 'Basic test (Step 1 @555 @444) passed in 5s',
                elapsed: '5s',
                status_id: 1
            },
            {
                case_id: 444,
                comment: 'Basic test (Step 1 @555 @444) passed in 5s',
                elapsed: '5s',
                status_id: 1
            },
            {
                case_id: 333,
                comment: 'Basic test failed in 25s:\n\nUnknown error',
                elapsed: '25s',
                status_id: 5
            }
        ]);
    });

    it('Should ignore failed test steps if the whole test fails', () => {
        const resultsWithSteps = convertTestResult({
            testCase: { ...fullTestCase },
            testResult: { ...fullTestResult, steps: [testStepFailing], status: 'failed' as const }
        });
        const resultsWithoutSteps = convertTestResult({
            testCase: { ...fullTestCase },
            testResult: { ...fullTestResult, status: 'failed' as const }
        });
        expect(resultsWithSteps).toEqual(resultsWithoutSteps);
    });
});