import { parseArrayOfTags, parseSingleTag } from '@reporter/utils/tags';

describe('Playwright tags parsing', function () {
    describe('Single tag parsing', function () {
        it('Should parse single simple tag correctly', function () {
            const tag = '111-222-333';
            expect(parseSingleTag(tag)).toEqual({
                projectId: 111,
                suiteId: 222,
                caseId: 333
            });
        });

        it('Should parse a tag with prefix in the case ID', function () {
            const tag = '111-222-C333';
            expect(parseSingleTag(tag)).toEqual({
                projectId: 111,
                suiteId: 222,
                caseId: 333
            });
        });

        it('Should return null for empty tag', function () {
            const tag = '';
            expect(parseSingleTag(tag)).toEqual(null);
        });

        it('Should return null for tag of a wrong type', function () {
            const tag = { a: 5 } as unknown as string;
            expect(parseSingleTag(tag)).toEqual(null);
        });

        it('Should return null for invalid tag', function () {
            const tag = '111-222-XX333';
            expect(parseSingleTag(tag)).toEqual(null);
        });

        it('Should parse a tag without suite ID correctly', function () {
            const tag = '111-R333';
            expect(parseSingleTag(tag)).toEqual({
                projectId: 111,
                suiteId: null,
                caseId: 333
            });
        });
    });

    describe('Test tags parsing', function () {
        it('Should parse array consisting of a single tag correctly', function () {
            const tags = ['111-222-333'];
            expect(parseArrayOfTags(tags)).toEqual([
                {
                    projectId: 111,
                    suiteId: 222,
                    arrayCaseIds: [333]
                }
            ]);
        });

        it('Should parse array of two tags correctly', function () {
            const tags = ['111-222-333', '111-222-444'];
            expect(parseArrayOfTags(tags)).toEqual([
                {
                    projectId: 111,
                    suiteId: 222,
                    arrayCaseIds: [333, 444]
                }
            ]);
        });

        it('Should handle duplicates', function () {
            const tags = ['111-222-333', '111-222-333'];
            expect(parseArrayOfTags(tags)).toEqual([
                {
                    projectId: 111,
                    suiteId: 222,
                    arrayCaseIds: [333]
                }
            ]);
        });

        it('Should parse array of multiple tags (including invalid and duplicates) from same and different projects and suites correctly', function () {
            const tags = [
                '111-222-C111', '111-222-333', '111-222-4444', '111-222-invalid',
                'invalid',
                '111-333-111', '111-333-444',
                '222-444-555', '222-444-666',
                '333-555-C10093', '333-555-C10094', '333-555-10093',
                '333-666-777'
            ];
            expect(parseArrayOfTags(tags)).toEqual([
                {
                    projectId: 111,
                    suiteId: 222,
                    arrayCaseIds: [111, 333, 4444]
                },
                {
                    projectId: 111,
                    suiteId: 333,
                    arrayCaseIds: [111, 444]
                },
                {
                    projectId: 222,
                    suiteId: 444,
                    arrayCaseIds: [555, 666]
                },
                {
                    projectId: 333,
                    suiteId: 555,
                    arrayCaseIds: [10093, 10094]
                },
                {
                    projectId: 333,
                    suiteId: 666,
                    arrayCaseIds: [777]
                }
            ]);
        });

        it('Should group both tags with suiteIds and without', function () {
            const tags = [
                '110-222', '110-223',
                '111-222-333', '111-222-334', '111-222-335',
                '112-222-444', '112-222-445', '112-222-446'
            ];
            expect(parseArrayOfTags(tags)).toEqual([
                {
                    projectId: 110,
                    suiteId: null,
                    arrayCaseIds: [222, 223]
                },
                {
                    projectId: 111,
                    suiteId: 222,
                    arrayCaseIds: [333, 334, 335]
                },
                {
                    projectId: 112,
                    suiteId: 222,
                    arrayCaseIds: [444, 445, 446]
                }
            ]);
        });

        it('Should return null for an empty array', function () {
            expect(parseArrayOfTags([])).toEqual(null);
        });
    });
});