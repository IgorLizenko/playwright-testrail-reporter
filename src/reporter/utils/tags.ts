import type { TestCase } from '@playwright/test/reporter';

import type { ParsedTag, ProjectSuiteCombo } from '@types-internal/playwright-reporter.types';

/**
 * Parses a single TestRail tag in the format "projectId-suiteId-caseId" or "projectId-suiteId-RcaseId"
 * where R is any non-digit character
 * @param tag - A tag string from Playwright test case tags
 * @returns ParsedTag object containing projectId, suiteId, and caseId if the tag matches the expected format,
 *          undefined otherwise
 * @example
 * parseSingleTag("123-456-789") // returns { projectId: 123, suiteId: 456, caseId: 789 }
 * parseSingleTag("123-456-R789") // returns { projectId: 123, suiteId: 456, caseId: 789 }
 */
export function parseSingleTag(tag: TestCase['tags'][number]): ParsedTag | undefined {
    const regex = /(\d+)-(\d+)-\D?(\d+)/;

    const match = regex.exec(tag);

    if (match) {
        return {
            projectId: Number(match[1]),
            suiteId: Number(match[2]),
            caseId: Number(match[3])
        };
    }

    return undefined;
}

/**
 * Parses an array of TestRail tags and groups them by project and suite
 * @param tags - An array of tag strings from Playwright test case tags
 * @returns An array of ProjectSuiteCombo objects, each containing projectId, suiteId, and an array of caseIds
 *          if at least one tag matches the expected format, undefined otherwise
 */
export function parseSingleTestTags(tags: TestCase['tags']): ProjectSuiteCombo[] | undefined {
    const arrayParsedValidTags = tags.map((tag) => parseSingleTag(tag)).filter((parsedTag) => parsedTag !== undefined);

    if (arrayParsedValidTags.length === 0) {
        return undefined;
    }

    const groupedResults = new Map<string, ProjectSuiteCombo>();

    for (const parsedTag of arrayParsedValidTags) {
        const key = `${parsedTag.projectId}-${parsedTag.suiteId}`;
        const existingGroup = groupedResults.get(key);

        if (existingGroup) {
            // Handle case when a single Playwright test have repetitions of the same tag with TestRail case ID
            if (!existingGroup.arrayCaseIds.includes(parsedTag.caseId)) {
                existingGroup.arrayCaseIds.push(parsedTag.caseId);
            }
        } else {
            groupedResults.set(key, {
                projectId: parsedTag.projectId,
                suiteId: parsedTag.suiteId,
                arrayCaseIds: [parsedTag.caseId]
            });
        }
    }

    return Array.from(groupedResults.values());
}