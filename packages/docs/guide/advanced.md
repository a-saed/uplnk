# Advanced Usage

This guide covers advanced features and patterns for using uplnk in production applications.

## Batch Uploads

### Basic Batch Upload

Upload multiple files concurrently with automatic concurrency control:

```ts
import { batchUpload } from "@uplnk/core";

const files = Array.from(fileInput.files);
const uploads = files.map((file, i) => ({
  url: signedUrls[i],
  file,
}));

const result = await batchUpload(uploads, {
  concurrency: 5,
  onProgress: (progress) => {
    console.log(`Overall: ${progress.percent.toFixed(1)}%`);
    console.log(`Completed: ${progress.completed}/${progress.total}`);
    console.log(`Bytes: ${progress.uploadedBytes}/${progress.totalBytes}`);
  },
  onItemComplete: (item) => {
    console.log(`✓ Upload ${item.id} completed`);
  },
  onItemError: (item) => {
    console.error(`✗ Upload ${item.id} failed:`, item.error);
  },
});

console.log(`Done: ${result.successful} succeeded, ${result.failed} failed`);
```

### Dynamic Upload Queue

For dynamic scenarios where files are added during the upload process:

```ts
import { createUploadQueue } from "@uplnk/core";

const queue = createUploadQueue({
  concurrency: 3,
  onProgress: (p) => {
    updateProgressBar(p.percent);
    updateStatus(`${p.completed}/${p.total} files uploaded`);
  },
  onItemComplete: (item) => {
    markFileAsUploaded(item.id);
  },
});

// Add initial files
files.forEach((file) => {
  queue.add({ url: getSignedUrl(file), file });
});

// Start processing
queue.start();

// Add more files while uploads are running
dropzone.on("filesAdded", (newFiles) => {
  newFiles.forEach((file) => {
    queue.add({ url: getSignedUrl(file), file });
  });
});

// Wait for all uploads to complete
const result = await queue.waitForCompletion();
```

### Sequential Uploads

Upload files one at a time when order matters or to minimize resource usage:

```ts
import { sequentialUpload } from "@uplnk/core";

const result = await sequentialUpload(uploads, {
  onProgress: (p) => {
    console.log(`Processing file ${p.completed + 1}/${p.total}`);
  },
  stopOnError: true, // Stop on first failure
});
```

## Retry Strategies

### Exponential Backoff

Recommended for production use with cloud storage providers:

```ts
import { uplnk, exponentialBackoff } from "@uplnk/core";

await uplnk({
  url: signedUrl,
  file,
  retry: exponentialBackoff({
    maxAttempts: 5,
    baseDelayMs: 1000, // Start with 1s
    maxDelayMs: 30000, // Cap at 30s
    jitter: true, // Add randomness to prevent thundering herd
    retryableStatuses: [408, 429, 500, 502, 503, 504],
  }),
  onProgress: (p) => console.log(`${p.percent}%`),
});
```

### Fixed Delay

Simple retry strategy with consistent delays:

```ts
import { uplnk, fixedDelay } from "@uplnk/core";

await uplnk({
  url: signedUrl,
  file,
  retry: fixedDelay({
    delayMs: 2000,
    maxAttempts: 3,
  }),
});
```

### Network Errors Only

Retry only network failures, not HTTP errors:

```ts
import { uplnk, networkErrorsOnly } from "@uplnk/core";

await uplnk({
  url: signedUrl,
  file,
  retry: networkErrorsOnly({ maxAttempts: 5 }),
});
```

### Custom Retry Logic

Full control over retry behavior:

```ts
import { uplnk, customRetry } from "@uplnk/core";

await uplnk({
  url: signedUrl,
  file,
  retry: customRetry({
    attempts: 10,
    shouldRetry: (err, attempt) => {
      // Don't retry client errors
      if (err.type === "http" && err.status >= 400 && err.status < 500) {
        return false;
      }

      // Retry 503 only up to 3 times
      if (err.type === "http" && err.status === 503) {
        return attempt < 3;
      }

      // Always retry network errors
      return err.type === "network" || err.type === "timeout";
    },
    getDelay: (attempt) => {
      // Custom backoff: 1s, 2s, 4s, 8s, etc.
      return Math.min(1000 * Math.pow(2, attempt), 30000);
    },
  }),
});
```

## File Validation

### Pre-Upload Validation

Validate files before starting uploads to provide immediate feedback:

```ts
import { validateFile, formatValidationError, FILE_SIZE_PRESETS } from "@uplnk/core";

const error = validateFile(file, {
  maxSize: FILE_SIZE_PRESETS["10MB"],
  allowedTypes: ["image/png", "image/jpeg", "image/webp"],
  allowedExtensions: [".png", ".jpg", ".jpeg", ".webp"],
});

if (error) {
  alert(formatValidationError(error));
  return;
}

// File is valid, proceed with upload
await uplnk({ url, file });
```

### Using Type Presets

Use built-in presets for common file types:

