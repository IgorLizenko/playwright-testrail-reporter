/* eslint-disable @typescript-eslint/naming-convention */

/*
    Base types that are used both in requests and responses
*/
export type TestRailBaseProject = {
    id: number
};

export type TestRailBaseSuite = {
    id: number
};

export type TestRailBaseCase = {
    id: number
};

export type TestRailBaseRun = {
    id: number,
    name: string,
    description: string | null
};

export type TestRailBaseResult = {
    id: number
};

export type TestRailBaseUser = {
    id: number
};

export type TestRailBaseAttachment = {
    id: number
};

/*
    Response types
*/
export type TestRailResponseRunCreated = TestRailBaseRun & {
    suite_id: TestRailBaseSuite['id'],
    milestone_id: number | null,
    assignedto_id: TestRailBaseUser['id'] | null,
    include_all: boolean,
    is_completed: boolean,
    completed_on: number | null,
    config: null,
    config_ids: number[],
    passed_count: number,
    blocked_count: number,
    untested_count: number,
    retest_count: number,
    failed_count: number,
    custom_status1_count: number,
    custom_status2_count: number,
    custom_status3_count: number,
    custom_status4_count: number,
    custom_status5_count: number,
    custom_status6_count: number,
    custom_status7_count: number,
    project_id: TestRailBaseProject['id'],
    plan_id: number | null,
    created_on: number,
    updated_on: number,
    refs: string | null,
    created_by: TestRailBaseUser['id'],
    url: string
};

export type TestRailResponseRunUpdated = TestRailBaseResult & {
    test_id: number,
    status_id: TestRailCaseStatus,
    created_on: number,
    assignedto_id: TestRailBaseUser['id'] | null,
    comment: string,
    version: null,
    elapsed: string,
    defects: null,
    created_by: TestRailBaseUser['id'],
    custom_step_results: null,
    custom_testrail_bdd_scenario_results: null,
    custom_failure_severity: null,
    attachment_ids: TestRailBaseAttachment['id'][]
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
    name: TestRailBaseRun['name'],
    description?: string,
    cases: TestRailBaseCase['id'][],
    includeAllCases?: boolean
};

export type TestRailPayloadUpdateRunResult = {
    case_id: TestRailBaseCase['id'],
    status_id: TestRailCaseStatus,
    comment: string,
    elapsed?: string
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