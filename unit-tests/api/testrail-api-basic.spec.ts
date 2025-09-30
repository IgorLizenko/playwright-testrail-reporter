import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TestRail } from '@testrail-api/testrail-api';

import logger from '@logger';

vi.mock('@logger', () => {
    return {
        default: {
            debug: vi.fn()
        }
    };
});

describe('TestRail API: Basic (Initialize client)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('Should initialize client', () => {
        const client = new TestRail({
            domain: 'https://testrail.example.com',
            username: 'username',
            password: 'password'
        });
        expect(client).toBeDefined();
    });

    it('Should log a debug message on client initialization', () => {
        process.env.TESTRAIL_REPORTER_DEBUG_MODE = 'true';
        const client = new TestRail({
            domain: 'https://testrail.example.com',
            username: 'username',
            password: 'password'
        });
        expect(client).toBeDefined();
        expect(logger.debug).toHaveBeenCalledWith('TestRail API client initialized', {
            baseUrl: 'https://testrail.example.com',
            retries: 3
        });
    });
});