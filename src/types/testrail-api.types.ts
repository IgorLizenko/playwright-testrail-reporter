/* eslint-disable @typescript-eslint/naming-convention */

/*
    Base types that are used both in requests and responses
*/
export type TestRailBaseProject = {
    id: number,
    is_completed: boolean,
    name: string,
    show_announcement: boolean,
    suite_mode: number,
    url: string
};

export type TestRailBaseSuite = {
    id: number,
    description: string | null,
    name: string,
    project_id: TestRailBaseProject['id'],
    url: string
};

export type TestRailBaseCase = {
    id: number,
    title: string,
    created_on: number,
    created_by: TestRailBaseUser['id'],
    suite_id: TestRailBaseSuite['id'],
    type_id: number,
    updated_by: TestRailBaseUser['id'],
    updated_on: number
};

export type TestRailBaseRun = {
    id: number,
    name: string,
    created_by: TestRailBaseUser['id'],
    created_on: number,
    include_all: boolean,
    suite_id: TestRailBaseSuite['id'],
    url: string,
    description: string | null
};

export type TestRailBaseResult = {
    id: number,
    comment: string,
    created_by: TestRailBaseUser['id'],
    created_on: number,
    elapsed: string,
    status_id: TestRailCaseStatus,
    test_id: TestRailBaseCase['id'],
    assignedto_id: TestRailBaseUser['id'] | null,
    version: string | null,
    defects: string | null,
    attachment_ids: TestRailBaseAttachment['id'][]
};

export type TestRailBaseUser = {
    id: number,
    email: string,
    is_active: boolean,
    name: string
};

export type TestRailBaseAttachment = {
    id: number
};

/*
    Response types
*/
export type TestRailResponseRunCreated = TestRailBaseRun & {
    milestone_id: number | null,
    assignedto_id: TestRailBaseUser['id'] | null,
    is_completed: boolean,
    completed_on: number | null,
    config: null,
    config_ids: number[],
    passed_count: number,
    blocked_count: number,
    untested_count: number,
    retest_count: number,
    failed_count: number,
    project_id: TestRailBaseProject['id'],
    plan_id: number | null,
    updated_on: number,
    refs: string | null
};

export type TestRailResponseAttachmentAdded = {
    attachment_id: TestRailBaseAttachment['id']
};

/*
    Request payload types
*/
export type TestRailPayloadCreateRun = {
    projectId: TestRailBaseProject['id'],
    suiteId: TestRailBaseSuite['id'],
    name: string,
    description?: string,
    cases: TestRailBaseCase['id'][],
    includeAllCases?: boolean
};

export type TestRailPayloadUpdateRunResult = {
    case_id: TestRailBaseCase['id'],
    status_id: TestRailCaseStatus,
    assignedto_id?: TestRailBaseUser['id'],
    comment: string,
    elapsed?: string,
    environment?: string,
    defects?: string
};

export type TestRailPayloadAddAttachment = {
    resultId: TestRailBaseResult['id'],
    attachment: string
};

// Enums
export enum TestRailCaseStatus {
    passed = 1,
    blocked = 2,
    untested = 3,
    // retest status exists in API but is not used in reporter
    // retest = 4,
    failed = 5
}