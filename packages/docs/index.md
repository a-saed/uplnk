# uplnk

**Framework-agnostic file uploads with progress for signed URLs and HTTP endpoints.**

uplnk is a low-level, vendor-agnostic upload primitive. It sends a `File` or `Blob` to a URL (typically a signed upload URL) and reports upload progress via callbacks. Think of it as `fetch()` for uploads, with real progress reporting and explicit control over method, headers, retries, and lifecycle.

## Features

- **Low-level primitive** — Small, focused API; reusable in any environment that supports the same contract.
- **Vendor-agnostic** — Works with any signed URL or HTTP endpoint (GCP, AWS S3, Azure, S3-compatible storage, CDNs, custom backends).
- **Explicit control** — You choose HTTP method, headers, credentials, timeout, and retry behavior.
- **Composable** — Chunking, resumable logic, and UI live in your code; uplnk handles only the single-request transport.
- **Minimal surface** — Easy to audit and trust; no cloud SDKs or UI components.
- **Batch uploads** — Built-in utilities for concurrent and sequential multi-file uploads with progress tracking.
- **Smart retries** — Exponential backoff, fixed delay, and custom retry strategies out of the box.
- **File validation** — Pre-upload size and type validation with helpful error messages.

## Scope

**uplnk is:** a transport-layer upload utility and a signed-request executor with progress reporting.

**uplnk is not:** a cloud SDK, resumable upload manager, UI component, or state manager. Those can be built on top of uplnk.

::: tip Quick start

```bash
pnpm add @uplnk/core
```

```ts
import { uplnk } from "@uplnk/core";

await uplnk({
  url: signedUrl,
  file: fileOrBlob,
  onProgress: (p) => console.log(`${p.percent}%`),
});
```

See [Getting started](/guide/getting-started), [Advanced usage](/guide/advanced), and [API reference](/guide/api) for more.
:::

## Quick Examples

### With retry and validation

```ts
import { uplnk, exponentialBackoff, validateFile, FILE_SIZE_PRESETS } from "@uplnk/core";

// Validate before upload
const error = validateFile(file, {
  maxSize: FILE_SIZE_PRESETS["10MB"],
  allowedTypes: ["image/png", "image/jpeg"],
});

if (error) {
  console.error("Invalid file:", error);
  return;
}

// Upload with automatic retry
await uplnk({
  url: signedUrl,
  file,
  retry: exponentialBackoff({ maxAttempts: 3 }),
  onProgress: (p) => console.log(`${p.percent}%`),
});
```

### Batch uploads

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

:::
