import type { TestRailBaseCase, TestRailBaseProject, TestRailBaseResult, TestRailBaseRun, TestRailBaseSuite, TestRailPayloadUpdateRunResult } from '@types-internal/testrail-api.types';

export type ReporterOptions = {
    domain: string,
    username: string,
    password: string,
    includeAllCases?: boolean,
    includeAttachments?: boolean,
    closeRuns?: boolean,
    apiChunkSize?: number,
    runNameTemplate?: string
};

export type ParsedTag = {
    projectId: TestRailBaseProject['id'],
    suiteId: TestRailBaseSuite['id'],
    caseId: TestRailBaseCase['id']
};

// All cases found in a test run grouped by project and suite IDs
export type ProjectSuiteCombo = {
    projectId: TestRailBaseProject['id'],
    suiteId: TestRailBaseSuite['id'],
    arrayCaseIds: TestRailBaseCase['id'][]
};

// Run created in TestRail for a project-suite combo
export type RunCreated = ProjectSuiteCombo & {
    runId: TestRailBaseRun['id']
};

export type AttachmentData = {
    caseId: TestRailBaseCase['id'],
    arrayFiles: string[]
};

export type CaseResultMatch = {
    caseId: TestRailBaseCase['id'],
    resultId: TestRailBaseResult['id']
};

export type FinalResult = {
    runId: TestRailBaseRun['id'],
    arrayCaseResults: TestRailPayloadUpdateRunResult[]
};