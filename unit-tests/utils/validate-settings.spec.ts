import { validateSettings } from '@reporter/utils/validate-settings';

import type { ReporterOptions } from '@types-internal/playwright-reporter.types';

import logger from '@logger';

jest.mock('@logger', () => ({
    error: jest.fn(),
    warn: jest.fn()
}));

describe('Validate settings tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('Should return true if settings are set', () => {
        expect(validateSettings({
            domain: 'https://testrail.com',
            username: 'username',
            password: 'password'
        })).toBe(true);
    });

    it('Should not log an error if settings are set', () => {
        validateSettings({
            domain: 'https://testrail.com',
            username: 'username',
            password: 'password'
        });

        expect(logger.error).not.toHaveBeenCalled();
        expect(logger.warn).not.toHaveBeenCalled();
    });

    it('Should return false if domain is not set', () => {
        expect(validateSettings({
            username: 'username',
            password: 'password'
        } as ReporterOptions)).toBe(false);
    });

    it('Should return false if domain is set to an empty string', () => {
        expect(validateSettings({
            domain: '',
            username: 'username',
            password: 'password'
        })).toBe(false);
    });

    it('Should return false if multiple settings are missing', () => {
        expect(validateSettings({
            username: 'username'
        } as ReporterOptions)).toBe(false);
    });

    it('Should return false if all fields are missing', () => {
        expect(validateSettings({} as ReporterOptions)).toBe(false);
    });

    it('Should log an error if any settings are missing', () => {
        validateSettings({
            username: 'username'
        } as ReporterOptions);

        expect(logger.error).toHaveBeenCalledWith('Missing required credentials: domain, password');
    });

    it('Should return false if fields have incorrect types', () => {
        const settings = {
            domain: { a: 1 },
            username: 123,
            password: true
        } as unknown as ReporterOptions;

        expect(validateSettings(settings)).toBe(false);
    });

    it('Should log an error and return false if apiChunkSize is not a number', () => {
        const settings = {
            domain: 'https://testrail.com',
            username: 'username',
            password: 'password',
            apiChunkSize: '10'
        } as unknown as ReporterOptions;

        const result = validateSettings(settings);
        expect(logger.error).toHaveBeenCalledWith('apiChunkSize must be an integer greater than 0');
        expect(result).toBe(false);
    });

    it('Should log an error and return false if apiChunkSize is not an integer', () => {
        const settings = {
            domain: 'https://testrail.com',
            username: 'username',
            password: 'password',
            apiChunkSize: 10.5
        } as unknown as ReporterOptions;

        const result = validateSettings(settings);
        expect(logger.error).toHaveBeenCalledWith('apiChunkSize must be an integer greater than 0');
        expect(result).toBe(false);
    });

    it('Should log an error and return false if apiChunkSize is zero', () => {
        const settings = {
            domain: 'https://testrail.com',
            username: 'username',
            password: 'password',
            apiChunkSize: 0
        } as unknown as ReporterOptions;

        const result = validateSettings(settings);
        expect(logger.error).toHaveBeenCalledWith('apiChunkSize must be an integer greater than 0');
        expect(result).toBe(false);
    });

    it('Should log an error and return false if apiChunkSize is less than 1', () => {
        const settings = {
            domain: 'https://testrail.com',
            username: 'username',
            password: 'password',
            apiChunkSize: -10
        } as unknown as ReporterOptions;

        const result = validateSettings(settings);
        expect(logger.error).toHaveBeenCalledWith('apiChunkSize must be an integer greater than 0');
        expect(result).toBe(false);
    });

    it('Should log an error and return false if closeRuns is not a boolean', () => {
        const settings = {
            domain: 'https://testrail.com',
            username: 'username',
            password: 'password',
            closeRuns: 'true'
        } as unknown as ReporterOptions;

        const result = validateSettings(settings);
        expect(logger.error).toHaveBeenCalledWith('closeRuns must be a boolean');
        expect(result).toBe(false);
    });

    it('Should log an error and return false if includeAllCases is not a boolean', () => {
        const settings = {
            domain: 'https://testrail.com',
            username: 'username',
            password: 'password',
            includeAllCases: 'true'
        } as unknown as ReporterOptions;

        const result = validateSettings(settings);
        expect(logger.error).toHaveBeenCalledWith('includeAllCases must be a boolean');
        expect(result).toBe(false);
    });

    it('Should log an error and return false if includeAttachments is not a boolean', () => {
        const settings = {
            domain: 'https://testrail.com',
            username: 'username',
            password: 'password',
            includeAttachments: 'true'
        } as unknown as ReporterOptions;

        const result = validateSettings(settings);
        expect(logger.error).toHaveBeenCalledWith('includeAttachments must be a boolean');
        expect(result).toBe(false);
    });

    it('Should log an error and return false if runNameTemplate is not a string', () => {
        const settings = {
            domain: 'https://testrail.com',
            username: 'username',
            password: 'password',
            runNameTemplate: 123
        } as unknown as ReporterOptions;

        const result = validateSettings(settings);
        expect(logger.error).toHaveBeenCalledWith('runNameTemplate must be a string');
        expect(result).toBe(false);
    });
});