# uplnk

Framework-agnostic file uploads with progress for signed URLs and HTTP endpoints.

uplnk is a low-level, vendor-agnostic upload primitive. It sends a `File` or `Blob` to a URL (e.g. a signed upload URL) and reports progress. Think of it as `fetch()` for uploads, with real progress and explicit control over method, headers, retries, and lifecycle.

## Packages

| Package | Description |
|---------|-------------|
| [@uplnk/core](packages/core) | Upload implementation — `uplnk(options)` |
| [@uplnk/types](packages/types) | Shared TypeScript types |

## Install

```bash
pnpm add @uplnk/core
```

## Quick start

```ts
import { uplnk } from "@uplnk/core";

await uplnk({
  url: signedUrl,
  file: fileOrBlob,
  onProgress: (p) => console.log(`${p.percent ?? 0}%`),
});
```

## Docs

- [Full documentation](doc.md) (markdown)
- [Documentation site](https://a-saed.github.io/uplnk/) (GitHub Pages, after deployment)

## Monorepo

```bash
pnpm install
pnpm run build    # build all packages
pnpm run test     # run tests
pnpm run docs:dev # run docs locally
```

## License

MIT
