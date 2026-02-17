# API reference

## `uplnk(options): Promise<void>`

Executes a single HTTP upload. Resolves when the request completes successfully (2xx); rejects with an `UploadError` on failure.

### Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `url` | `string` | Yes | — | Destination URL (e.g. signed URL). |
| `file` | `File \| Blob` | Yes | — | The payload to upload. |
| `method` | `'PUT' \| 'POST' \| 'PATCH'` | No | `'PUT'` | HTTP method. |
| `headers` | `Record<string, string>` | No | `{}` | Request headers. |
| `withCredentials` | `boolean` | No | `false` | Send cookies / credentials. |
| `signal` | `AbortSignal` | No | — | Abort the in-flight upload. |
| `timeoutMs` | `number` | No | — | Abort after this many milliseconds. |
| `progress` | `ProgressOptions` | No | — | Throttle and lifecycle of progress events. |
| `onProgress` | `(progress: UploadProgress) => void` | No | — | Progress callback. |
| `onStart` | `(xhr: XMLHttpRequest) => void` | No | — | Called before `send()`. |
| `onResponse` | `(xhr: XMLHttpRequest) => void` | No | — | Called on completion (before the promise resolves). |
| `onError` | `(err: UploadError, xhr?: XMLHttpRequest) => void` | No | — | Called before the promise rejects. |
| `retry` | `RetryOptions` | No | — | Retry configuration (opt-in). |

---

## Types

### `UploadProgress`

| Field | Type | Description |
|-------|------|-------------|
| `loaded` | `number` | Bytes uploaded so far. |
| `total` | `number \| undefined` | Total bytes when computable. |
| `percent` | `number \| undefined` | 0–100. |
| `speed` | `number \| undefined` | Bytes per second. |
| `eta` | `number \| undefined` | Estimated seconds remaining. |

### `ProgressOptions`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `throttleMs` | `number` | `100` | Minimum ms between progress callbacks. |
| `emitOnStart` | `boolean` | `true` | Emit initial 0% progress. |
| `emitOnEnd` | `boolean` | `true` | Emit final 100% progress. |

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

| Field | Type | Description |
|-------|------|-------------|
| `attempts` | `number` | Max attempts (including the first). |
| `delayMs` | `number` | Delay before the next attempt. |
| `shouldRetry` | `(err: UploadError, attempt: number) => boolean` | Return `true` to retry. |

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