```ts
import { validateFile, FILE_TYPE_PRESETS, FILE_SIZE_PRESETS } from "@uplnk/core";

// Images only, max 5MB
const imageError = validateFile(file, {
  allowedTypes: FILE_TYPE_PRESETS.images,
  maxSize: FILE_SIZE_PRESETS["5MB"],
});

// Documents only, max 50MB
const docError = validateFile(file, {
  allowedTypes: FILE_TYPE_PRESETS.documents,
  maxSize: FILE_SIZE_PRESETS["50MB"],
});

// Videos only, max 500MB
const videoError = validateFile(file, {
  allowedTypes: FILE_TYPE_PRESETS.videos,
  maxSize: FILE_SIZE_PRESETS["500MB"],
});
```

### Custom Validation

Add custom validation logic:

```ts
import { validateFile } from "@uplnk/core";

const error = validateFile(file, {
  maxSize: 10 * 1024 * 1024,
  allowedTypes: ["image/jpeg", "image/png"],
  customValidator: (file) => {
    // Check filename
    if (file.name.length > 255) {
      return { type: "custom", message: "Filename too long (max 255 characters)" };
    }

    // Check for specific patterns
    if (/[<>:"|?*]/.test(file.name)) {
      return { type: "custom", message: "Filename contains invalid characters" };
    }

    // File is valid
    return null;
  },
});
```

### Batch Validation

Validate multiple files before batch upload:

```ts
import { validateFile, formatValidationError } from "@uplnk/core";

const validFiles = [];
const invalidFiles = [];

files.forEach((file) => {
  const error = validateFile(file, {
    maxSize: 10 * 1024 * 1024,
    allowedTypes: ["image/png", "image/jpeg"],
  });

  if (error) {
    invalidFiles.push({
      file,
      error: formatValidationError(error),
    });
  } else {
    validFiles.push(file);
  }
});

if (invalidFiles.length > 0) {
  console.error("Invalid files:", invalidFiles);
}

if (validFiles.length > 0) {
  // Upload valid files
  await batchUpload(validFiles.map((file) => ({ url: getSignedUrl(file), file })));
}
```

## Error Handling

### Comprehensive Error Handling

Handle all error types appropriately:

```ts
import { uplnk } from "@uplnk/core";

try {
  await uplnk({
    url: signedUrl,
    file,
    onProgress: (p) => updateProgress(p),
  });

  showSuccess("Upload completed!");
} catch (err) {
  switch (err.type) {
    case "abort":
      showWarning("Upload was cancelled");
      break;

    case "timeout":
      showError("Upload timed out. Please try again.");
      break;

    case "network":
      showError("Network error. Check your connection and try again.");
      break;

    case "http":
      if (err.status === 403) {
        showError("Upload URL expired. Please refresh and try again.");
      } else if (err.status === 413) {
        showError("File too large for server.");
      } else if (err.status >= 500) {
        showError("Server error. Please try again later.");
      } else {
        showError(`Upload failed with status ${err.status}`);
      }
      break;
  }
}
```

### Batch Error Handling

Handle errors in batch uploads:

```ts
import { batchUpload } from "@uplnk/core";

const result = await batchUpload(uploads, {
  concurrency: 5,
  stopOnError: false, // Continue even if some fail
  onItemError: (item) => {
    logError(`Upload ${item.id} failed`, item.error);

    // Optionally retry individual failures
    if (item.error.type === "network") {
      retryQueue.push(item);
    }
  },
});

// Handle overall results
if (result.failed > 0) {
  showWarning(`${result.failed} of ${result.items.length} uploads failed`);

  // Get failed items for potential retry
  const failedItems = result.items.filter((i) => i.status === "failed");
  offerRetry(failedItems);
}
```

## Progress Tracking

### Smooth Progress Updates

Control progress callback frequency:

```ts
await uplnk({
  url,
  file,
  progress: {
    throttleMs: 50, // Update every 50ms (default: 100ms)
    emitOnStart: true, // Emit 0% at start
    emitOnEnd: true, // Emit 100% at end
  },
  onProgress: (p) => {
    // Update UI
    progressBar.style.width = `${p.percent ?? 0}%`;

    // Show speed and ETA
    if (p.speed) {
      speedLabel.textContent = formatBytes(p.speed) + "/s";
    }
    if (p.eta) {
      etaLabel.textContent = formatTime(p.eta);
    }
  },
});

function formatTime(seconds) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${minutes}m ${secs}s`;
}
```

### Aggregate Progress for Multiple Uploads

Track overall progress across multiple uploads:

```ts
let totalBytes = 0;
let uploadedBytes = 0;

files.forEach((file) => {
  totalBytes += file.size;
});

const uploads = files.map((file, i) => ({
  url: signedUrls[i],
  file,
  onProgress: (p) => {
    // Track individual progress
    uploadProgress[i] = p.loaded;

    // Calculate total
    uploadedBytes = Object.values(uploadProgress).reduce((sum, bytes) => sum + bytes, 0);
    const overallPercent = (uploadedBytes / totalBytes) * 100;

    updateMainProgress(overallPercent);
  },
}));

await Promise.all(uploads.map((opts) => uplnk(opts)));
```

## Abort and Cancellation

### Cancel Single Upload

```ts
const controller = new AbortController();

