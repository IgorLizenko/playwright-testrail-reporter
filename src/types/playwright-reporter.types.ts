import type { TestRailBaseCase, TestRailBaseProject, TestRailBaseRun, TestRailBaseSuite, TestRailPayloadUpdateRunResult } from '@types-internal/testrail-api.types';

export type ReporterOptions = {
    domain: string,
    username: string,
    password: string,
    includeAllCases?: boolean,
    includeAttachments?: boolean,
    closeRuns?: boolean
};

export type ParsedTag = {
    projectId: TestRailBaseProject['id'],
    suiteId: TestRailBaseSuite['id'],
    caseId: TestRailBaseCase['id']
};

export type ProjectSuiteCombo = {
    projectId: TestRailBaseProject['id'],
    suiteId: TestRailBaseSuite['id'],
    arrayCaseIds: TestRailBaseCase['id'][]
};

export type RunCreated = ProjectSuiteCombo & {
    runId: TestRailBaseRun['id']
};

export type AttachmentData = {
    caseId: TestRailBaseCase['id'],
    filePath: string[]
};

export type AttachmentDataWithRunId = AttachmentData & {
    runId: TestRailBaseRun['id']
};

export type FinalResult = {
    runId: TestRailBaseRun['id'],
    arrayCaseResults: TestRailPayloadUpdateRunResult[]
};