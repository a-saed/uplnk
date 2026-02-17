# API reference

## Core Functions

### `uplnk(options): Promise<void>`

Executes a single HTTP upload. Resolves when the request completes successfully (2xx); rejects with an `UploadError` on failure.

#### Options

| Option            | Type                                               | Required | Default | Description                                         |
| ----------------- | -------------------------------------------------- | -------- | ------- | --------------------------------------------------- |
| `url`             | `string`                                           | Yes      | —       | Destination URL (e.g. signed URL).                  |
| `file`            | `File \| Blob`                                     | Yes      | —       | The payload to upload.                              |
| `method`          | `'PUT' \| 'POST' \| 'PATCH'`                       | No       | `'PUT'` | HTTP method.                                        |
| `headers`         | `Record<string, string>`                           | No       | `{}`    | Request headers.                                    |
| `withCredentials` | `boolean`                                          | No       | `false` | Send cookies / credentials.                         |
| `signal`          | `AbortSignal`                                      | No       | —       | Abort the in-flight upload.                         |
| `timeoutMs`       | `number`                                           | No       | —       | Abort after this many milliseconds.                 |
| `progress`        | `ProgressOptions`                                  | No       | —       | Throttle and lifecycle of progress events.          |
| `onProgress`      | `(progress: UploadProgress) => void`               | No       | —       | Progress callback.                                  |
| `onStart`         | `(xhr: XMLHttpRequest) => void`                    | No       | —       | Called before `send()`.                             |
| `onResponse`      | `(xhr: XMLHttpRequest) => void`                    | No       | —       | Called on completion (before the promise resolves). |
| `onError`         | `(err: UploadError, xhr?: XMLHttpRequest) => void` | No       | —       | Called before the promise rejects.                  |
| `retry`           | `RetryOptions`                                     | No       | —       | Retry configuration (opt-in).                       |

---

## Batch Upload Functions

### `batchUpload(uploads, options): Promise<BatchUploadResult>`

Upload multiple files concurrently with progress tracking and concurrency control.

```ts
const uploads = files.map((file, i) => ({
  url: signedUrls[i],
  file,
}));

const result = await batchUpload(uploads, {
  concurrency: 5,
  onProgress: (p) => console.log(`${p.percent}% (${p.completed}/${p.total})`),
  onItemError: (item) => console.error(`Failed: ${item.id}`, item.error),
});

console.log(`${result.successful} succeeded, ${result.failed} failed`);
```

#### Batch Options

| Option           | Type                                | Default | Description                         |
| ---------------- | ----------------------------------- | ------- | ----------------------------------- |
| `concurrency`    | `number`                            | `3`     | Maximum concurrent uploads.         |
| `onProgress`     | `(progress: BatchProgress) => void` | —       | Called when batch progress changes. |
| `onItemComplete` | `(item: BatchUploadItem) => void`   | —       | Called when an upload completes.    |
| `onItemError`    | `(item: BatchUploadItem) => void`   | —       | Called when an upload fails.        |
| `stopOnError`    | `boolean`                           | `false` | Stop all uploads on first error.    |
| `signal`         | `AbortSignal`                       | —       | Abort all uploads.                  |

### `sequentialUpload(uploads, options): Promise<BatchUploadResult>`

Upload files one at a time (concurrency: 1).

```ts
const result = await sequentialUpload(uploads, {
  onProgress: (p) => updateProgressBar(p.percent),
  stopOnError: true,
});
```

### `createUploadQueue(options): UploadQueue`

Create a dynamic upload queue that can be controlled at runtime.

```ts
const queue = createUploadQueue({
  concurrency: 3,
  onProgress: (p) => console.log(`${p.percent}%`),
});

queue.add({ url: url1, file: file1 });
queue.add({ url: url2, file: file2 });

await queue.start();

// Add more while running
queue.add({ url: url3, file: file3 });

await queue.waitForCompletion();
```

---

## Retry Strategies

### `exponentialBackoff(options?): RetryOptions`

Retry with exponential backoff and optional jitter.

```ts
await uplnk({
  url,
  file,
  retry: exponentialBackoff({
    maxAttempts: 5,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    jitter: true,
  }),
});
```

### `fixedDelay(options?): RetryOptions`

Retry with fixed delay between attempts.

```ts
await uplnk({
  url,
  file,
  retry: fixedDelay({ delayMs: 2000, maxAttempts: 5 }),
});
```

### `networkErrorsOnly(options?): RetryOptions`

Only retry network errors (not HTTP errors).

```ts
await uplnk({
  url,
  file,
  retry: networkErrorsOnly({ maxAttempts: 3 }),
});
```

### `customRetry(options): RetryOptions`

Create a fully custom retry strategy.

```ts
await uplnk({
  url,
  file,
  retry: customRetry({
    attempts: 5,
    shouldRetry: (err, attempt) => {
      if (err.type === "http" && err.status === 503) {
        return attempt < 3;
      }
      return err.type === "network";
    },
    getDelay: (attempt) => 1000 * (attempt + 1),
  }),
});
```

---

## Validation Functions

### `validateFile(file, options): ValidationError | null`

Validate file before upload with size, type, and custom checks.

```ts
const error = validateFile(file, {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ["image/png", "image/jpeg"],
  customValidator: (file) => {
    if (file.name.includes("test")) {
      return { type: "custom", message: "Test files not allowed" };
    }
    return null;
  },
});

if (error) {
  alert(formatValidationError(error));
}
```

### `validateSize(file, options): ValidationError | null`

Validate file size only.

```ts
const error = validateSize(file, {
  maxSize: 5 * 1024 * 1024, // 5MB
  minSize: 1024, // 1KB
});
```

### `validateType(file, options): ValidationError | null`

Validate file type by MIME type or extension.

