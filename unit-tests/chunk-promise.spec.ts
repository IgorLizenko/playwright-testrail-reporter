import { resolvePromisesInChunks } from '@reporter/utils/chunk-promise';

import logger from '@logger';

jest.mock('@logger', () => ({
    debug: jest.fn()
}));

describe('Resolve promises in chunks', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('Should return empty array when input data is empty', async () => {
        const result = await resolvePromisesInChunks({
            arrayInputData: [],
            chunkSize: 10,
            functionToCall: () => Promise.resolve(null)
        });
        expect(result).toEqual([]);
    });

    it('Should filter out null results', async () => {
        const result = await resolvePromisesInChunks({
            arrayInputData: [1, 2, 3],
            chunkSize: 10,
            functionToCall: (input) => Promise.resolve(input === 2 ? null : input)
        });
        expect(result).toEqual([1, 3]);
    });

    it('Should log debug messages for each chunk', async () => {
        await resolvePromisesInChunks({
            arrayInputData: [1, 2, 3, 4, 5, 6],
            chunkSize: 2,
            functionToCall: (input) => Promise.resolve(input)
        });
        expect(logger.debug).toHaveBeenCalledWith('Processing chunk 1 of 3');
        expect(logger.debug).toHaveBeenCalledWith('Processing chunk 2 of 3');
        expect(logger.debug).toHaveBeenCalledWith('Processing chunk 3 of 3');
    });
});