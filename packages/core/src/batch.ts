/**
 * @uplnk/core/batch — Batch upload utilities with concurrency control.
 */

import { uplnk } from "./index";
import type { UplnkOptions, UploadProgress, UploadError } from "@uplnk/types";

/** Status of a single upload in a batch. */
export type BatchUploadStatus = "pending" | "uploading" | "completed" | "failed";

/** Information about a single upload in a batch. */
export interface BatchUploadItem {
  /** Unique identifier for this upload. */
  id: string;
  /** Current status of the upload. */
  status: BatchUploadStatus;
  /** Upload options. */
  options: UplnkOptions;
  /** Current progress (if uploading). */
  progress?: UploadProgress;
  /** Error (if failed). */
  error?: UploadError;
  /** Completion timestamp. */
  completedAt?: number;
}

/** Overall batch progress information. */
export interface BatchProgress {
  /** Total number of uploads. */
  total: number;
  /** Number of completed uploads. */
  completed: number;
  /** Number of failed uploads. */
  failed: number;
  /** Number of pending uploads. */
  pending: number;
  /** Number of currently uploading. */
  uploading: number;
  /** Overall completion percentage (0-100). */
  percent: number;
  /** Total bytes across all uploads. */
  totalBytes: number;
  /** Uploaded bytes across all uploads. */
  uploadedBytes: number;
}

/** Options for batch uploads. */
export interface BatchUploadOptions {
  /** Maximum number of concurrent uploads (default: 3). */
  concurrency?: number;
  /** Called when overall batch progress changes. */
  onProgress?: (progress: BatchProgress) => void;
  /** Called when an individual upload completes. */
  onItemComplete?: (item: BatchUploadItem) => void;
  /** Called when an individual upload fails. */
  onItemError?: (item: BatchUploadItem) => void;
  /** Whether to stop on first error (default: false). */
  stopOnError?: boolean;
  /** Abort signal to cancel all uploads. */
  signal?: AbortSignal;
}

/** Result of a batch upload operation. */
export interface BatchUploadResult {
  /** All upload items with their final status. */
  items: BatchUploadItem[];
  /** Number of successful uploads. */
  successful: number;
  /** Number of failed uploads. */
  failed: number;
  /** Whether the batch was aborted. */
  aborted: boolean;
}

/**
 * Upload multiple files concurrently with progress tracking.
 *
 * @param uploads - Array of upload options (each should have a unique URL or file)
 * @param options - Batch upload options
 * @returns Result containing status of all uploads
 *
 * @example
 * ```ts
 * const uploads = files.map((file, i) => ({
 *   url: signedUrls[i],
 *   file,
 * }));
 *
 * const result = await batchUpload(uploads, {
 *   concurrency: 5,
 *   onProgress: (p) => console.log(`${p.percent}% (${p.completed}/${p.total})`),
 *   onItemError: (item) => console.error(`Failed: ${item.id}`, item.error),
 * });
 *
 * console.log(`${result.successful} succeeded, ${result.failed} failed`);
 * ```
 */
export async function batchUpload(
  uploads: UplnkOptions[],
  options: BatchUploadOptions = {},
): Promise<BatchUploadResult> {
  const {
    concurrency = 3,
    onProgress,
    onItemComplete,
    onItemError,
    stopOnError = false,
    signal,
  } = options;

  // Initialize items
  const items: BatchUploadItem[] = uploads.map((opts, index) => ({
    id: `upload-${index}`,
    status: "pending" as const,
    options: opts,
  }));

  let completed = 0;
  let failed = 0;
  let aborted = false;

  // Calculate total bytes
  const totalBytes = uploads.reduce(
    (sum, opts) => sum + (opts.file instanceof Blob ? opts.file.size : 0),
    0,
  );

  // Track uploaded bytes per item
  const uploadedBytesMap = new Map<string, number>();

  const emitProgress = (): void => {
    if (!onProgress) return;

    const uploadedBytes = Array.from(uploadedBytesMap.values()).reduce(
      (sum, bytes) => sum + bytes,
      0,
    );

    const batchProgress: BatchProgress = {
      total: items.length,
      completed,
      failed,
      pending: items.filter((i) => i.status === "pending").length,
      uploading: items.filter((i) => i.status === "uploading").length,
      percent: items.length > 0 ? (completed / items.length) * 100 : 0,
      totalBytes,
      uploadedBytes,
    };

    onProgress(batchProgress);
  };

  const processItem = async (item: BatchUploadItem): Promise<void> => {
    if (aborted) return;

    item.status = "uploading";
    uploadedBytesMap.set(item.id, 0);
    emitProgress();

    try {
      await uplnk({
        ...item.options,
        signal,
        onProgress: (progress) => {
          item.progress = progress;
          uploadedBytesMap.set(item.id, progress.loaded);
          emitProgress();
        },
      });

      item.status = "completed";
      item.completedAt = Date.now();
      completed++;
      uploadedBytesMap.set(item.id, item.options.file instanceof Blob ? item.options.file.size : 0);
      emitProgress();
      onItemComplete?.(item);
    } catch (err) {
      item.status = "failed";
      item.error = err as UploadError;
      item.completedAt = Date.now();
      failed++;
      emitProgress();
      onItemError?.(item);

      if (stopOnError) {
        aborted = true;
      }
    }
  };

  // Check if already aborted
  if (signal?.aborted) {
    return {
      items,
      successful: 0,
      failed: 0,
      aborted: true,
    };
  }

  // Handle abort signal
  const onAbort = (): void => {
    aborted = true;
  };
  signal?.addEventListener("abort", onAbort);

  try {
    // Initial progress
    emitProgress();

    // Process uploads with concurrency limit
    const queue = [...items];
    const active: Promise<void>[] = [];

    while (queue.length > 0 || active.length > 0) {
      if (aborted) break;

      // Start new uploads up to concurrency limit
      while (active.length < concurrency && queue.length > 0) {
        const item = queue.shift()!;
        const promise = processItem(item).then(() => {
          const index = active.indexOf(promise);
          if (index > -1) active.splice(index, 1);
        });
        active.push(promise);
      }

      // Wait for at least one to complete
      if (active.length > 0) {
        await Promise.race(active);
      }
    }

    // Wait for all active uploads to complete
    await Promise.all(active);
  } finally {
    signal?.removeEventListener("abort", onAbort);
  }

  return {
    items,
    successful: completed,
    failed,
    aborted,
  };
}

