import type { TestCase, TestResult } from '@playwright/test/reporter';

import { convertTestResult, extractAttachmentData } from '@reporter/utils/test-results';

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
        parallelIndex: 0,
        annotations: []
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
                comment: 'Basic test passed in 25s',
                elapsed: '25s'
            }
        ]);
    });

    it('Should convert a longer test and result to TestRail case result', () => {
        const testResult = { ...fullTestResult, duration: 720_000 };
        const testCase = { ...fullTestCase };
        expect(convertTestResult({ testCase, testResult })).toEqual([
            {
                case_id: 333,
                status_id: TestRailCaseStatus.passed,
                comment: 'Basic test passed in 12m 0s',
                elapsed: '12m 0s'
            }
        ]);
    });

    it('Should convert a zero second test correctly', () => {
        const testResult = { ...fullTestResult, duration: 0 };
        const testCase = { ...fullTestCase };
        expect(convertTestResult({ testCase, testResult })).toEqual([
            {
                case_id: 333,
                status_id: TestRailCaseStatus.passed,
                comment: 'Basic test passed in 1s',
                elapsed: '1s'
            }
        ]);
    });

    it('Should return empty array if test has no tags', () => {
        const testCase = { ...fullTestCase, tags: [] };
        const testResult = { ...fullTestResult };
        expect(convertTestResult({ testCase, testResult })).toEqual([]);
    });
});

describe('Extract attachment data', () => {
    it('Should handle testcase without proper tags', () => {
        const testCase = {
            tags: ['@other-tag', '@another-tag'],
            title: 'Test with invalid tags'
        } as TestCase;

        const testResult = {
            attachments: [
                { name: 'screenshot.png', path: '/path/to/screenshot.png' }
            ]
        } as unknown as TestResult;

        expect(extractAttachmentData({ testCase, testResult })).toEqual([]);
    });

    it('Should extract attachment data from test results with valid TestRail case IDs', () => {
        const testCase = {
            tags: ['@123-123-C123', '@456-456-C456'],
            title: 'Test with attachments'
        } as TestCase;

        const testResult = {
            attachments: [
                { name: 'screenshot1.png', path: '/path/to/screenshot1.png' },
                { name: 'screenshot2.png', path: '/path/to/screenshot2.png' }
            ]
        } as unknown as TestResult;

        const expected = [
            {
                caseId: 123,
                arrayFiles: ['/path/to/screenshot1.png', '/path/to/screenshot2.png']
            },
            {
                caseId: 456,
                arrayFiles: ['/path/to/screenshot1.png', '/path/to/screenshot2.png']
            }
        ];

        expect(extractAttachmentData({ testCase, testResult })).toEqual(expected);
    });

    it('Should filter out attachments without paths', () => {
        const testCase = {
            tags: ['@123-123-C123', '@456-456-C456'],
            title: 'Test with attachments'
        } as TestCase;

        const testResult = {
            attachments: [
                { name: 'screenshot1.png', path: '/path/to/screenshot1.png' },
                { name: 'screenshot2.png' }
            ]
        } as unknown as TestResult;

        const expected = [
            {
                caseId: 123,
                arrayFiles: ['/path/to/screenshot1.png']
            },
            {
                caseId: 456,
                arrayFiles: ['/path/to/screenshot1.png']
            }
        ];

        expect(extractAttachmentData({ testCase, testResult })).toEqual(expected);
    });

    it('Should return empty array for tests without attachments', () => {
        const testCase = {
            tags: ['@123-123-C123', '@456-456-C456'],
            title: 'Test without attachments'
        } as TestCase;

        const testResult = {
            attachments: []
        } as unknown as TestResult;

        expect(extractAttachmentData({ testCase, testResult })).toEqual([]);
    });
});