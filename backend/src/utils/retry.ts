/**
 * Sleeps for the specified number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries a function with exponential backoff.
 * Used for resilient database writes in the signal worker.
 *
 * @param fn - The async function to retry
 * @param retries - Maximum number of retry attempts (default: 3)
 * @param delayMs - Base delay in milliseconds (default: 500)
 * @returns The result of the function
 * @throws The last error if all retries are exhausted
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delayMs: number = 500
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      const backoff = delayMs * Math.pow(2, i);
      console.warn(
        `[RETRY] Attempt ${i + 1}/${retries} failed, retrying in ${backoff}ms:`,
        (error as Error).message
      );
      await sleep(backoff);
    }
  }
  // This should never be reached due to the throw in the loop
  throw new Error('withRetry: unexpected code path');
}
