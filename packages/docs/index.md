# uplnk

**Framework-agnostic file uploads with progress for signed URLs and HTTP endpoints.**

uplnk is a low-level, vendor-agnostic upload primitive. It sends a `File` or `Blob` to a URL (typically a signed upload URL) and reports upload progress via callbacks. Think of it as `fetch()` for uploads, with real progress reporting and explicit control over method, headers, retries, and lifecycle.

## Features

- **Low-level primitive** — Small, focused API; reusable in any environment that supports the same contract.
- **Vendor-agnostic** — Works with any signed URL or HTTP endpoint (GCP, AWS S3, Azure, S3-compatible storage, CDNs, custom backends).
- **Explicit control** — You choose HTTP method, headers, credentials, timeout, and retry behavior.
- **Composable** — Chunking, resumable logic, and UI live in your code; uplnk handles only the single-request transport.
- **Minimal surface** — Easy to audit and trust; no cloud SDKs or UI components.

## Scope

**uplnk is:** a transport-layer upload utility and a signed-request executor with progress reporting.

**uplnk is not:** a cloud SDK, resumable upload manager, UI component, or state manager. Those can be built on top of uplnk.

::: tip Quick start

```bash
pnpm add @uplnk/core
```

```ts
import { uplnk } from "@uplnk/core";

await uplnk({ url: signedUrl, file: fileOrBlob });
```

See [Getting started](/guide/getting-started) and [API reference](/guide/api) for more.
:::
