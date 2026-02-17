# Getting started

## Installation

```bash
pnpm add @uplnk/core
```

or

```bash
npm install @uplnk/core
```

Install `@uplnk/types` only if you need the shared TypeScript types (e.g. for wrappers or type-only usage).

## Quick start

```ts
import { uplnk } from "@uplnk/core";

await uplnk({
  url: signedUrl,
  file: fileOrBlob,
});
```

With progress:

```ts
await uplnk({
  url: signedUrl,
  file: fileOrBlob,
  onProgress: (p) =>
    console.log(`${p.percent ?? 0}% uploaded, ETA ${p.eta ?? 0}s`),
});
```

## Abort

```ts
const controller = new AbortController();
uplnk({ url, file, signal: controller.signal });
controller.abort();
```

## Compatibility

Works with any signed upload URL or HTTP endpoint:

- GCP, AWS S3, Azure Blob Storage
- S3-compatible object storage
- CDNs and custom backends

uplnk treats the URL as an opaque contract: if the URL is valid, it sends the body and reports progress.

## Environment support

| Environment              | Status   |
| ------------------------ | -------- |
| Browser (XMLHttpRequest) | Supported |
| Node.js                  | Planned (adapter) |
| React Native             | Not supported (custom transport required) |

## Chunked and resumable uploads

uplnk performs a single atomic request. For chunked or resumable uploads, orchestrate multiple calls yourself:

```ts
const chunks = sliceFile(file);
for (const chunk of chunks) {
  await uplnk({ url: chunkUrl, file: chunk });
}
```
