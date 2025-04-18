import { parseSingleTag, parseSingleTestTags } from '@reporter/utils/tags';

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
    });

    describe('Test tags parsing', function () {
        it('Should parse array consisting of a single tag correctly', function () {
            const tags = ['111-222-333'];
            expect(parseSingleTestTags(tags)).toEqual([
                {
                    projectId: 111,
                    suiteId: 222,
                    arrayCaseIds: [333]
                }
            ]);
        });

        it('Should parse array of two tags correctly', function () {
            const tags = ['111-222-333', '111-222-444'];
            expect(parseSingleTestTags(tags)).toEqual([
                {
                    projectId: 111,
                    suiteId: 222,
                    arrayCaseIds: [333, 444]
                }
            ]);
        });

        it('Should handle duplicates', function () {
            const tags = ['111-222-333', '111-222-333'];
            expect(parseSingleTestTags(tags)).toEqual([
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
            expect(parseSingleTestTags(tags)).toEqual([
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

        it('Should return null for an empty array', function () {
            expect(parseSingleTestTags([])).toEqual(null);
        });
    });
});