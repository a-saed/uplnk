/**
 * @uplnk/core/retry-strategies — Common retry strategies for uploads.
 */

import type { UploadError, RetryOptions } from "@uplnk/types";

/**
 * Create a retry strategy with exponential backoff.
 *
 * @param baseDelayMs - Initial delay in milliseconds (default: 1000)
 * @param maxDelayMs - Maximum delay in milliseconds (default: 30000)
 * @param maxAttempts - Maximum number of attempts (default: 3)
 * @param jitter - Add randomness to delay (default: true)
 *
 * @example
 * ```ts
 * await uplnk({
 *   url,
 *   file,
 *   retry: exponentialBackoff({ maxAttempts: 5 })
 * });
 * ```
 */
export function exponentialBackoff(options?: {
  baseDelayMs?: number;
  maxDelayMs?: number;
  maxAttempts?: number;
  jitter?: boolean;
  retryableStatuses?: number[];
}): RetryOptions {
  const {
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    maxAttempts = 3,
    jitter = true,
    retryableStatuses = [408, 429, 500, 502, 503, 504],
  } = options ?? {};

  return {
    attempts: maxAttempts,
    delayMs: (attempt: number) =>
      calculateBackoffDelay(attempt, baseDelayMs, maxDelayMs, jitter),
    shouldRetry: (err: UploadError, attempt: number): boolean => {
      // Don't retry aborts
      if (err.type === "abort") return false;

      // Retry network errors
      if (err.type === "network") return true;

      // Retry timeouts
      if (err.type === "timeout") return true;

      // Retry specific HTTP status codes
      if (err.type === "http" && retryableStatuses.includes(err.status)) {
        return true;
      }

      return false;
    },
  };
}

/**
 * Create a retry strategy with fixed delay.
 *
 * @param delayMs - Fixed delay in milliseconds (default: 1000)
 * @param maxAttempts - Maximum number of attempts (default: 3)
 *
 * @example
 * ```ts
 * await uplnk({
 *   url,
 *   file,
 *   retry: fixedDelay({ delayMs: 2000, maxAttempts: 5 })
 * });
 * ```
 */
export function fixedDelay(options?: {
  delayMs?: number;
  maxAttempts?: number;
  retryableStatuses?: number[];
}): RetryOptions {
  const {
    delayMs = 1000,
    maxAttempts = 3,
    retryableStatuses = [408, 429, 500, 502, 503, 504],
  } = options ?? {};

  return {
    attempts: maxAttempts,
    delayMs,
    shouldRetry: (err: UploadError): boolean => {
      if (err.type === "abort") return false;
      if (err.type === "network" || err.type === "timeout") return true;
      if (err.type === "http" && retryableStatuses.includes(err.status)) {
        return true;
      }
      return false;
    },
  };
}

/**
 * Create a retry strategy that only retries network errors.
 *
 * @param delayMs - Delay in milliseconds (default: 1000)
 * @param maxAttempts - Maximum number of attempts (default: 3)
 *
 * @example
 * ```ts
 * await uplnk({
 *   url,
 *   file,
 *   retry: networkErrorsOnly({ maxAttempts: 5 })
 * });
 * ```
 */
export function networkErrorsOnly(options?: {
  delayMs?: number;
  maxAttempts?: number;
}): RetryOptions {
  const { delayMs = 1000, maxAttempts = 3 } = options ?? {};

  return {
    attempts: maxAttempts,
    delayMs,
    shouldRetry: (err: UploadError): boolean => {
      return err.type === "network";
    },
  };
}

/**
 * Calculate exponential backoff delay with optional jitter.
 *
 * @param attempt - Current attempt number (0-indexed)
 * @param baseDelayMs - Base delay in milliseconds
 * @param maxDelayMs - Maximum delay in milliseconds
 * @param jitter - Whether to add jitter
 * @returns Delay in milliseconds
 *
 * @internal
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  jitter: boolean,
): number {
  const exponentialDelay = Math.min(
    baseDelayMs * Math.pow(2, attempt),
    maxDelayMs,
  );

  if (!jitter) return exponentialDelay;

  // Add random jitter between 0 and 25% of the delay
  const jitterAmount = exponentialDelay * 0.25 * Math.random();
  return exponentialDelay + jitterAmount;
}

/**
 * Create a custom retry strategy with full control.
 *
 * @param options - Retry configuration
 *
 * @example
 * ```ts
 * await uplnk({
 *   url,
 *   file,
 *   retry: customRetry({
 *     attempts: 5,
 *     shouldRetry: (err, attempt) => {
 *       // Custom logic
 *       if (err.type === "http" && err.status === 503) {
 *         return attempt < 3; // Only retry 503s up to 3 times
 *       }
 *       return err.type === "network";
 *     },
 *     getDelay: (attempt) => {
 *       // Custom delay calculation
 *       return 1000 * (attempt + 1);
 *     }
 *   })
 * });
 * ```
 */
export function customRetry(options: {
  attempts: number;
  shouldRetry: (err: UploadError, attempt: number) => boolean;
  getDelay?: (attempt: number) => number;
}): RetryOptions {
  const { attempts, shouldRetry, getDelay } = options;

  return {
    attempts,
    delayMs: getDelay ?? 1000,
    shouldRetry,
  };
}
