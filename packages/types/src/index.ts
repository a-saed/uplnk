/**
 * @uplnk/types — Shared types for uplnk uploads.
 */

/** Progress info for a single upload. */
export interface UploadProgress {
  /** Bytes uploaded so far. */
  loaded: number;
  /** Total bytes if computable. */
  total?: number;
  /** 0–100. */
  percent?: number;
  /** Bytes per second. */
  speed?: number;
  /** Seconds remaining (estimate). */
  eta?: number;
}

/** Options for progress reporting. */
export interface ProgressOptions {
  /** Minimum ms between progress callbacks. Default: 100. */
  throttleMs?: number;
  /** Emit initial 0% progress. Default: true. */
  emitOnStart?: boolean;
  /** Emit final 100% progress. Default: true. */
  emitOnEnd?: boolean;
}

/** Upload error variants. */
export type UploadError =
  | { type: "abort" }
  | { type: "timeout" }
  | { type: "network" }
  | { type: "http"; status: number; response?: string };

/** Options for retry behavior. */
export interface RetryOptions {
  /** Max number of attempts (including first). */
  attempts: number;
  /** Delay in ms before next attempt. Can be a number or a function that calculates delay based on attempt. */
  delayMs: number | ((attempt: number) => number);
  /** Return true to retry on this error. */
  shouldRetry: (err: UploadError, attempt: number) => boolean;
}

/** HTTP method for upload. */
export type UplnkMethod = "PUT" | "POST" | "PATCH";

/** Options for a single upload. */
export interface UplnkOptions {
  /** Destination URL (e.g. signed URL). */
  url: string;
  /** File or blob to upload. */
  file: File | Blob;

  /** HTTP method. Default: "PUT". */
  method?: UplnkMethod;
  /** Request headers. */
  headers?: Record<string, string>;
  /** Send cookies/credentials. Default: false. */
  withCredentials?: boolean;

  /** Abort signal to cancel the upload. */
  signal?: AbortSignal;
  /** Abort after this many ms. */
  timeoutMs?: number;

  /** Progress reporting options. */
  progress?: ProgressOptions;
  /** Progress callback. */
  onProgress?: (progress: UploadProgress) => void;

  /** Called before send(). */
  onStart?: (xhr: XMLHttpRequest) => void;
  /** Called on completion (before promise resolves). */
  onResponse?: (xhr: XMLHttpRequest) => void;
  /** Called before rejection. */
  onError?: (err: UploadError, xhr?: XMLHttpRequest) => void;

  /** Retry configuration. */
  retry?: RetryOptions;
}

/** Types-only package; no runtime. */
export const __uplnk_types = true;
