import { filterDuplicatingCases, groupAttachments, groupTestResults } from '@reporter/utils/group-runs';

import type { AttachmentData, FinalResult, RunCreated, RunUpdated } from '@types-internal/playwright-reporter.types';
import { TestRailCaseStatus, TestRailPayloadUpdateRunResult } from '@types-internal/testrail-api.types';

import logger from '@logger';

jest.mock('@logger', () => ({
    error: jest.fn(),
    warn: jest.fn()
}));

describe('Group runs unit tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Group test results', () => {
        it('Should group single run and single test result', () => {
            const arrayTestResults: TestRailPayloadUpdateRunResult[] = [
                { case_id: 1, status_id: TestRailCaseStatus.passed, comment: 'Test 1' }
            ];

            const arrayTestRuns: RunCreated[] = [
                { projectId: 10, suiteId: 100, runId: 1000, arrayCaseIds: [1] }
            ];

            expect(groupTestResults(arrayTestResults, arrayTestRuns)).toEqual([
                {
                    runId: 1000,
                    arrayCaseResults: [
                        { case_id: 1, status_id: TestRailCaseStatus.passed, comment: 'Test 1' }
                    ]
                }
            ]);
        });

        it('Should log an error when no runs are provided', () => {
            const arrayTestResults: TestRailPayloadUpdateRunResult[] = [];
            const arrayTestRuns: RunCreated[] = [];

            groupTestResults(arrayTestResults, arrayTestRuns);

            expect(logger.error).toHaveBeenCalledWith('No test runs provided');
        });

        it('Should return empty array when no runs are provided', () => {
            const arrayTestResults: TestRailPayloadUpdateRunResult[] = [];
            const arrayTestRuns: RunCreated[] = [];

            expect(groupTestResults(arrayTestResults, arrayTestRuns)).toEqual([]);
        });

        it('Should log an error when no matching cases are found for a run', () => {
            const arrayTestResults: TestRailPayloadUpdateRunResult[] = [
                { case_id: 1, status_id: TestRailCaseStatus.passed, comment: 'Test 1' }
            ];

            const arrayTestRuns: RunCreated[] = [
                { projectId: 10, suiteId: 100, runId: 1000, arrayCaseIds: [2] }
            ];

            groupTestResults(arrayTestResults, arrayTestRuns);

            expect(logger.error).toHaveBeenCalledWith('No matching cases found for run ID: 1000');
        });

        it('Should group multiple test case with the same run', () => {
            const arrayTestResults: TestRailPayloadUpdateRunResult[] = [
                { case_id: 1, status_id: TestRailCaseStatus.passed, comment: 'Test 1' },
                { case_id: 2, status_id: TestRailCaseStatus.failed, comment: 'Test 2' }
            ];

            const arrayTestRuns: RunCreated[] = [
                { projectId: 10, suiteId: 100, runId: 1000, arrayCaseIds: [1, 2] }
            ];

            expect(groupTestResults(arrayTestResults, arrayTestRuns)).toEqual([
                {
                    runId: 1000,
                    arrayCaseResults: [
                        { case_id: 1, status_id: TestRailCaseStatus.passed, comment: 'Test 1' },
                        { case_id: 2, status_id: TestRailCaseStatus.failed, comment: 'Test 2' }
                    ]
                }
            ]);
        });

        it('Should group multiple test cases with multiple runs', () => {
            const arrayTestResults: TestRailPayloadUpdateRunResult[] = [
                { case_id: 1, status_id: TestRailCaseStatus.passed, comment: 'Test 1' },
                { case_id: 2, status_id: TestRailCaseStatus.failed, comment: 'Test 2' },
                { case_id: 3, status_id: TestRailCaseStatus.passed, comment: 'Test 3' },
                { case_id: 4, status_id: TestRailCaseStatus.blocked, comment: 'Test 4' },
                { case_id: 5, status_id: TestRailCaseStatus.untested, comment: 'Test 5' },
                { case_id: 6, status_id: TestRailCaseStatus.untested, comment: 'Test 6' }
            ];

            const arrayTestRuns: RunCreated[] = [
                { projectId: 10, suiteId: 100, runId: 1000, arrayCaseIds: [1, 2] },
                { projectId: 10, suiteId: 101, runId: 1001, arrayCaseIds: [3] },
                { projectId: 10, suiteId: 102, runId: 1002, arrayCaseIds: [4, 5, 6] }
            ];

            expect(groupTestResults(arrayTestResults, arrayTestRuns)).toEqual([
                {
                    runId: 1000,
                    arrayCaseResults: [
                        { case_id: 1, status_id: TestRailCaseStatus.passed, comment: 'Test 1' },
                        { case_id: 2, status_id: TestRailCaseStatus.failed, comment: 'Test 2' }
                    ]
                },
                {
                    runId: 1001,
                    arrayCaseResults: [
                        { case_id: 3, status_id: TestRailCaseStatus.passed, comment: 'Test 3' }
                    ]
                },
                {
                    runId: 1002,
                    arrayCaseResults: [
                        { case_id: 4, status_id: TestRailCaseStatus.blocked, comment: 'Test 4' },
                        { case_id: 5, status_id: TestRailCaseStatus.untested, comment: 'Test 5' },
                        { case_id: 6, status_id: TestRailCaseStatus.untested, comment: 'Test 6' }
                    ]
                }
            ]);
        });
    });

    describe('Filter duplicating cases', () => {
        it('Should not change anything if result has no duplicating cases', () => {
            const finalResult: FinalResult = {
                runId: 1000,
                arrayCaseResults: [
                    { case_id: 1, status_id: TestRailCaseStatus.passed, comment: 'Test 1' },
                    { case_id: 2, status_id: TestRailCaseStatus.failed, comment: 'Test 2' },
                    { case_id: 3, status_id: TestRailCaseStatus.blocked, comment: 'Test 3' }
                ]
            };

            expect(filterDuplicatingCases(finalResult)).toEqual(finalResult);
        });

        it('Should call logger.warn when multiple cases are found for the same case ID', () => {
            const finalResult: FinalResult = {
                runId: 1000,
                arrayCaseResults: [
                    { case_id: 1, status_id: TestRailCaseStatus.passed, comment: 'Test 1' },
                    { case_id: 1, status_id: TestRailCaseStatus.passed, comment: 'Test 1 - Duplicate' },
                    { case_id: 1, status_id: TestRailCaseStatus.passed, comment: 'Test 1 - Another Duplicate' }
                ]
            };

            filterDuplicatingCases(finalResult);

            expect(logger.warn).toHaveBeenCalledWith('Multiple results found for case ID:', 1);
        });

        it('Should leave just the first case result for multiple cases with the same status', () => {
            const finalResult: FinalResult = {
                runId: 1000,
                arrayCaseResults: [
                    { case_id: 1, status_id: TestRailCaseStatus.passed, comment: 'Test 1' },
                    { case_id: 1, status_id: TestRailCaseStatus.passed, comment: 'Test 1 - Duplicate' },
                    { case_id: 1, status_id: TestRailCaseStatus.passed, comment: 'Test 1 - Another Duplicate' }
                ]
            };

            expect(filterDuplicatingCases(finalResult)).toEqual({
                runId: 1000,
                arrayCaseResults: [
                    { case_id: 1, status_id: TestRailCaseStatus.passed, comment: 'Test 1' }
                ]
            });
        });

        it('Should filter out cases based on status priority', () => {
            const finalResult: FinalResult = {
                runId: 1000,
                arrayCaseResults: [
                    { case_id: 1, status_id: TestRailCaseStatus.failed, comment: 'Test 1 - Failed' },
                    { case_id: 1, status_id: TestRailCaseStatus.passed, comment: 'Test 1 - Passed' },
                    { case_id: 2, status_id: TestRailCaseStatus.blocked, comment: 'Test 2 - Blocked' },
                    { case_id: 2, status_id: TestRailCaseStatus.untested, comment: 'Test 2 - Untested' },
                    { case_id: 3, status_id: TestRailCaseStatus.untested, comment: 'Test 3 - Untested' },
                    { case_id: 3, status_id: TestRailCaseStatus.failed, comment: 'Test 3 - Failed' },
                    { case_id: 3, status_id: TestRailCaseStatus.blocked, comment: 'Test 3 - Blocked' }
                ]
            };

            expect(filterDuplicatingCases(finalResult)).toEqual({
                runId: 1000,
                arrayCaseResults: [
                    { case_id: 1, status_id: TestRailCaseStatus.passed, comment: 'Test 1 - Passed' },
                    { case_id: 2, status_id: TestRailCaseStatus.blocked, comment: 'Test 2 - Blocked' },
                    { case_id: 3, status_id: TestRailCaseStatus.failed, comment: 'Test 3 - Failed' }
                ]
            });

            expect(logger.warn).toHaveBeenCalledWith('Multiple results found for case ID:', 1);
        });
    });

    describe('Group attachments', () => {
        it('Should group attachments with their corresponding test results based on case IDs', () => {
            const attachments: AttachmentData[] = [
                {
                    caseId: 1,
                    arrayFiles: ['file1.png', 'file2.png']
                },
                {
                    caseId: 2,
                    arrayFiles: ['file3.png']
                }
            ];

            const testResults: RunUpdated[] = [
                {
                    runId: 100,
                    arrayMatchedCasesToResults: [
                        { caseId: 1, resultId: 1001 },
                        { caseId: 2, resultId: 1002 }
                    ]
                }
            ];

            const expected = [
                { resultId: 1001, attachment: 'file1.png' },
                { resultId: 1001, attachment: 'file2.png' },
                { resultId: 1002, attachment: 'file3.png' }
            ];

            expect(groupAttachments(attachments, testResults)).toEqual(expected);
        });

        it('Should handle empty arrays', () => {
            expect(groupAttachments([], [])).toEqual([]);
            expect(groupAttachments([], [{ runId: 100, arrayMatchedCasesToResults: [] }])).toEqual([]);
            expect(groupAttachments([{ caseId: 1, arrayFiles: ['file.png'] }], [])).toEqual([]);
        });

        it('Should handle cases with no matching results', () => {
            const attachments: AttachmentData[] = [
                {
                    caseId: 999,
                    arrayFiles: ['file1.png']
                }
            ];

            const testResults: RunUpdated[] = [
                {
                    runId: 100,
                    arrayMatchedCasesToResults: [
                        { caseId: 1, resultId: 1001 }
                    ]
                }
            ];

            expect(groupAttachments(attachments, testResults)).toEqual([]);
            expect(logger.error).toHaveBeenCalledWith('No matching result found for attachments of case ID:', 999);
        });

        it('Should handle multiple test runs', () => {
            const attachments: AttachmentData[] = [
                {
                    caseId: 1,
                    arrayFiles: ['file1.png']
                }
            ];

            const testResults: RunUpdated[] = [
                {
                    runId: 100,
                    arrayMatchedCasesToResults: [
                        { caseId: 2, resultId: 1002 }
                    ]
                },
                {
                    runId: 101,
                    arrayMatchedCasesToResults: [
                        { caseId: 1, resultId: 1001 }
                    ]
                }
            ];

            const expected = [
                { resultId: 1001, attachment: 'file1.png' }
            ];

            expect(groupAttachments(attachments, testResults)).toEqual(expected);
        });
    });
});