```ts
const error = validateType(file, {
  allowedTypes: ["image/png", "image/jpeg"],
  allowedExtensions: [".png", ".jpg", ".jpeg"],
});
```

### `formatValidationError(error): string`

Convert validation error to human-readable message.

```ts
const error = validateFile(file, { maxSize: 5000000 });
if (error) {
  alert(formatValidationError(error));
  // "File size (10 MB) exceeds maximum allowed size (5 MB)"
}
```

### `formatBytes(bytes, decimals?): string`

Format bytes into human-readable size.

```ts
formatBytes(1536); // "1.5 KB"
formatBytes(1048576); // "1 MB"
```

### File Type Presets

Use `FILE_TYPE_PRESETS` for common file types:

```ts
import { validateFile, FILE_TYPE_PRESETS } from "@uplnk/core";

validateFile(file, {
  allowedTypes: FILE_TYPE_PRESETS.images,
  // ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp", "image/svg+xml"]
});
```

Available presets: `images`, `videos`, `audio`, `documents`, `archives`.

### File Size Presets

Use `FILE_SIZE_PRESETS` for common size limits:

```ts
import { validateFile, FILE_SIZE_PRESETS } from "@uplnk/core";

validateFile(file, {
  maxSize: FILE_SIZE_PRESETS["10MB"],
});
```

Available presets: `1MB`, `5MB`, `10MB`, `50MB`, `100MB`, `500MB`, `1GB`.

---

## Types

### `UploadProgress`

| Field     | Type                  | Description                  |
| --------- | --------------------- | ---------------------------- |
| `loaded`  | `number`              | Bytes uploaded so far.       |
| `total`   | `number \| undefined` | Total bytes when computable. |
| `percent` | `number \| undefined` | 0–100.                       |
| `speed`   | `number \| undefined` | Bytes per second.            |
| `eta`     | `number \| undefined` | Estimated seconds remaining. |

### `ProgressOptions`

| Field         | Type      | Default | Description                            |
| ------------- | --------- | ------- | -------------------------------------- |
| `throttleMs`  | `number`  | `100`   | Minimum ms between progress callbacks. |
| `emitOnStart` | `boolean` | `true`  | Emit initial 0% progress.              |
| `emitOnEnd`   | `boolean` | `true`  | Emit final 100% progress.              |

### `UploadError`

```ts
type UploadError =
  | { type: "abort" }
  | { type: "timeout" }
  | { type: "network" }
  | { type: "http"; status: number; response?: string };
```

Example:

```ts
try {
  await uplnk({ url, file });
} catch (err) {
  if (err.type === "timeout") console.log("retry or notify user");
}
```

### `RetryOptions`

| Field         | Type                                             | Description                                             |
| ------------- | ------------------------------------------------ | ------------------------------------------------------- |
| `attempts`    | `number`                                         | Max attempts (including the first).                     |
| `delayMs`     | `number \| ((attempt: number) => number)`        | Delay before the next attempt. Can be fixed or dynamic. |
| `shouldRetry` | `(err: UploadError, attempt: number) => boolean` | Return `true` to retry.                                 |

Example:

```ts
retry: {
  attempts: 3,
  delayMs: 1000,
  shouldRetry: (err, attempt) => err.type === "network",
}
```

::: warning Signed URLs may expire
Use retries only when appropriate; signed URLs may expire.
:::

### `BatchProgress`

| Field           | Type     | Description                            |
| --------------- | -------- | -------------------------------------- |
| `total`         | `number` | Total number of uploads.               |
| `completed`     | `number` | Number of completed uploads.           |
| `failed`        | `number` | Number of failed uploads.              |
| `pending`       | `number` | Number of pending uploads.             |
| `uploading`     | `number` | Number of currently uploading.         |
| `percent`       | `number` | Overall completion percentage (0-100). |
| `totalBytes`    | `number` | Total bytes across all uploads.        |
| `uploadedBytes` | `number` | Uploaded bytes across all uploads.     |

### `BatchUploadItem`

| Field         | Type                                                  | Description           |
| ------------- | ----------------------------------------------------- | --------------------- |
| `id`          | `string`                                              | Unique identifier.    |
| `status`      | `'pending' \| 'uploading' \| 'completed' \| 'failed'` | Current status.       |
| `options`     | `UplnkOptions`                                        | Upload options.       |
| `progress`    | `UploadProgress?`                                     | Current progress.     |
| `error`       | `UploadError?`                                        | Error if failed.      |
| `completedAt` | `number?`                                             | Completion timestamp. |

### `BatchUploadResult`

| Field        | Type                | Description                         |
| ------------ | ------------------- | ----------------------------------- |
| `items`      | `BatchUploadItem[]` | All upload items with final status. |
| `successful` | `number`            | Number of successful uploads.       |
| `failed`     | `number`            | Number of failed uploads.           |
| `aborted`    | `boolean`           | Whether the batch was aborted.      |

### `ValidationError`

```ts
type ValidationError =
  | { type: "size-too-large"; maxSize: number; actualSize: number }
  | { type: "size-too-small"; minSize: number; actualSize: number }
  | { type: "invalid-type"; allowedTypes: string[]; actualType: string }
  | { type: "custom"; message: string };
```

### `FileValidationOptions`

| Field               | Type                                                 | Description                 |
| ------------------- | ---------------------------------------------------- | --------------------------- |
| `maxSize`           | `number?`                                            | Maximum file size in bytes. |
| `minSize`           | `number?`                                            | Minimum file size in bytes. |
| `allowedTypes`      | `string[]?`                                          | Allowed MIME types.         |
| `allowedExtensions` | `string[]?`                                          | Allowed file extensions.    |
| `customValidator`   | `((file: File \| Blob) => ValidationError \| null)?` | Custom validation function. |
