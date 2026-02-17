import { describe, it, expect } from "vitest";
import {
  validateFile,
  validateSize,
  validateType,
  formatValidationError,
  formatBytes,
  FILE_TYPE_PRESETS,
  FILE_SIZE_PRESETS,
} from "./validators";
import type { ValidationError } from "./validators";

describe("validators", () => {
  describe("validateSize", () => {
    it("returns null for valid file size", () => {
      const file = new Blob(["x".repeat(1000)]);
      const error = validateSize(file, { maxSize: 2000 });
      expect(error).toBeNull();
    });

    it("returns error when file exceeds maxSize", () => {
      const file = new Blob(["x".repeat(2000)]);
      const error = validateSize(file, { maxSize: 1000 });
      expect(error).toEqual({
        type: "size-too-large",
        maxSize: 1000,
        actualSize: 2000,
      });
    });

    it("returns error when file is below minSize", () => {
      const file = new Blob(["x".repeat(500)]);
      const error = validateSize(file, { minSize: 1000 });
      expect(error).toEqual({
        type: "size-too-small",
        minSize: 1000,
        actualSize: 500,
      });
    });

    it("validates both min and max", () => {
      const file = new Blob(["x".repeat(1500)]);
      const error = validateSize(file, { minSize: 1000, maxSize: 2000 });
      expect(error).toBeNull();
    });

    it("returns null when no constraints provided", () => {
      const file = new Blob(["test"]);
      const error = validateSize(file, {});
      expect(error).toBeNull();
    });
  });

  describe("validateType", () => {
    it("returns null for valid MIME type", () => {
      const file = new File(["test"], "test.png", { type: "image/png" });
      const error = validateType(file, {
        allowedTypes: ["image/png", "image/jpeg"],
      });
      expect(error).toBeNull();
    });

    it("returns error for invalid MIME type", () => {
      const file = new File(["test"], "test.txt", { type: "text/plain" });
      const error = validateType(file, {
        allowedTypes: ["image/png", "image/jpeg"],
      });
      expect(error).toEqual({
        type: "invalid-type",
        allowedTypes: ["image/png", "image/jpeg"],
        actualType: "text/plain",
      });
    });

    it("validates file extension", () => {
      const file = new File(["test"], "test.png", { type: "image/png" });
      const error = validateType(file, {
        allowedExtensions: [".png", ".jpg"],
      });
      expect(error).toBeNull();
    });

    it("returns error for invalid extension", () => {
      const file = new File(["test"], "test.txt", { type: "text/plain" });
      const error = validateType(file, {
        allowedExtensions: [".png", ".jpg"],
      });
      expect(error).toEqual({
        type: "invalid-type",
        allowedTypes: [".png", ".jpg"],
        actualType: ".txt",
      });
    });

    it("normalizes extension comparison (case-insensitive)", () => {
      const file = new File(["test"], "test.PNG", { type: "image/png" });
      const error = validateType(file, {
        allowedExtensions: [".png"],
      });
      expect(error).toBeNull();
    });

    it("handles extensions without leading dot", () => {
      const file = new File(["test"], "test.png", { type: "image/png" });
      const error = validateType(file, {
        allowedExtensions: ["png", "jpg"],
      });
      expect(error).toBeNull();
    });

    it("validates both MIME type and extension", () => {
      const file = new File(["test"], "test.png", { type: "image/png" });
      const error = validateType(file, {
        allowedTypes: ["image/png"],
        allowedExtensions: [".png"],
      });
      expect(error).toBeNull();
    });

    it("returns null when no constraints provided", () => {
      const file = new File(["test"], "test.txt", { type: "text/plain" });
      const error = validateType(file, {});
      expect(error).toBeNull();
    });

    it("works with Blob (no extension check)", () => {
      const blob = new Blob(["test"], { type: "image/png" });
      const error = validateType(blob, {
        allowedTypes: ["image/png"],
      });
      expect(error).toBeNull();
    });

    it("handles files without extension", () => {
      const file = new File(["test"], "noextension", { type: "text/plain" });
      const error = validateType(file, {
        allowedExtensions: [".txt"],
      });
      expect(error).toEqual({
        type: "invalid-type",
        allowedTypes: [".txt"],
        actualType: "",
      });
    });
  });

  describe("validateFile", () => {
    it("validates both size and type", () => {
      const file = new File(["x".repeat(1000)], "test.png", {
        type: "image/png",
      });
      const error = validateFile(file, {
        maxSize: 2000,
        allowedTypes: ["image/png", "image/jpeg"],
      });
      expect(error).toBeNull();
    });

    it("returns size error if size validation fails", () => {
      const file = new File(["x".repeat(2000)], "test.png", {
        type: "image/png",
      });
      const error = validateFile(file, {
        maxSize: 1000,
        allowedTypes: ["image/png"],
      });
      expect(error?.type).toBe("size-too-large");
    });

    it("returns type error if type validation fails", () => {
      const file = new File(["x".repeat(1000)], "test.txt", {
        type: "text/plain",
      });
      const error = validateFile(file, {
        maxSize: 2000,
        allowedTypes: ["image/png"],
      });
      expect(error?.type).toBe("invalid-type");
    });

    it("calls custom validator", () => {
      const file = new File(["test"], "test.png", { type: "image/png" });
      const error = validateFile(file, {
        customValidator: (f) => {
          if (f instanceof File && f.name.includes("test")) {
            return { type: "custom", message: "Test files not allowed" };
          }
          return null;
        },
      });
      expect(error).toEqual({
        type: "custom",
        message: "Test files not allowed",
      });
    });

    it("custom validator runs after size and type validation", () => {
      const file = new File(["x".repeat(2000)], "test.png", {
        type: "image/png",
      });
      const error = validateFile(file, {
        maxSize: 1000,
        customValidator: () => ({
          type: "custom",
          message: "This should not be called",
        }),
      });
      // Size validation fails first
      expect(error?.type).toBe("size-too-large");
    });

    it("returns null when all validations pass", () => {
      const file = new File(["x".repeat(1000)], "test.png", {
        type: "image/png",
      });
      const error = validateFile(file, {
        maxSize: 2000,
        minSize: 500,
        allowedTypes: ["image/png"],
        allowedExtensions: [".png"],
        customValidator: () => null,
      });
      expect(error).toBeNull();
    });
  });

  describe("formatValidationError", () => {
    it("formats size-too-large error", () => {
      const error: ValidationError = {
        type: "size-too-large",
        maxSize: 5000000,
        actualSize: 10000000,
      };
      const message = formatValidationError(error);
      expect(message).toContain("9.54 MB");
      expect(message).toContain("4.77 MB");
      expect(message).toContain("exceeds");
    });

    it("formats size-too-small error", () => {
      const error: ValidationError = {
        type: "size-too-small",
        minSize: 1000,
        actualSize: 500,
      };
      const message = formatValidationError(error);
      expect(message).toContain("Bytes");
      expect(message).toContain("below");
    });

    it("formats invalid-type error", () => {
      const error: ValidationError = {
        type: "invalid-type",
        allowedTypes: ["image/png", "image/jpeg"],
        actualType: "text/plain",
      };
      const message = formatValidationError(error);
      expect(message).toContain("text/plain");
      expect(message).toContain("image/png");
      expect(message).toContain("image/jpeg");
      expect(message).toContain("not allowed");
    });

    it("formats custom error", () => {
      const error: ValidationError = {
        type: "custom",
        message: "Custom validation failed",
      };
      const message = formatValidationError(error);
      expect(message).toBe("Custom validation failed");
    });
  });

  describe("formatBytes", () => {
    it("formats bytes correctly", () => {
      expect(formatBytes(0)).toBe("0 Bytes");
      expect(formatBytes(1024)).toBe("1 KB");
      expect(formatBytes(1536)).toBe("1.5 KB");
      expect(formatBytes(1048576)).toBe("1 MB");
      expect(formatBytes(1572864)).toBe("1.5 MB");
      expect(formatBytes(1073741824)).toBe("1 GB");
    });

    it("respects decimal places", () => {
      expect(formatBytes(1536, 0)).toBe("2 KB");
      expect(formatBytes(1536, 1)).toBe("1.5 KB");
      expect(formatBytes(1536, 3)).toBe("1.5 KB");
    });

    it("handles large numbers", () => {
      const result = formatBytes(1099511627776); // 1 TB
      expect(result).toBe("1 TB");
    });

    it("handles small numbers", () => {
      expect(formatBytes(100)).toBe("100 Bytes");
      expect(formatBytes(1)).toBe("1 Bytes");
    });
  });

  describe("FILE_TYPE_PRESETS", () => {
    it("contains image types", () => {
      expect(FILE_TYPE_PRESETS.images).toContain("image/png");
      expect(FILE_TYPE_PRESETS.images).toContain("image/jpeg");
      expect(FILE_TYPE_PRESETS.images).toContain("image/webp");
    });

    it("contains video types", () => {
      expect(FILE_TYPE_PRESETS.videos).toContain("video/mp4");
      expect(FILE_TYPE_PRESETS.videos).toContain("video/webm");
    });

    it("contains audio types", () => {
      expect(FILE_TYPE_PRESETS.audio).toContain("audio/mpeg");
      expect(FILE_TYPE_PRESETS.audio).toContain("audio/wav");
    });

    it("contains document types", () => {
      expect(FILE_TYPE_PRESETS.documents).toContain("application/pdf");
      expect(FILE_TYPE_PRESETS.documents).toContain("text/plain");
    });

    it("contains archive types", () => {
      expect(FILE_TYPE_PRESETS.archives).toContain("application/zip");
    });
  });

  describe("FILE_SIZE_PRESETS", () => {
    it("defines common size limits", () => {
      expect(FILE_SIZE_PRESETS["1MB"]).toBe(1024 * 1024);
      expect(FILE_SIZE_PRESETS["5MB"]).toBe(5 * 1024 * 1024);
      expect(FILE_SIZE_PRESETS["10MB"]).toBe(10 * 1024 * 1024);
      expect(FILE_SIZE_PRESETS["50MB"]).toBe(50 * 1024 * 1024);
      expect(FILE_SIZE_PRESETS["100MB"]).toBe(100 * 1024 * 1024);
      expect(FILE_SIZE_PRESETS["500MB"]).toBe(500 * 1024 * 1024);
      expect(FILE_SIZE_PRESETS["1GB"]).toBe(1024 * 1024 * 1024);
    });
  });

  describe("Integration examples", () => {
    it("validates image upload with presets", () => {
      const imageFile = new File(["x".repeat(3000000)], "photo.jpg", {
        type: "image/jpeg",
      });

      const error = validateFile(imageFile, {
        allowedTypes: FILE_TYPE_PRESETS.images,
        maxSize: FILE_SIZE_PRESETS["5MB"],
      });

      expect(error).toBeNull();
    });

    it("rejects oversized image", () => {
      const largeImage = new File(["x".repeat(11000000)], "large.png", {
        type: "image/png",
      });

      const error = validateFile(largeImage, {
        allowedTypes: FILE_TYPE_PRESETS.images,
        maxSize: FILE_SIZE_PRESETS["10MB"],
      });

      expect(error?.type).toBe("size-too-large");
    });

    it("rejects wrong file type", () => {
      const textFile = new File(["text"], "doc.txt", { type: "text/plain" });

      const error = validateFile(textFile, {
        allowedTypes: FILE_TYPE_PRESETS.images,
        maxSize: FILE_SIZE_PRESETS["5MB"],
      });

      expect(error?.type).toBe("invalid-type");
    });

    it("validates with custom rules", () => {
      const file = new File(["content"], "secret-file.pdf", {
        type: "application/pdf",
      });

      const error = validateFile(file, {
        maxSize: FILE_SIZE_PRESETS["10MB"],
        allowedTypes: FILE_TYPE_PRESETS.documents,
        customValidator: (f) => {
          if (f instanceof File && f.name.startsWith("secret")) {
            return {
              type: "custom",
              message: "Files with 'secret' prefix are not allowed",
            };
          }
          return null;
        },
      });

      expect(error?.type).toBe("custom");
      expect(error?.type === "custom" && error.message).toContain("secret");
    });
  });
});
