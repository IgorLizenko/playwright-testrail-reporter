import { filterDuplicatingCases, groupTestResults } from '@reporter/utils/group-runs';

import { FinalResult, RunCreated } from '@types-internal/playwright-reporter.types';
import { TestRailCaseResult, TestRailCaseStatus } from '@types-internal/testrail-api.types';

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
            const arrayTestResults: TestRailCaseResult[] = [
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
            const arrayTestResults: TestRailCaseResult[] = [];
            const arrayTestRuns: RunCreated[] = [];

            groupTestResults(arrayTestResults, arrayTestRuns);

            expect(logger.error).toHaveBeenCalledWith('No test runs provided');
        });

        it('Should return empty array when no runs are provided', () => {
            const arrayTestResults: TestRailCaseResult[] = [];
            const arrayTestRuns: RunCreated[] = [];

            expect(groupTestResults(arrayTestResults, arrayTestRuns)).toEqual([]);
        });

        it('Should log an error when no matching cases are found for a run', () => {
            const arrayTestResults: TestRailCaseResult[] = [
                { case_id: 1, status_id: TestRailCaseStatus.passed, comment: 'Test 1' }
            ];

            const arrayTestRuns: RunCreated[] = [
                { projectId: 10, suiteId: 100, runId: 1000, arrayCaseIds: [2] }
            ];

            groupTestResults(arrayTestResults, arrayTestRuns);

            expect(logger.error).toHaveBeenCalledWith('No matching cases found for run ID: 1000');
        });

        it('Should group multiple test case with the same run', () => {
            const arrayTestResults: TestRailCaseResult[] = [
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
            const arrayTestResults: TestRailCaseResult[] = [
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
});