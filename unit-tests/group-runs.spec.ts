import { filterDuplicatingCases, groupTestResults } from '@reporter/utils/group-runs';

import { FinalResult, RunCreated } from '@types-internal/playwright-reporter.types';
import { TestRailCaseResult, TestRailCaseStatus } from '@types-internal/testrail-api.types';

describe('Group runs unit tests', function () {
    describe('Basic run grouping', function () {
        it('Should handle empty runs and results', function () {
            const arrayTestResults: TestRailCaseResult[] = [];
            const arrayTestRuns: RunCreated[] = [];

            expect(groupTestResults(arrayTestResults, arrayTestRuns)).toEqual([]);
        });

        it('Should group test results by runs correctly', function () {
            const arrayTestResults: TestRailCaseResult[] = [
                { case_id: 1, status_id: TestRailCaseStatus.passed, comment: 'Test 1' },
                { case_id: 2, status_id: TestRailCaseStatus.failed, comment: 'Test 2' },
                { case_id: 3, status_id: TestRailCaseStatus.blocked, comment: 'Test 3' },
                { case_id: 4, status_id: TestRailCaseStatus.untested, comment: 'Test 4' }
            ];

            const arrayTestRuns: RunCreated[] = [
                { projectId: 10, suiteId: 100, runId: 1000, arrayCaseIds: [1, 2] },
                { projectId: 20, suiteId: 200, runId: 2000, arrayCaseIds: [2, 3, 4] },
                { projectId: 30, suiteId: 300, runId: 3000, arrayCaseIds: [3, 4] }
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
                    runId: 2000,
                    arrayCaseResults: [
                        { case_id: 2, status_id: TestRailCaseStatus.failed, comment: 'Test 2' },
                        { case_id: 3, status_id: TestRailCaseStatus.blocked, comment: 'Test 3' },
                        { case_id: 4, status_id: TestRailCaseStatus.untested, comment: 'Test 4' }
                    ]
                },
                {
                    runId: 3000,
                    arrayCaseResults: [
                        { case_id: 3, status_id: TestRailCaseStatus.blocked, comment: 'Test 3' },
                        { case_id: 4, status_id: TestRailCaseStatus.untested, comment: 'Test 4' }
                    ]
                }
            ]);
        });

        it('Should handle runs with no matching results', function () {
            const arrayTestResults: TestRailCaseResult[] = [
                { case_id: 1, status_id: TestRailCaseStatus.passed, comment: 'Test 1' }
            ];

            const arrayTestRuns: RunCreated[] = [
                { projectId: 10, suiteId: 100, runId: 1000, arrayCaseIds: [2] }
            ];

            expect(groupTestResults(arrayTestResults, arrayTestRuns)).toEqual([
                {
                    runId: 1000,
                    arrayCaseResults: []
                }
            ]);
        });

        it('Should handle results with no matching runs', function () {
            const arrayTestResults: TestRailCaseResult[] = [
                { case_id: 1, status_id: TestRailCaseStatus.passed, comment: 'Test 1' }
            ];

            const arrayTestRuns: RunCreated[] = [];

            expect(groupTestResults(arrayTestResults, arrayTestRuns)).toEqual([]);
        });
    });

    describe('Filtering duplicating cases', function () {
        it('Should not change anything if result has no duplicating cases', function () {
            const finalResult: FinalResult = {
                runId: 1000,
                arrayCaseResults: [
                    { case_id: 1, status_id: TestRailCaseStatus.passed, comment: 'Test 1' },
                    { case_id: 2, status_id: TestRailCaseStatus.failed, comment: 'Test 2' },
                    { case_id: 3, status_id: TestRailCaseStatus.blocked, comment: 'Test 3' },
                    { case_id: 4, status_id: TestRailCaseStatus.untested, comment: 'Test 4' },
                    { case_id: 5, status_id: TestRailCaseStatus.passed, comment: 'Test 5' }
                ]
            };

            expect(filterDuplicatingCases(finalResult)).toEqual(finalResult);
        });

        it('Should leave just the first case result for multiple cases with the same status', function () {
            const finalResult: FinalResult = {
                runId: 1000,
                arrayCaseResults: [
                    { case_id: 1, status_id: TestRailCaseStatus.passed, comment: 'Test 1 Passed 0' },
                    { case_id: 1, status_id: TestRailCaseStatus.passed, comment: 'Test 1 Passed 1' },
                    { case_id: 2, status_id: TestRailCaseStatus.failed, comment: 'Test 2 Failed 0' },
                    { case_id: 2, status_id: TestRailCaseStatus.failed, comment: 'Test 2 Failed 1' },
                    { case_id: 2, status_id: TestRailCaseStatus.failed, comment: 'Test 2 Failed 2' },
                    { case_id: 3, status_id: TestRailCaseStatus.blocked, comment: 'Test 3 Blocked 0' },
                    { case_id: 3, status_id: TestRailCaseStatus.blocked, comment: 'Test 3 Blocked 1' },
                    { case_id: 3, status_id: TestRailCaseStatus.blocked, comment: 'Test 3 Blocked 2' },
                    { case_id: 4, status_id: TestRailCaseStatus.untested, comment: 'Test 4 Untested 0' },
                    { case_id: 4, status_id: TestRailCaseStatus.untested, comment: 'Test 4 Untested 1' },
                    { case_id: 4, status_id: TestRailCaseStatus.untested, comment: 'Test 4 Untested 2' }
                ]
            };

            expect(filterDuplicatingCases(finalResult)).toEqual({
                runId: 1000,
                arrayCaseResults: [
                    { case_id: 1, status_id: TestRailCaseStatus.passed, comment: 'Test 1 Passed 0' },
                    { case_id: 2, status_id: TestRailCaseStatus.failed, comment: 'Test 2 Failed 0' },
                    { case_id: 3, status_id: TestRailCaseStatus.blocked, comment: 'Test 3 Blocked 0' },
                    { case_id: 4, status_id: TestRailCaseStatus.untested, comment: 'Test 4 Untested 0' }
                ]
            });
        });

        it('Should filter out cases based on status priority', function () {
            const finalResult: FinalResult = {
                runId: 1000,
                arrayCaseResults: [
                    { case_id: 1, status_id: TestRailCaseStatus.failed, comment: 'Test 1 Failed' },
                    { case_id: 1, status_id: TestRailCaseStatus.blocked, comment: 'Test 1 Blocked' },
                    { case_id: 1, status_id: TestRailCaseStatus.untested, comment: 'Test 1 Untested' }
                ]
            };

            expect(filterDuplicatingCases(finalResult)).toEqual({
                runId: 1000,
                arrayCaseResults: [
                    { case_id: 1, status_id: TestRailCaseStatus.failed, comment: 'Test 1 Failed' }
                ]
            });
        });
    });
});