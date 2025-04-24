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

    if (options.apiChunkSize && typeof options.apiChunkSize !== 'number') {
        logger.error('apiChunkSize must be a number');
        return false;
    }

    if (options.closeRuns && typeof options.closeRuns !== 'boolean') {
        logger.error('closeRuns must be a boolean');
        return false;
    }

    if (options.includeAllCases && typeof options.includeAllCases !== 'boolean') {
        logger.error('includeAllCases must be a boolean');
        return false;
    }

    if (options.includeAttachments && typeof options.includeAttachments !== 'boolean') {
        logger.error('includeAttachments must be a boolean');
        return false;
    }

    if (options.runNameTemplate && typeof options.runNameTemplate !== 'string') {
        logger.error('runNameTemplate must be a string');
        return false;
    }

    return true;
}