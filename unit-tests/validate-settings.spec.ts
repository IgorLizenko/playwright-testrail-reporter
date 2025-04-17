import { validateSettings } from '@reporter/utils/validate-settings';

import { ReporterOptions } from '@types-internal/playwright-reporter.types';

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
});