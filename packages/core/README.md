# @uplnk/core

Framework-agnostic file uploads with progress for signed URLs and HTTP endpoints.

## Features

- **Simple API** — Single function for uploads with progress tracking
- **Retry strategies** — Exponential backoff, fixed delay, and custom retry logic
- **File validation** — Pre-upload size and type checking with helpful error messages
- **Batch uploads** — Upload multiple files concurrently with progress tracking
- **Framework agnostic** — Works in any browser environment
- **TypeScript** — Full type safety with detailed type definitions
- **Lightweight** — Minimal dependencies, focused scope

## Install

```bash
pnpm add @uplnk/core
```

or

```bash
npm install @uplnk/core
```

Optional: install `@uplnk/types` if you only need the TypeScript types.

## Quick Start

### Basic upload

```ts
import { uplnk } from "@uplnk/core";

await uplnk({
  url: signedUrl,
  file: fileOrBlob,
  onProgress: (p) => console.log(`${p.percent ?? 0}%`),
});
```

### With validation

```ts
import { uplnk, validateFile, FILE_SIZE_PRESETS } from "@uplnk/core";

// Validate before upload
const error = validateFile(file, {
  maxSize: FILE_SIZE_PRESETS["10MB"],
  allowedTypes: ["image/png", "image/jpeg"],
});

if (error) {
  console.error("Invalid file:", formatValidationError(error));
  return;
}

// Upload with progress
await uplnk({
  url: signedUrl,
  file,
  onProgress: (p) => console.log(`${p.percent}%`),
});
```

### With retry

```ts
import { uplnk, exponentialBackoff } from "@uplnk/core";

await uplnk({
  url: signedUrl,
  file,
  retry: exponentialBackoff({ maxAttempts: 3 }),
  onProgress: (p) => updateProgressBar(p.percent),
});
```

### Batch upload

```ts
import { batchUpload } from "@uplnk/core";

const uploads = files.map((file, i) => ({
  url: signedUrls[i],
  file,
}));

const result = await batchUpload(uploads, {
  concurrency: 5,
  onProgress: (p) => console.log(`${p.completed}/${p.total} uploaded`),
  onItemError: (item) => console.error(`Failed: ${item.id}`),
});

console.log(`${result.successful} succeeded, ${result.failed} failed`);
```

## API Overview

### Core Functions

- `uplnk(options)` — Upload a single file with progress
- `batchUpload(uploads, options)` — Upload multiple files concurrently
- `sequentialUpload(uploads, options)` — Upload files one at a time
- `createUploadQueue(options)` — Create a dynamic upload queue

### Retry Strategies

- `exponentialBackoff(options)` — Retry with exponential backoff and jitter
- `fixedDelay(options)` — Retry with fixed delay between attempts
- `networkErrorsOnly(options)` — Only retry network failures
- `customRetry(options)` — Create custom retry logic

### Validation

- `validateFile(file, options)` — Validate file size, type, and custom rules
- `validateSize(file, options)` — Validate file size only
- `validateType(file, options)` — Validate file type only
- `formatValidationError(error)` — Convert error to human-readable message
- `formatBytes(bytes)` — Format bytes as human-readable size

### Presets

- `FILE_TYPE_PRESETS` — Common file type groups (images, videos, audio, documents, archives)
- `FILE_SIZE_PRESETS` — Common size limits (1MB, 5MB, 10MB, 50MB, 100MB, 500MB, 1GB)

## Examples

### Error handling

```ts
try {
  await uplnk({ url, file });
} catch (err) {
  switch (err.type) {
    case "abort":
      console.log("Upload cancelled");
      break;
    case "timeout":
      console.log("Upload timed out");
      break;
    case "network":
      console.log("Network error");
      break;
    case "http":
      console.log(`HTTP error: ${err.status}`);
      break;
  }
}
```

### Abort upload

```ts
const controller = new AbortController();

uplnk({ url, file, signal: controller.signal });

// Cancel after 5 seconds
setTimeout(() => controller.abort(), 5000);
```

### Custom retry strategy

```ts
await uplnk({
  url,
  file,
  retry: customRetry({
    attempts: 5,
    shouldRetry: (err, attempt) => {
      // Don't retry client errors
      if (err.type === "http" && err.status >= 400 && err.status < 500) {
        return false;
      }
      return err.type === "network" || err.type === "timeout";
    },
    getDelay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 30000),
  }),
});
```

### Dynamic upload queue

```ts
const queue = createUploadQueue({
  concurrency: 3,
  onProgress: (p) => console.log(`${p.percent}%`),
});

// Add files
queue.add({ url: url1, file: file1 });
queue.add({ url: url2, file: file2 });

// Start processing
queue.start();

// Add more files while running
queue.add({ url: url3, file: file3 });

// Wait for completion
await queue.waitForCompletion();
```

## Documentation

Full documentation is available at the [documentation site](https://a-saed.github.io/uplnk/) or in the [repository](https://github.com/a-saed/uplnk).

## License

MIT