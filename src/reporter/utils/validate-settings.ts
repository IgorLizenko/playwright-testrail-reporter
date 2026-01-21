import type { ReporterOptions } from '@types-internal/playwright-reporter.types';

import logger from '@logger';

export function validateSettings(options: ReporterOptions): boolean {
    const errors: string[] = [];

    if (typeof options.domain !== 'string' || options.domain.trim() === '') {
        errors.push('domain is required and must be a non-empty string');
    }

    if (typeof options.username !== 'string' || options.username.trim() === '') {
        errors.push('username is required and must be a non-empty string');
    }

    if (typeof options.password !== 'string' || options.password.trim() === '') {
        errors.push('password is required and must be a non-empty string');
    }

    if (options.apiChunkSize !== undefined && (!Number.isInteger(options.apiChunkSize) || options.apiChunkSize < 1)) {
        errors.push('apiChunkSize must be an integer greater than 0');
    }

    const arrayBooleanOptions: (keyof ReporterOptions)[] = ['closeRuns', 'createEmptyRuns', 'includeAllCases', 'includeAttachments'];

    for (const option of arrayBooleanOptions) {
        if (option in options && typeof options[option] !== 'boolean') {
            errors.push(`${option} must be a boolean`);
        }
    }

    if ('runNameTemplate' in options && typeof options.runNameTemplate !== 'string') {
        errors.push('runNameTemplate must be a string');
    }

    if (errors.length > 0) {
        logger.error(`Settings validation failed:\n- ${errors.join('\n- ')}`);
        return false;
    }

    return true;
}