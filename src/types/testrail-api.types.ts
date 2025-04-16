/* eslint-disable @typescript-eslint/naming-convention */

// Stub for TestRail API types
export type TestRailProject = {
    id: number
};

// Stub for TestRail API types
export type TestRailSuite = {
    id: number
};

// Stub for TestRail API types
export type TestRailCase = {
    id: number
};

// Response from TestRail API when creating/updating a run
export type TestRailRun = {
    id: number,
    suite_id: TestRailSuite['id'],
    name: string,
    description: string | null,
    milestone_id: number | null,
    assignedto_id: number | null,
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
    project_id: number,
    plan_id: number | null,
    created_on: number,
    updated_on: number,
    refs: string | null,
    created_by: number,
    url: string
};

// Extended type that contains request payload
export type TestRailRunWithAdditionalData = TestRailRun & {
    projectId: TestRailProject['id'],
    suiteId: TestRailSuite['id'],
    cases: TestRailCase['id'][]
};

// Payload required for updating test runs
export type TestRailCaseResult = {
    case_id: TestRailCase['id'],
    status_id: TestRailCaseStatus,
    comment: string,
    elapsed?: string
};

export enum TestRailCaseStatus {
    passed = 1,
    blocked = 2,
    untested = 3,
    // retest is not used in this reporter
    // retest = 4,
    failed = 5
}