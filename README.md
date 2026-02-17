# uplnk

[![CI](https://github.com/a-saed/uplnk/actions/workflows/ci.yml/badge.svg)](https://github.com/a-saed/uplnk/actions/workflows/ci.yml)
[![Docs](https://github.com/a-saed/uplnk/actions/workflows/docs.yml/badge.svg)](https://github.com/a-saed/uplnk/actions/workflows/docs.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Framework-agnostic file uploads with progress for signed URLs and HTTP endpoints.

uplnk is a low-level, vendor-agnostic upload primitive. It sends a `File` or `Blob` to a URL (e.g. a signed upload URL) and reports progress. Think of it as `fetch()` for uploads, with real progress and explicit control over method, headers, retries, and lifecycle.

## Features

- 🚀 **Simple API** — Single function for uploads with progress tracking
- 🔄 **Smart retries** — Exponential backoff, fixed delay, and custom retry strategies
- ✅ **File validation** — Pre-upload size and type checking with helpful error messages
- 📦 **Batch uploads** — Upload multiple files concurrently with progress tracking
- 🎯 **Framework agnostic** — Works in any browser environment (React, Vue, vanilla JS, etc.)
- 🔒 **TypeScript** — Full type safety with detailed type definitions
- 🪶 **Lightweight** — Minimal dependencies, focused scope
- 🎨 **Vendor neutral** — Works with any cloud provider (AWS S3, GCP, Azure, etc.)

## Packages

| Package | Description |
|---------|-------------|
| [@uplnk/core](packages/core) | Core upload implementation with retry, validation, and batch utilities |
| [@uplnk/types](packages/types) | Shared TypeScript types |

## Install

```bash
pnpm add @uplnk/core
```

or

```bash
npm install @uplnk/core
```

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

### With validation and retry

```ts
import { uplnk, validateFile, exponentialBackoff, FILE_SIZE_PRESETS } from "@uplnk/core";

// Validate before upload
const error = validateFile(file, {
  maxSize: FILE_SIZE_PRESETS["10MB"],
  allowedTypes: ["image/png", "image/jpeg"],
});

if (error) {
  console.error("Invalid file:", formatValidationError(error));
  return;
}

// Upload with automatic retry
await uplnk({
  url: signedUrl,
  file,
  retry: exponentialBackoff({ maxAttempts: 3 }),
  onProgress: (p) => {
    console.log(`${p.percent}% - ${formatBytes(p.loaded)}/${formatBytes(p.total)}`);
    if (p.eta) console.log(`ETA: ${p.eta}s`);
  },
});
```

### Batch uploads

```ts
import { batchUpload } from "@uplnk/core";

const uploads = files.map((file, i) => ({
  url: signedUrls[i],
  file,
}));

const result = await batchUpload(uploads, {
  concurrency: 5,
  onProgress: (p) => {
    console.log(`Overall: ${p.percent.toFixed(1)}%`);
    console.log(`Files: ${p.completed}/${p.total}`);
  },
  onItemError: (item) => {
    console.error(`Failed to upload ${item.id}:`, item.error);
  },
});

console.log(`✓ ${result.successful} succeeded, ✗ ${result.failed} failed`);
```

## Documentation

- 📖 [Getting Started](https://a-saed.github.io/uplnk/guide/getting-started)
- 🚀 [Advanced Usage](https://a-saed.github.io/uplnk/guide/advanced)
- 📚 [API Reference](https://a-saed.github.io/uplnk/guide/api)
- 🌐 [Full Documentation Site](https://a-saed.github.io/uplnk/)

## Key Features in Detail

### Retry Strategies

Built-in retry strategies for resilient uploads:

```ts
import { exponentialBackoff, fixedDelay, networkErrorsOnly, customRetry } from "@uplnk/core";

// Exponential backoff with jitter
await uplnk({
  url,
  file,
  retry: exponentialBackoff({ maxAttempts: 5 }),
});

// Fixed delay
await uplnk({
  url,
  file,
  retry: fixedDelay({ delayMs: 2000, maxAttempts: 3 }),
});

// Custom logic
await uplnk({
  url,
  file,
  retry: customRetry({
    attempts: 5,
    shouldRetry: (err, attempt) => err.type === "network" && attempt < 3,
    getDelay: (attempt) => 1000 * Math.pow(2, attempt),
  }),
});
```

### File Validation

Validate files before upload with helpful error messages:

```ts
import { validateFile, FILE_TYPE_PRESETS, FILE_SIZE_PRESETS, formatValidationError } from "@uplnk/core";

const error = validateFile(file, {
  maxSize: FILE_SIZE_PRESETS["10MB"],
  allowedTypes: FILE_TYPE_PRESETS.images,
  customValidator: (file) => {
    if (file.name.length > 255) {
      return { type: "custom", message: "Filename too long" };
    }
    return null;
  },
});

if (error) {
  alert(formatValidationError(error));
}
```

### Batch & Queue Management

Upload multiple files with concurrency control:

```ts
import { batchUpload, sequentialUpload, createUploadQueue } from "@uplnk/core";

// Concurrent batch upload
await batchUpload(uploads, { concurrency: 5 });

// Sequential (one at a time)
await sequentialUpload(uploads);

// Dynamic queue
const queue = createUploadQueue({ concurrency: 3 });
queue.add({ url: url1, file: file1 });
queue.add({ url: url2, file: file2 });
await queue.waitForCompletion();
```

## Use Cases

- ✅ Upload to signed URLs (AWS S3, Google Cloud Storage, Azure Blob Storage)
- ✅ Direct upload to custom backend endpoints
- ✅ Multi-file uploads with progress tracking
- ✅ Profile picture/avatar uploads
- ✅ Document management systems
- ✅ Image galleries and media libraries
- ✅ Form file attachments
- ✅ Large file uploads with retry logic

## Browser Support

Works in all modern browsers that support:
- `XMLHttpRequest` with upload progress events
- `File` and `Blob` APIs
- `Promise` and `async`/`await`

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Run tests
pnpm run test

# Run docs locally
pnpm run docs:dev

# Build docs
pnpm run docs:build
```

## Monorepo Structure

```
uplnk/
├── packages/
│   ├── core/          # Main package with upload logic
│   ├── types/         # Shared TypeScript types
│   └── docs/          # VitePress documentation
├── .github/
│   └── workflows/     # CI and docs deployment
└── pnpm-workspace.yaml
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © [Abdulrhman Elsaed]

## Related Projects

- [tus-js-client](https://github.com/tus/tus-js-client) — Resumable uploads via the tus protocol
- [uppy](https://uppy.io/) — Full-featured upload UI
- [filepond](https://pqina.nl/filepond/) — JavaScript file upload library

uplnk is intentionally minimal and focused on the transport layer, making it ideal as a building block for larger systems.
