import logger from '@logger';

/**
 * Processes an array of input data in chunks by applying a given async function to each element
 * and resolving the promises in parallel within each chunk.
 *
 * @template T - Type of the input data elements
 * @template R - Type of the output data elements
 *
 * @param {Object} params - The parameters object
 * @param {T[]} params.arrayInputData - Array of input data to be processed
 * @param {number} params.chunkSize - Size of each chunk to process in parallel
 * @param {function(T): Promise<R|null>} params.functionToCall - Async function to apply to each input element
 *
 * @returns {Promise<R[]>} Array of resolved non-null results
 */
export async function resolvePromisesInChunks<T, R>({
    arrayInputData,
    chunkSize,
    functionToCall
}: {
    arrayInputData: T[],
    chunkSize: number,
    functionToCall: (input: T) => Promise<R | null>
}): Promise<R[]> {
    const results: R[] = [];

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