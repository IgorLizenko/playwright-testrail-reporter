import type { TestRailCase, TestRailCaseResult, TestRailProject, TestRailRun, TestRailSuite } from '@types-internal/testrail-api.types';

export type ReporterOptions = {
    domain: string,
    username: string,
    password: string,
    includeAllCases?: boolean,
    includeAttachments?: boolean,
    closeRuns?: boolean
};

export type ParsedTag = {
    projectId: TestRailProject['id'],
    suiteId: TestRailSuite['id'],
    caseId: TestRailCase['id']
};

export type ProjectSuiteCombo = {
    projectId: TestRailProject['id'],
    suiteId: TestRailSuite['id'],
    arrayCaseIds: TestRailCase['id'][]
};

export type RunCreated = ProjectSuiteCombo & {
    runId: TestRailRun['id']
};

export type FinalResult = {
    runId: TestRailRun['id'],
    arrayCaseResults: TestRailCaseResult[]
};