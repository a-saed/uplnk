import { describe, it, expect } from "vitest";
import {
  exponentialBackoff,
  fixedDelay,
  networkErrorsOnly,
  customRetry,
  calculateBackoffDelay,
} from "./retry-strategies";
import type { UploadError } from "@uplnk/types";

describe("retry-strategies", () => {
  describe("exponentialBackoff", () => {
    it("returns RetryOptions with correct structure", () => {
      const retry = exponentialBackoff();
      expect(retry).toHaveProperty("attempts");
      expect(retry).toHaveProperty("delayMs");
      expect(retry).toHaveProperty("shouldRetry");
      expect(retry.attempts).toBe(3);
      expect(typeof retry.shouldRetry).toBe("function");
    });

    it("uses custom maxAttempts", () => {
      const retry = exponentialBackoff({ maxAttempts: 5 });
      expect(retry.attempts).toBe(5);
    });

    it("shouldRetry returns false for abort errors", () => {
      const retry = exponentialBackoff();
      const error: UploadError = { type: "abort" };
      expect(retry.shouldRetry(error, 0)).toBe(false);
    });

    it("shouldRetry returns true for network errors", () => {
      const retry = exponentialBackoff();
      const error: UploadError = { type: "network" };
      expect(retry.shouldRetry(error, 0)).toBe(true);
    });

    it("shouldRetry returns true for timeout errors", () => {
      const retry = exponentialBackoff();
      const error: UploadError = { type: "timeout" };
      expect(retry.shouldRetry(error, 0)).toBe(true);
    });

    it("shouldRetry returns true for retryable HTTP status codes", () => {
      const retry = exponentialBackoff();
      const statuses = [408, 429, 500, 502, 503, 504];

      statuses.forEach((status) => {
        const error: UploadError = { type: "http", status };
        expect(retry.shouldRetry(error, 0)).toBe(true);
      });
    });

    it("shouldRetry returns false for non-retryable HTTP status codes", () => {
      const retry = exponentialBackoff();
      const statuses = [400, 401, 403, 404];

      statuses.forEach((status) => {
        const error: UploadError = { type: "http", status };
        expect(retry.shouldRetry(error, 0)).toBe(false);
      });
    });

    it("supports custom retryable status codes", () => {
      const retry = exponentialBackoff({
        retryableStatuses: [404, 500],
      });

      const error404: UploadError = { type: "http", status: 404 };
      const error503: UploadError = { type: "http", status: 503 };

      expect(retry.shouldRetry(error404, 0)).toBe(true);
      expect(retry.shouldRetry(error503, 0)).toBe(false);
    });

    it("delayMs is a function", () => {
      const retry = exponentialBackoff();
      expect(typeof retry.delayMs).toBe("function");
    });

    it("delayMs function returns increasing delays", () => {
      const retry = exponentialBackoff({ baseDelayMs: 1000, jitter: false });
      const delayFn = retry.delayMs as (attempt: number) => number;

      expect(delayFn(0)).toBe(1000);
      expect(delayFn(1)).toBe(2000);
      expect(delayFn(2)).toBe(4000);
      expect(delayFn(3)).toBe(8000);
    });
  });

  describe("fixedDelay", () => {
    it("returns RetryOptions with fixed delay", () => {
      const retry = fixedDelay({ delayMs: 2000, maxAttempts: 5 });
      expect(retry.attempts).toBe(5);
      expect(retry.delayMs).toBe(2000);
    });

    it("uses default values", () => {
      const retry = fixedDelay();
      expect(retry.attempts).toBe(3);
      expect(retry.delayMs).toBe(1000);
    });

    it("shouldRetry returns false for abort errors", () => {
      const retry = fixedDelay();
      const error: UploadError = { type: "abort" };
      expect(retry.shouldRetry(error, 0)).toBe(false);
    });

    it("shouldRetry returns true for network and timeout errors", () => {
      const retry = fixedDelay();
      expect(retry.shouldRetry({ type: "network" }, 0)).toBe(true);
      expect(retry.shouldRetry({ type: "timeout" }, 0)).toBe(true);
    });

    it("shouldRetry returns true for retryable HTTP statuses", () => {
      const retry = fixedDelay();
      const error: UploadError = { type: "http", status: 503 };
      expect(retry.shouldRetry(error, 0)).toBe(true);
    });
  });

  describe("networkErrorsOnly", () => {
    it("returns RetryOptions with correct structure", () => {
      const retry = networkErrorsOnly();
      expect(retry.attempts).toBe(3);
      expect(retry.delayMs).toBe(1000);
    });

    it("uses custom options", () => {
      const retry = networkErrorsOnly({ delayMs: 5000, maxAttempts: 10 });
      expect(retry.attempts).toBe(10);
      expect(retry.delayMs).toBe(5000);
    });

    it("shouldRetry returns true only for network errors", () => {
      const retry = networkErrorsOnly();

      expect(retry.shouldRetry({ type: "network" }, 0)).toBe(true);
      expect(retry.shouldRetry({ type: "abort" }, 0)).toBe(false);
      expect(retry.shouldRetry({ type: "timeout" }, 0)).toBe(false);
      expect(retry.shouldRetry({ type: "http", status: 500 }, 0)).toBe(false);
    });
  });

  describe("customRetry", () => {
    it("uses provided configuration", () => {
      const shouldRetry = (err: UploadError) => err.type === "network";
      const getDelay = (attempt: number) => 1000 * attempt;

      const retry = customRetry({
        attempts: 7,
        shouldRetry,
        getDelay,
      });

      expect(retry.attempts).toBe(7);
      expect(retry.shouldRetry).toBe(shouldRetry);
      expect(retry.delayMs).toBe(getDelay);
    });

    it("uses default delay when getDelay not provided", () => {
      const retry = customRetry({
        attempts: 3,
        shouldRetry: () => true,
      });

      expect(retry.delayMs).toBe(1000);
    });

    it("shouldRetry can implement custom logic", () => {
      const retry = customRetry({
        attempts: 5,
        shouldRetry: (err, attempt) => {
          if (err.type === "http" && err.status === 503) {
            return attempt < 2;
          }
          return err.type === "network";
        },
      });

      const error503: UploadError = { type: "http", status: 503 };
      const errorNetwork: UploadError = { type: "network" };

      expect(retry.shouldRetry(error503, 0)).toBe(true);
      expect(retry.shouldRetry(error503, 1)).toBe(true);
      expect(retry.shouldRetry(error503, 2)).toBe(false);
      expect(retry.shouldRetry(errorNetwork, 10)).toBe(true);
    });
  });

  describe("calculateBackoffDelay", () => {
    it("calculates exponential backoff correctly", () => {
      expect(calculateBackoffDelay(0, 1000, 30000, false)).toBe(1000);
      expect(calculateBackoffDelay(1, 1000, 30000, false)).toBe(2000);
      expect(calculateBackoffDelay(2, 1000, 30000, false)).toBe(4000);
      expect(calculateBackoffDelay(3, 1000, 30000, false)).toBe(8000);
      expect(calculateBackoffDelay(4, 1000, 30000, false)).toBe(16000);
    });

    it("respects maxDelayMs", () => {
      expect(calculateBackoffDelay(10, 1000, 5000, false)).toBe(5000);
      expect(calculateBackoffDelay(20, 1000, 10000, false)).toBe(10000);
    });

    it("adds jitter when enabled", () => {
      const delay1 = calculateBackoffDelay(2, 1000, 30000, true);
      const delay2 = calculateBackoffDelay(2, 1000, 30000, true);

      // Base delay is 4000
      expect(delay1).toBeGreaterThanOrEqual(4000);
      expect(delay1).toBeLessThanOrEqual(5000); // 4000 + 25% = 5000

      // With jitter, delays should vary (though there's a small chance they could be equal)
      // Just check they're in valid range
      expect(delay2).toBeGreaterThanOrEqual(4000);
      expect(delay2).toBeLessThanOrEqual(5000);
    });

    it("does not add jitter when disabled", () => {
      const delay1 = calculateBackoffDelay(2, 1000, 30000, false);
      const delay2 = calculateBackoffDelay(2, 1000, 30000, false);

      expect(delay1).toBe(4000);
      expect(delay2).toBe(4000);
      expect(delay1).toBe(delay2);
    });
  });
});
