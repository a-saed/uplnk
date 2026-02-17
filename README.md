# uplnk

[![CI](https://github.com/a-saed/uplnk/actions/workflows/ci.yml/badge.svg)](https://github.com/a-saed/uplnk/actions/workflows/ci.yml)
[![Docs](https://github.com/a-saed/uplnk/actions/workflows/docs.yml/badge.svg)](https://github.com/a-saed/uplnk/actions/workflows/docs.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Framework-agnostic file uploads with progress for signed URLs and HTTP endpoints.

**uplnk** is a low-level, vendor-agnostic upload primitive that sends `File` or `Blob` objects to any URL with real-time progress reporting. Think of it as `fetch()` for uploads, with explicit control over retries, validation, and batch operations.

## Features

- 🎯 **Simple & focused** — Single-purpose upload utility with progress tracking
- 🔄 **Smart retries** — Exponential backoff and customizable retry strategies
- ✅ **File validation** — Pre-upload size and type checking
- 📦 **Batch uploads** — Concurrent multi-file uploads with queue management
- 🎨 **Vendor neutral** — Works with any cloud provider or HTTP endpoint
- 🔒 **Type-safe** — Full TypeScript support
- 🪶 **Lightweight** — Minimal dependencies, browser-only

## Installation

```bash
npm install @uplnk/core
# or
pnpm add @uplnk/core
```

## Quick Example

```ts
import { uplnk } from "@uplnk/core";

await uplnk({
  url: signedUrl,
  file: fileOrBlob,
  onProgress: (p) => console.log(`${p.percent}%`),
});
```

## Core Capabilities

### Retry Strategies

```ts
import { uplnk, exponentialBackoff } from "@uplnk/core";

await uplnk({
  url: signedUrl,
  file,
  retry: exponentialBackoff({ maxAttempts: 3 }),
});
```

### File Validation

```ts
import { validateFile, FILE_SIZE_PRESETS, FILE_TYPE_PRESETS } from "@uplnk/core";

const error = validateFile(file, {
  maxSize: FILE_SIZE_PRESETS["10MB"],
  allowedTypes: FILE_TYPE_PRESETS.images,
});

if (error) {
  console.error("Invalid file:", formatValidationError(error));
}
```

### Batch Uploads

```ts
import { batchUpload } from "@uplnk/core";

const result = await batchUpload(
  files.map((file, i) => ({ url: signedUrls[i], file })),
  {
    concurrency: 5,
    onProgress: (p) => console.log(`${p.completed}/${p.total} uploaded`),
  },
);
```

## Documentation

📚 **[Full Documentation](https://a-saed.github.io/uplnk/)**

- [Getting Started](https://a-saed.github.io/uplnk/guide/getting-started)
- [Advanced Usage](https://a-saed.github.io/uplnk/guide/advanced)
- [API Reference](https://a-saed.github.io/uplnk/guide/api)

## Packages

| Package                        | Description                           |
| ------------------------------ | ------------------------------------- |
| [@uplnk/core](packages/core)   | Main upload implementation            |
| [@uplnk/types](packages/types) | Shared TypeScript types               |
| [uplnk-docs](packages/docs)    | Documentation site (VitePress)        |

## Use Cases

- Upload to signed URLs (S3, GCP, Azure, etc.)
- Direct uploads to custom backends
- Profile pictures and avatars
- Document management systems
- Image galleries and media libraries
- Form file attachments

## Development

```bash
pnpm install          # Install dependencies
pnpm run build        # Build all packages
pnpm run test         # Run tests (67 tests)
pnpm run lint         # Lint code
pnpm run format       # Format code
pnpm run docs:dev     # Run docs locally
```

## Browser Support

Modern browsers with support for:
- `XMLHttpRequest` with upload progress events
- `File` and `Blob` APIs
- ES2020+ features

## Contributing

Contributions welcome! Please read our contributing guidelines and submit a Pull Request.

## License

MIT © Abdulrhman Elsaed

---

**Related Projects:** [tus-js-client](https://github.com/tus/tus-js-client) • [uppy](https://uppy.io/) • [filepond](https://pqina.nl/filepond/)