# @uplnk/core

Framework-agnostic file uploads with progress. Browser only (XMLHttpRequest).

## Install

```bash
pnpm add @uplnk/core
# or
npm install @uplnk/core
```

Optional: install `@uplnk/types` if you only need the TypeScript types.

## Usage

```ts
import { uplnk } from "@uplnk/core";

await uplnk({
  url: signedUrl,
  file: fileOrBlob,
  onProgress: (p) => console.log(`${p.percent ?? 0}%`),
});
```

See full docs in the repository or at the documentation site.
