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

    return true;
}