const uploadPromise = uplnk({
  url,
  file,
  signal: controller.signal,
});

// Cancel after 5 seconds
setTimeout(() => controller.abort(), 5000);

try {
  await uploadPromise;
} catch (err) {
  if (err.type === "abort") {
    console.log("Upload was cancelled");
  }
}
```

### Cancel Batch Upload

```ts
const controller = new AbortController();

const resultPromise = batchUpload(uploads, {
  signal: controller.signal,
  concurrency: 3,
});

// Cancel button
cancelButton.onclick = () => controller.abort();

const result = await resultPromise;
console.log(`Aborted: ${result.aborted}`);
```

### Cancel with Cleanup

```ts
const controller = new AbortController();
let xhr = null;

try {
  await uplnk({
    url,
    file,
    signal: controller.signal,
    onStart: (xhrInstance) => {
      xhr = xhrInstance;
    },
  });
} catch (err) {
  if (err.type === "abort" && xhr) {
    // Perform cleanup if needed
    cleanup();
  }
}
```

## Lifecycle Hooks

### Full Lifecycle Control

Use lifecycle hooks for logging, analytics, and custom behavior:

```ts
await uplnk({
  url,
  file,

  onStart: (xhr) => {
    console.log("Upload starting");
    logAnalytics("upload_start", { fileSize: file.size });

    // Optionally modify XHR before send
    // (though headers should be set via options.headers)
  },

  onProgress: (p) => {
    updateUI(p);

    // Log milestones
    if (p.percent === 25 || p.percent === 50 || p.percent === 75) {
      logAnalytics("upload_progress", { percent: p.percent });
    }
  },

  onResponse: (xhr) => {
    console.log("Upload successful", xhr.status);
    logAnalytics("upload_complete", {
      status: xhr.status,
      duration: Date.now() - startTime,
    });

    // Access response if needed
    const responseData = xhr.responseText;
  },

  onError: (err, xhr) => {
    console.error("Upload failed", err);
    logAnalytics("upload_error", {
      errorType: err.type,
      status: err.type === "http" ? err.status : undefined,
    });
  },
});
```

## Integration Examples

### React Hook

```tsx
import { useState, useCallback } from "react";
import { uplnk } from "@uplnk/core";

function useUpload() {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const upload = useCallback(async (url: string, file: File) => {
    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      await uplnk({
        url,
        file,
        onProgress: (p) => setProgress(p.percent ?? 0),
      });
      setProgress(100);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  return { upload, progress, uploading, error };
}

// Usage
function UploadComponent() {
  const { upload, progress, uploading } = useUpload();

  const handleUpload = async (file: File) => {
    const url = await getSignedUrl(file);
    await upload(url, file);
  };

  return (
    <div>
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
      {uploading && <progress value={progress} max={100} />}
    </div>
  );
}
```

### Vue Composable

```ts
import { ref, Ref } from "vue";
import { uplnk } from "@uplnk/core";

export function useUpload() {
  const progress: Ref<number> = ref(0);
  const uploading: Ref<boolean> = ref(false);
  const error: Ref<Error | null> = ref(null);

  const upload = async (url: string, file: File) => {
    uploading.value = true;
    error.value = null;
    progress.value = 0;

    try {
      await uplnk({
        url,
        file,
        onProgress: (p) => {
          progress.value = p.percent ?? 0;
        },
      });
    } catch (err) {
      error.value = err;
      throw err;
    } finally {
      uploading.value = false;
    }
  };

  return { upload, progress, uploading, error };
}
```

### With Form Data

If you need to send additional metadata alongside the file:

```ts
// Server should provide a signed URL for multipart/form-data
const formData = new FormData();
formData.append("file", file);
formData.append("metadata", JSON.stringify({ userId: 123 }));

await uplnk({
  url: signedUrl,
  file: formData,
  method: "POST",
  // Note: FormData automatically sets correct Content-Type with boundary
});
```

## Performance Tips

### Optimize Concurrency

Adjust concurrency based on connection speed:

```ts
// Detect connection speed (if available)
const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
const concurrency = connection?.effectiveType === "4g" ? 6 : 3;

await batchUpload(uploads, { concurrency });
```

### Chunk Large Files

For very large files, split into chunks:

```ts
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

async function uploadLargeFile(file: File, getChunkUrl: (index: number) => Promise<string>) {
  const chunks = Math.ceil(file.size / CHUNK_SIZE);

  for (let i = 0; i < chunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

    const url = await getChunkUrl(i);
    await uplnk({
      url,
      file: chunk,
      onProgress: (p) => {
        const overallProgress = ((i + (p.percent ?? 0) / 100) / chunks) * 100;
        updateProgress(overallProgress);
      },
    });
  }
}
```

### Memory Management

For many files, process in batches:

```ts
const BATCH_SIZE = 10;

for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
  const batch = allFiles.slice(i, i + BATCH_SIZE);
  await batchUpload(
    batch.map((file) => ({ url: getSignedUrl(file), file })),
    { concurrency: 5 },
  );
}
```
