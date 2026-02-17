/**
 * @uplnk/core/validators — File validation utilities for pre-upload checks.
 */

/** File validation error types. */
export type ValidationError =
  | { type: "size-too-large"; maxSize: number; actualSize: number }
  | { type: "size-too-small"; minSize: number; actualSize: number }
  | {
      type: "invalid-type";
      allowedTypes: readonly string[] | string[];
      actualType: string;
    }
  | { type: "custom"; message: string };

/** Options for file size validation. */
export interface SizeValidationOptions {
  /** Maximum file size in bytes. */
  maxSize?: number;
  /** Minimum file size in bytes. */
  minSize?: number;
}

/** Options for file type validation. */
export interface TypeValidationOptions {
  /** Allowed MIME types (e.g., ["image/png", "image/jpeg"]). */
  allowedTypes?: readonly string[] | string[];
  /** Allowed file extensions (e.g., [".png", ".jpg"]). */
  allowedExtensions?: readonly string[] | string[];
}

/** Combined validation options. */
export interface FileValidationOptions extends SizeValidationOptions, TypeValidationOptions {
  /** Custom validation function. */
  customValidator?: (file: File | Blob) => ValidationError | null;
}

/**
 * Validate file size.
 *
 * @param file - File or Blob to validate
 * @param options - Size validation options
 * @returns ValidationError if invalid, null if valid
 *
 * @example
 * ```ts
 * const error = validateSize(file, { maxSize: 5 * 1024 * 1024 }); // 5MB max
 * if (error) {
 *   console.error("File too large:", error);
 * }
 * ```
 */
export function validateSize(
  file: File | Blob,
  options: SizeValidationOptions,
): ValidationError | null {
  const { maxSize, minSize } = options;

  if (maxSize != null && file.size > maxSize) {
    return {
      type: "size-too-large",
      maxSize,
      actualSize: file.size,
    };
  }

  if (minSize != null && file.size < minSize) {
    return {
      type: "size-too-small",
      minSize,
      actualSize: file.size,
    };
  }

  return null;
}

/**
 * Validate file type.
 *
 * @param file - File or Blob to validate
 * @param options - Type validation options
 * @returns ValidationError if invalid, null if valid
 *
 * @example
 * ```ts
 * const error = validateType(file, {
 *   allowedTypes: ["image/png", "image/jpeg"],
 *   allowedExtensions: [".png", ".jpg", ".jpeg"]
 * });
 * if (error) {
 *   console.error("Invalid file type:", error);
 * }
 * ```
 */
export function validateType(
  file: File | Blob,
  options: TypeValidationOptions,
): ValidationError | null {
  const { allowedTypes, allowedExtensions } = options;

  // Check MIME type
  if (allowedTypes && allowedTypes.length > 0) {
    if (!allowedTypes.includes(file.type)) {
      return {
        type: "invalid-type",
        allowedTypes,
        actualType: file.type,
      };
    }
  }

  // Check file extension (only for File objects)
  if (allowedExtensions && allowedExtensions.length > 0 && file instanceof File) {
    const extension = getFileExtension(file.name);
    const normalizedAllowed = allowedExtensions.map((ext) =>
      ext.toLowerCase().startsWith(".") ? ext.toLowerCase() : `.${ext.toLowerCase()}`,
    );
    const normalizedActual = extension.toLowerCase();

    if (!normalizedAllowed.includes(normalizedActual)) {
      return {
        type: "invalid-type",
        allowedTypes: allowedExtensions,
        actualType: extension,
      };
    }
  }

  return null;
}

/**
 * Validate file with combined options.
 *
 * @param file - File or Blob to validate
 * @param options - Combined validation options
 * @returns ValidationError if invalid, null if valid
 *
 * @example
 * ```ts
 * const error = validateFile(file, {
 *   maxSize: 10 * 1024 * 1024, // 10MB
 *   allowedTypes: ["image/png", "image/jpeg"],
 *   customValidator: (file) => {
 *     if (file.name.includes("test")) {
 *       return { type: "custom", message: "Test files not allowed" };
 *     }
 *     return null;
 *   }
 * });
 *
 * if (error) {
 *   throw new Error(formatValidationError(error));
 * }
 * ```
 */
export function validateFile(
  file: File | Blob,
  options: FileValidationOptions,
): ValidationError | null {
  // Check size
  const sizeError = validateSize(file, options);
  if (sizeError) return sizeError;

  // Check type
  const typeError = validateType(file, options);
  if (typeError) return typeError;

  // Custom validation
  if (options.customValidator) {
    const customError = options.customValidator(file);
    if (customError) return customError;
  }

  return null;
}

/**
 * Format validation error into a human-readable message.
 *
 * @param error - Validation error
 * @returns Human-readable error message
 *
 * @example
 * ```ts
 * const error = validateFile(file, { maxSize: 5000000 });
 * if (error) {
 *   alert(formatValidationError(error));
 * }
 * ```
 */
export function formatValidationError(error: ValidationError): string {
  switch (error.type) {
    case "size-too-large":
      return `File size (${formatBytes(error.actualSize)}) exceeds maximum allowed size (${formatBytes(error.maxSize)})`;
    case "size-too-small":
      return `File size (${formatBytes(error.actualSize)}) is below minimum required size (${formatBytes(error.minSize)})`;
    case "invalid-type":
      return `File type "${error.actualType}" is not allowed. Allowed types: ${error.allowedTypes.join(", ")}`;
    case "custom":
      return error.message;
  }
}

/**
 * Format bytes into human-readable size.
 *
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "1.5 MB")
 *
 * @example
 * ```ts
 * formatBytes(1536); // "1.5 KB"
 * formatBytes(1048576); // "1 MB"
 * ```
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Get file extension from filename.
 *
 * @param filename - Name of the file
 * @returns File extension including the dot (e.g., ".png")
 *
 * @internal
 */
function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf(".");
  if (lastDotIndex === -1 || lastDotIndex === 0) return "";
  return filename.slice(lastDotIndex);
}

/**
 * Common file type presets for validation.
 */
export const FILE_TYPE_PRESETS = {
  /** Common image types */
  images: ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp", "image/svg+xml"],

  /** Common video types */
  videos: ["video/mp4", "video/webm", "video/ogg", "video/quicktime"],

  /** Common audio types */
  audio: ["audio/mpeg", "audio/ogg", "audio/wav", "audio/webm", "audio/aac"],

  /** Common document types */
  documents: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
  ],

  /** Common archive types */
  archives: ["application/zip", "application/x-rar-compressed", "application/x-7z-compressed"],
} as const;

/**
 * Common file size presets (in bytes).
 */
export const FILE_SIZE_PRESETS = {
  /** 1 MB */
  "1MB": 1024 * 1024,
  /** 5 MB */
  "5MB": 5 * 1024 * 1024,
  /** 10 MB */
  "10MB": 10 * 1024 * 1024,
  /** 50 MB */
  "50MB": 50 * 1024 * 1024,
  /** 100 MB */
  "100MB": 100 * 1024 * 1024,
  /** 500 MB */
  "500MB": 500 * 1024 * 1024,
  /** 1 GB */
  "1GB": 1024 * 1024 * 1024,
} as const;
