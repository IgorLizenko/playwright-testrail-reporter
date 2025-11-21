import { beforeEach, describe, expect, it, vi } from 'vitest';

import { filterOutEmptyRuns } from '@reporter/utils/filter-runs';

import type { ProjectSuiteCombo } from '@types-internal/playwright-reporter.types';
import { TestRailCaseStatus, type TestRailPayloadUpdateRunResult } from '@types-internal/testrail-api.types';

import logger from '@logger';

vi.mock('@logger', () => {
    return {
        default: {
            debug: vi.fn(),
            warn: vi.fn()
        }
    };
});

describe('Filter runs unit tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('Should filter out runs with no results', () => {
        const arrayTestRuns: ProjectSuiteCombo[] = [
            { projectId: 1, suiteId: 10, arrayCaseIds: [1, 2] },
            { projectId: 1, suiteId: 11, arrayCaseIds: [3] }
        ];

        const arrayTestResults: TestRailPayloadUpdateRunResult[] = [
            { case_id: 1, status_id: TestRailCaseStatus.passed, comment: 'Test 1' }
        ];

        const result = filterOutEmptyRuns(arrayTestRuns, arrayTestResults);

        expect(result).toEqual([
            { projectId: 1, suiteId: 10, arrayCaseIds: [1, 2] }
        ]);
        expect(logger.debug).toHaveBeenCalledWith('Run filtration done, initial runs: 2, filtered runs: 1');
        expect(logger.warn).toHaveBeenCalledWith('Filtered out 1 empty test runs');
    });

    it('Should filter out runs where all results are blocked', () => {
        const arrayTestRuns: ProjectSuiteCombo[] = [
            { projectId: 1, suiteId: 10, arrayCaseIds: [1, 2] }
        ];

        const arrayTestResults: TestRailPayloadUpdateRunResult[] = [
            { case_id: 1, status_id: TestRailCaseStatus.blocked, comment: 'Blocked 1' },
            { case_id: 2, status_id: TestRailCaseStatus.blocked, comment: 'Blocked 2' }
        ];

        const result = filterOutEmptyRuns(arrayTestRuns, arrayTestResults);

        expect(result).toEqual([]);
        expect(logger.debug).toHaveBeenCalledWith('Run filtration done, initial runs: 1, filtered runs: 0');
        expect(logger.warn).toHaveBeenCalledWith('Filtered out 1 empty test runs');
    });

    it('Should keep runs with at least one non-blocked result', () => {
        const arrayTestRuns: ProjectSuiteCombo[] = [
            { projectId: 1, suiteId: 10, arrayCaseIds: [1, 2] }
        ];

        const arrayTestResults: TestRailPayloadUpdateRunResult[] = [
            { case_id: 1, status_id: TestRailCaseStatus.blocked, comment: 'Blocked' },
            { case_id: 2, status_id: TestRailCaseStatus.failed, comment: 'Failed' }
        ];

        const result = filterOutEmptyRuns(arrayTestRuns, arrayTestResults);

        expect(result).toEqual(arrayTestRuns);
        expect(logger.debug).toHaveBeenCalledWith('Run filtration done, initial runs: 1, filtered runs: 1');
        expect(logger.warn).not.toHaveBeenCalled();
    });

    it('Should handle multiple runs with mixed results', () => {
        const arrayTestRuns: ProjectSuiteCombo[] = [
            { projectId: 1, suiteId: 10, arrayCaseIds: [1, 2] },
            { projectId: 1, suiteId: 11, arrayCaseIds: [3] },
            { projectId: 2, suiteId: null, arrayCaseIds: [4, 5] }
        ];

        const arrayTestResults: TestRailPayloadUpdateRunResult[] = [
            { case_id: 1, status_id: TestRailCaseStatus.blocked, comment: 'Blocked' },
            { case_id: 3, status_id: TestRailCaseStatus.passed, comment: 'Passed' },
            { case_id: 4, status_id: TestRailCaseStatus.blocked, comment: 'Blocked' },
            { case_id: 5, status_id: TestRailCaseStatus.failed, comment: 'Failed' }
        ];

        const result = filterOutEmptyRuns(arrayTestRuns, arrayTestResults);

        expect(result).toEqual([
            { projectId: 1, suiteId: 11, arrayCaseIds: [3] },
            { projectId: 2, suiteId: null, arrayCaseIds: [4, 5] }
        ]);
        expect(logger.debug).toHaveBeenCalledWith('Run filtration done, initial runs: 3, filtered runs: 2');
        expect(logger.warn).toHaveBeenCalledWith('Filtered out 1 empty test runs');
    });

    it('Should not log warning when no runs are filtered out', () => {
        const arrayTestRuns: ProjectSuiteCombo[] = [
            { projectId: 1, suiteId: 10, arrayCaseIds: [1] }
        ];

        const arrayTestResults: TestRailPayloadUpdateRunResult[] = [
            { case_id: 1, status_id: TestRailCaseStatus.passed, comment: 'Passed' }
        ];

        const result = filterOutEmptyRuns(arrayTestRuns, arrayTestResults);

        expect(result).toEqual(arrayTestRuns);
        expect(logger.debug).toHaveBeenCalledWith('Run filtration done, initial runs: 1, filtered runs: 1');
        expect(logger.warn).not.toHaveBeenCalled();
    });
});