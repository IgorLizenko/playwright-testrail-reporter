import type { TestCase } from '@playwright/test/reporter';

import type { ParsedTag, ProjectSuiteCombo } from '@types-internal/playwright-reporter.types';

export const REGEX_TAG_TEST = /(\d+)-(\d+)-\D?(\d+)/;
export const REGEX_TAG_STEP = /@\D?(\d+)/g;

/**
 * Parses a single TestRail tag in the format "projectId-suiteId-caseId" or "projectId-suiteId-RcaseId"
 * where R is any non-digit character
 * @param tag - A tag string from Playwright test case tags
 * @returns ParsedTag object containing projectId, suiteId, and caseId if the tag matches the expected format,
 *          null otherwise
 * @example
 * parseSingleTag("123-456-789") // returns { projectId: 123, suiteId: 456, caseId: 789 }
 * parseSingleTag("123-456-R789") // returns { projectId: 123, suiteId: 456, caseId: 789 }
 */
export function parseSingleTag(tag: TestCase['tags'][number]): ParsedTag | null {
    const match = REGEX_TAG_TEST.exec(tag);

    if (match) {
        return {
            projectId: Number(match[1]),
            suiteId: Number(match[2]),
            caseId: Number(match[3])
        };
    }

    return null;
}

/**
 * Parses an array of TestRail tags and groups them by project and suite. Handles duplicate case IDs by including them only once.
 * @param tags - An array of tag strings from Playwright test case tags
 * @returns An array of ProjectSuiteCombo objects, each containing projectId, suiteId, and an array of unique caseIds
 *          if at least one tag matches the expected format, null otherwise
 */
export function parseArrayOfTags(tags: TestCase['tags']): ProjectSuiteCombo[] | null {
    const arrayParsedValidTags = tags.map((tag) => parseSingleTag(tag)).filter((parsedTag) => parsedTag !== null);

    if (arrayParsedValidTags.length === 0) {
        return null;
    }

    const groupedResults = new Map<string, ProjectSuiteCombo>();

    for (const parsedTag of arrayParsedValidTags) {
        const key = `${parsedTag.projectId}-${parsedTag.suiteId}`;
        const existingGroup = groupedResults.get(key);

        /*
            Create new group if it doesn't exist
            Add case ID to the existing group if case ID is not already included
        */
        if (!existingGroup) {
            groupedResults.set(key, {
                projectId: parsedTag.projectId,
                suiteId: parsedTag.suiteId,
                arrayCaseIds: [parsedTag.caseId]
            });
        } else if (!existingGroup.arrayCaseIds.includes(parsedTag.caseId)) {
            existingGroup.arrayCaseIds.push(parsedTag.caseId);
        }
    }

    return Array.from(groupedResults.values());
}