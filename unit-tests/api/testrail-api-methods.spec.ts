import axiosMockAdapter from 'axios-mock-adapter';

import { TestRail } from '@testrail-api/testrail-api';

import logger from '@logger';

jest.mock('@logger', () => ({
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
}));

describe('TestRail API: Main methods tests', () => {
    let mock: axiosMockAdapter;
    let client: TestRail;

    beforeEach(() => {
        jest.clearAllMocks();
        client = new TestRail({
            domain: 'https://fake.testrail.io',
            username: 'username',
            password: 'password'
        });

        // @ts-expect-error private property
        mock = new axiosMockAdapter(client.client);
    });

    afterEach(() => {
        mock.reset();
    });

    describe('getSuiteInfo', () => {
        it('Should return suite info and log debug on successful response', async () => {
            mock.onGet('/api/v2/get_suite/1').reply(200, { id: 123, name: 'Test Suite' });

            const result = await client.getSuiteInfo(1);

            expect(logger.warn).not.toHaveBeenCalled();
            expect(logger.debug).toHaveBeenCalledWith('Suite info retrieved for suite ID: 1');
            expect(result).toEqual({ id: 123, name: 'Test Suite' });
        });

        it('Should return null and log error on error', async () => {
            mock.onGet('/api/v2/get_suite/1').reply(403);

            const result = await client.getSuiteInfo(1);

            expect(logger.warn).not.toHaveBeenCalled();
            const error = new Error('Request failed with status code 403');
            expect(logger.error).toHaveBeenCalledWith('Failed to retrieve suite info for suite ID 1', error);
            expect(result).toBeNull();
        });
    });

    describe('addTestRun', () => {
        it('Should return data and log debug on successful response', async () => {
            mock.onPost('/api/v2/add_run/1').reply(200, { id: 123, name: 'Test Run' });

            const result = await client.addTestRun({
                projectId: 1,
                suiteId: 1,
                name: 'Test Run',
                cases: [],
                includeAllCases: true
            });

            expect(logger.warn).not.toHaveBeenCalled();
            expect(logger.debug).toHaveBeenCalledWith('Run created with ID: 123');
            expect(result).toEqual({ id: 123, name: 'Test Run' });
        });

        it('Should return null and log error on error', async () => {
            mock.onPost('/api/v2/add_run/1').reply(403);

            const result = await client.addTestRun({
                projectId: 1,
                suiteId: 1,
                name: 'Test Run',
                cases: [],
                includeAllCases: true
            });

            expect(logger.warn).not.toHaveBeenCalled();
            const error = new Error('Request failed with status code 403');
            expect(logger.error).toHaveBeenCalledWith('Failed to create a test run for project 1 and suite 1', error);
            expect(result).toBeNull();
        });
    });

    describe('addTestRunResults', () => {
        it('Should return data and log debug on successful response', async () => {
            mock.onPost('/api/v2/add_results_for_cases/1').reply(200, [{ id: 123, name: 'Test Run Result' }]);

            const result = await client.addTestRunResults(1, [{ case_id: 1, status_id: 1, comment: 'Test comment' }]);

            expect(logger.warn).not.toHaveBeenCalled();
            expect(logger.debug).toHaveBeenCalledWith('Results added to run 1');
            expect(result).toEqual([{ id: 123, name: 'Test Run Result' }]);
        });

        it('Should return null and log error on error', async () => {
            mock.onPost('/api/v2/add_results_for_cases/1').reply(403);

            const result = await client.addTestRunResults(1, [{ case_id: 1, status_id: 1, comment: 'Test comment' }]);

            expect(logger.warn).not.toHaveBeenCalled();
            const error = new Error('Request failed with status code 403');
            expect(logger.error).toHaveBeenCalledWith('Failed to add test run results for run ID 1', error);
            expect(result).toBeNull();
        });
    });

    describe('closeTestRun', () => {
        it('Should log debug on successful response', async () => {
            mock.onPost('/api/v2/close_run/1').reply(200);
            await client.closeTestRun(1);

            expect(logger.warn).not.toHaveBeenCalled();
            expect(logger.debug).toHaveBeenCalledWith('Run 1 closed');
        });

        it('Should log error on error', async () => {
            mock.onPost('/api/v2/close_run/1').reply(403);
            await client.closeTestRun(1);

            expect(logger.warn).not.toHaveBeenCalled();
            const error = new Error('Request failed with status code 403');
            expect(logger.error).toHaveBeenCalledWith('Failed to close test run for run ID 1', error);
        });
    });

    describe('addAttachmentToResult', () => {
        it('Should return data and log debug on successful response', async () => {
            mock.onPost('/api/v2/add_attachment_to_result/1').reply(200, { id: 123, name: 'Test Attachment' });

            const result = await client.addAttachmentToResult({
                resultId: 1,
                attachment: 'path/to/attachment'
            });

            expect(logger.warn).not.toHaveBeenCalled();
            expect(logger.debug).toHaveBeenCalledWith('Attachment added to result 1');
            expect(result).toEqual({ id: 123, name: 'Test Attachment' });
        });

        it('Should return null and log error on error', async () => {
            mock.onPost('/api/v2/add_attachment_to_result/1').reply(403);

            const result = await client.addAttachmentToResult({
                resultId: 1,
                attachment: 'path/to/attachment'
            });

            expect(logger.warn).not.toHaveBeenCalled();
            const error = new Error('Request failed with status code 403');
            expect(logger.error).toHaveBeenCalledWith('Failed to add attachment to result 1', error);
            expect(result).toBeNull();
        });
    });
});