/**
 * Upload files sequentially (one at a time).
 *
 * @param uploads - Array of upload options
 * @param options - Batch upload options (concurrency is ignored)
 * @returns Result containing status of all uploads
 *
 * @example
 * ```ts
 * const result = await sequentialUpload(uploads, {
 *   onProgress: (p) => updateProgressBar(p.percent),
 *   stopOnError: true,
 * });
 * ```
 */
export async function sequentialUpload(
  uploads: UplnkOptions[],
  options: Omit<BatchUploadOptions, "concurrency"> = {},
): Promise<BatchUploadResult> {
  return batchUpload(uploads, { ...options, concurrency: 1 });
}

/**
 * Create a batch upload queue that can be controlled dynamically.
 *
 * @param options - Batch upload options
 * @returns Upload queue controller
 *
 * @example
 * ```ts
 * const queue = createUploadQueue({
 *   concurrency: 3,
 *   onProgress: (p) => console.log(`${p.percent}%`),
 * });
 *
 * queue.add({ url: url1, file: file1 });
 * queue.add({ url: url2, file: file2 });
 *
 * await queue.start();
 *
 * // Add more while running
 * queue.add({ url: url3, file: file3 });
 *
 * await queue.waitForCompletion();
 * ```
 */
export function createUploadQueue(options: BatchUploadOptions = {}) {
  const items: BatchUploadItem[] = [];
  const controller = new AbortController();
  let isRunning = false;
  let currentBatch: Promise<BatchUploadResult> | null = null;

  const { concurrency = 3, onProgress, onItemComplete, onItemError } = options;

  return {
    /**
     * Add an upload to the queue.
     */
    add(uploadOptions: UplnkOptions): string {
      const id = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const item: BatchUploadItem = {
        id,
        status: "pending",
        options: uploadOptions,
      };
      items.push(item);
      return id;
    },

    /**
     * Add multiple uploads to the queue.
     */
    addMany(uploadOptions: UplnkOptions[]): string[] {
      return uploadOptions.map((opts) => this.add(opts));
    },

    /**
     * Start processing the queue (non-blocking).
     */
    start(): void {
      if (isRunning) return;
      isRunning = true;

      const pendingItems = items.filter((i) => i.status === "pending");
      if (pendingItems.length === 0) return;

      currentBatch = batchUpload(
        pendingItems.map((i) => i.options),
        {
          concurrency,
          signal: controller.signal,
          onProgress,
          onItemComplete,
          onItemError,
        },
      ).finally(() => {
        isRunning = false;
        currentBatch = null;
      });
    },

    /**
     * Wait for all uploads to complete.
     */
    async waitForCompletion(): Promise<BatchUploadResult> {
      if (!isRunning) {
        this.start();
      }

      if (!currentBatch) {
        return {
          items,
          successful: items.filter((i) => i.status === "completed").length,
          failed: items.filter((i) => i.status === "failed").length,
          aborted: false,
        };
      }

      return currentBatch;
    },

    /**
     * Abort all pending and active uploads.
     */
    abort(): void {
      controller.abort();
      isRunning = false;
    },

    /**
     * Get current queue status.
     */
    getStatus() {
      return {
        total: items.length,
        pending: items.filter((i) => i.status === "pending").length,
        uploading: items.filter((i) => i.status === "uploading").length,
        completed: items.filter((i) => i.status === "completed").length,
        failed: items.filter((i) => i.status === "failed").length,
        isRunning,
      };
    },

    /**
     * Get all items in the queue.
     */
    getItems(): BatchUploadItem[] {
      return [...items];
    },

    /**
     * Clear completed and failed items from the queue.
     */
    clear(): void {
      const indicesToRemove: number[] = [];
      items.forEach((item, index) => {
        if (item.status === "completed" || item.status === "failed") {
          indicesToRemove.push(index);
        }
      });
      indicesToRemove.reverse().forEach((index) => items.splice(index, 1));
    },
  };
}
