import logger from '@logger';

export async function resolvePromisesInChunks<R, T>({
    arrayInputData,
    chunkSize,
    functionToCall
}: {
    arrayInputData: R[],
    chunkSize: number,
    functionToCall: (input: R) => Promise<T | null>
}): Promise<T[]> {
    const results: T[] = [];

    const quantityOfChunks = Math.ceil(arrayInputData.length / chunkSize);

    for (let i = 0; i < quantityOfChunks; i++) {
        const chunk = arrayInputData.slice(i * chunkSize, (i + 1) * chunkSize);
        logger.debug(`Processing chunk ${i + 1} of ${quantityOfChunks}`);
        const chunkResults = (await Promise.all(chunk.map((input) => functionToCall(input))))
            .filter((result) => result !== null);
        results.push(...chunkResults);
    }

    return results;
}