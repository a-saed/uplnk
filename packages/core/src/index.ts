/**
 * @uplnk/core — Low-level upload with progress.
 * Browser only (XMLHttpRequest).
 */

import type {
  UplnkOptions,
  UploadProgress,
  UploadError,
  ProgressOptions,
} from "@uplnk/types";

export type { UplnkOptions, UploadProgress, UploadError, ProgressOptions, RetryOptions } from "@uplnk/types";

const DEFAULT_METHOD: UplnkOptions["method"] = "PUT";
const DEFAULT_THROTTLE_MS = 100;
const DEFAULT_EMIT_ON_START = true;
const DEFAULT_EMIT_ON_END = true;

function defaultProgressOptions(): Required<ProgressOptions> {
  return {
    throttleMs: DEFAULT_THROTTLE_MS,
    emitOnStart: DEFAULT_EMIT_ON_START,
    emitOnEnd: DEFAULT_EMIT_ON_END,
  };
}

function createProgress(loaded: number, total?: number): UploadProgress {
  const totalNum = total ?? 0;
  const percent =
    totalNum > 0 ? Math.min(100, (loaded / totalNum) * 100) : undefined;
  return { loaded, total: totalNum || undefined, percent };
}

function emitProgress(
  opts: UplnkOptions,
  progress: UploadProgress,
  lastEmitTime: { value: number },
  throttleMs: number
): void {
  const now = Date.now();
  if (now - lastEmitTime.value < throttleMs && progress.percent !== 100) return;
  lastEmitTime.value = now;
  opts.onProgress?.(progress);
}

function doUpload(opts: UplnkOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = opts.url;
    if (!url) throw new Error("uplnk: url is required");
    const {
      file,
      method: methodOpt = DEFAULT_METHOD,
      headers = {},
      withCredentials = false,
      signal,
      timeoutMs,
      onStart,
      onResponse,
      onError,
    } = opts;

    const progressOpts = { ...defaultProgressOptions(), ...opts.progress };
    const { throttleMs, emitOnStart, emitOnEnd } = progressOpts;
    const lastEmitTime = { value: 0 };
    const startTime = Date.now();

    const xhr = new XMLHttpRequest();
    const body: XMLHttpRequestBodyInit = file;

    const finish = (err: UploadError | null): void => {
      if (err) {
        onError?.(err, xhr);
        reject(err);
      } else {
        onResponse?.(xhr);
        resolve();
      }
    };

    const handleError = (err: UploadError): void => {
      finish(err);
    };

    if (signal?.aborted) {
      handleError({ type: "abort" });
      return;
    }

    const onAbort = (): void => handleError({ type: "abort" });
    signal?.addEventListener("abort", onAbort);

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (typeof timeoutMs === "number" && timeoutMs > 0) {
      timeoutId = setTimeout(() => {
        xhr.abort();
        handleError({ type: "timeout" });
      }, timeoutMs);
    }

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const total = e.total;
        const loaded = e.loaded;
        const progress = createProgress(loaded, total);
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed > 0) {
          progress.speed = loaded / elapsed;
          if (progress.speed && progress.total != null && progress.loaded < progress.total) {
            progress.eta = (progress.total - progress.loaded) / progress.speed;
          }
        }
        emitProgress(opts, progress, lastEmitTime, throttleMs);
      } else {
        const progress = createProgress(e.loaded);
        emitProgress(opts, progress, lastEmitTime, throttleMs);
      }
    });

    xhr.addEventListener("load", () => {
      signal?.removeEventListener("abort", onAbort);
      if (timeoutId != null) clearTimeout(timeoutId);
      if (xhr.status >= 200 && xhr.status < 300) {
        if (emitOnEnd && opts.onProgress) {
          const total = body instanceof Blob ? body.size : 0;
          opts.onProgress(createProgress(total, total));
        }
        finish(null);
      } else {
        handleError({
          type: "http",
          status: xhr.status,
          response: xhr.responseText || undefined,
        });
      }
    });

    xhr.addEventListener("error", () => {
      signal?.removeEventListener("abort", onAbort);
      if (timeoutId != null) clearTimeout(timeoutId);
      handleError({ type: "network" });
    });

    xhr.addEventListener("abort", () => {
      signal?.removeEventListener("abort", onAbort);
      if (timeoutId != null) clearTimeout(timeoutId);
      handleError({ type: "abort" });
    });

    const method = (methodOpt ?? DEFAULT_METHOD) as string;
    xhr.open(method, url, true);
    xhr.withCredentials = withCredentials;

    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value);
    }

    onStart?.(xhr);

    if (emitOnStart && opts.onProgress) {
      opts.onProgress(createProgress(0, body instanceof Blob ? body.size : undefined));
    }

    xhr.send(body);
  });
}

/**
 * Execute a single HTTP upload with optional progress and retry.
 * Browser only (uses XMLHttpRequest).
 */
export async function uplnk(options: UplnkOptions): Promise<void> {
  const { retry } = options;

  if (!retry) {
    return doUpload(options);
  }

  const { attempts, delayMs, shouldRetry } = retry;
  let lastErr: UploadError | undefined;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      await doUpload(options);
      return;
    } catch (err) {
      lastErr = err as UploadError;
      if (attempt === attempts - 1 || !shouldRetry(lastErr, attempt)) {
        throw lastErr;
      }
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  if (lastErr) throw lastErr;
}
