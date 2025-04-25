import type { ReporterOptions } from '@types-internal/playwright-reporter.types';

import logger from '@logger';

export function validateSettings(options: ReporterOptions): boolean {
    const missingFields: string[] = [];

    if (!options.domain || typeof options.domain !== 'string') {
        missingFields.push('domain');
    }

    if (!options.username || typeof options.username !== 'string') {
        missingFields.push('username');
    }

    if (!options.password || typeof options.password !== 'string') {
        missingFields.push('password');
    }

    if (missingFields.length > 0) {
        logger.error(`Missing required credentials: ${missingFields.join(', ')}`);
        return false;
    }

    if ('apiChunkSize' in options && (!Number.isInteger(options.apiChunkSize) || options.apiChunkSize! < 1)) {
        logger.error('apiChunkSize must be an integer greater than 0');
        return false;
    }

    if ('closeRuns' in options && typeof options.closeRuns !== 'boolean') {
        logger.error('closeRuns must be a boolean');
        return false;
    }

    if ('includeAllCases' in options && typeof options.includeAllCases !== 'boolean') {
        logger.error('includeAllCases must be a boolean');
        return false;
    }

    if ('includeAttachments' in options && typeof options.includeAttachments !== 'boolean') {
        logger.error('includeAttachments must be a boolean');
        return false;
    }

    if ('runNameTemplate' in options && typeof options.runNameTemplate !== 'string') {
        logger.error('runNameTemplate must be a string');
        return false;
    }

    return true;
}