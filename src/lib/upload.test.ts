import { describe, it, expect } from "vitest";
import {
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
  isAllowedFileType,
  formatFileSize,
  isImageMimeType,
  getFileExtension,
} from "./upload";

describe("MAX_FILE_SIZE", () => {
  it("should be 10MB", () => {
    expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
  });
});

describe("ALLOWED_FILE_TYPES", () => {
  it("should include common image types", () => {
    expect(ALLOWED_FILE_TYPES["image/jpeg"]).toContain(".jpg");
    expect(ALLOWED_FILE_TYPES["image/jpeg"]).toContain(".jpeg");
    expect(ALLOWED_FILE_TYPES["image/png"]).toContain(".png");
    expect(ALLOWED_FILE_TYPES["image/gif"]).toContain(".gif");
    expect(ALLOWED_FILE_TYPES["image/webp"]).toContain(".webp");
    expect(ALLOWED_FILE_TYPES["image/svg+xml"]).toContain(".svg");
  });

  it("should include common document types", () => {
    expect(ALLOWED_FILE_TYPES["application/pdf"]).toContain(".pdf");
    expect(ALLOWED_FILE_TYPES["application/msword"]).toContain(".doc");
    expect(ALLOWED_FILE_TYPES["application/vnd.openxmlformats-officedocument.wordprocessingml.document"]).toContain(".docx");
  });

  it("should include spreadsheet types", () => {
    expect(ALLOWED_FILE_TYPES["application/vnd.ms-excel"]).toContain(".xls");
    expect(ALLOWED_FILE_TYPES["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]).toContain(".xlsx");
  });

  it("should include text types", () => {
    expect(ALLOWED_FILE_TYPES["text/plain"]).toContain(".txt");
    expect(ALLOWED_FILE_TYPES["text/csv"]).toContain(".csv");
    expect(ALLOWED_FILE_TYPES["text/markdown"]).toContain(".md");
  });

  it("should include archive types", () => {
    expect(ALLOWED_FILE_TYPES["application/zip"]).toContain(".zip");
    expect(ALLOWED_FILE_TYPES["application/x-rar-compressed"]).toContain(".rar");
    expect(ALLOWED_FILE_TYPES["application/gzip"]).toContain(".gz");
  });
});

describe("isAllowedFileType", () => {
  it("should return true for allowed image types", () => {
    expect(isAllowedFileType("image/jpeg")).toBe(true);
    expect(isAllowedFileType("image/png")).toBe(true);
    expect(isAllowedFileType("image/gif")).toBe(true);
    expect(isAllowedFileType("image/webp")).toBe(true);
    expect(isAllowedFileType("image/svg+xml")).toBe(true);
  });

  it("should return true for allowed document types", () => {
    expect(isAllowedFileType("application/pdf")).toBe(true);
    expect(isAllowedFileType("application/msword")).toBe(true);
    expect(isAllowedFileType("application/vnd.openxmlformats-officedocument.wordprocessingml.document")).toBe(true);
  });

  it("should return true for allowed text types", () => {
    expect(isAllowedFileType("text/plain")).toBe(true);
    expect(isAllowedFileType("text/csv")).toBe(true);
    expect(isAllowedFileType("text/markdown")).toBe(true);
  });

  it("should return true for allowed archive types", () => {
    expect(isAllowedFileType("application/zip")).toBe(true);
    expect(isAllowedFileType("application/gzip")).toBe(true);
  });

  it("should return false for disallowed types", () => {
    expect(isAllowedFileType("application/javascript")).toBe(false);
    expect(isAllowedFileType("application/x-executable")).toBe(false);
    expect(isAllowedFileType("video/mp4")).toBe(false);
    expect(isAllowedFileType("audio/mp3")).toBe(false);
    expect(isAllowedFileType("text/html")).toBe(false);
  });

  it("should return false for empty string", () => {
    expect(isAllowedFileType("")).toBe(false);
  });
});

describe("formatFileSize", () => {
  it("should format 0 bytes correctly", () => {
    expect(formatFileSize(0)).toBe("0 Bytes");
  });

  it("should format bytes correctly", () => {
    expect(formatFileSize(500)).toBe("500 Bytes");
    expect(formatFileSize(1023)).toBe("1023 Bytes");
  });

  it("should format kilobytes correctly", () => {
    expect(formatFileSize(1024)).toBe("1 KB");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(10240)).toBe("10 KB");
  });

  it("should format megabytes correctly", () => {
    expect(formatFileSize(1024 * 1024)).toBe("1 MB");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5 MB");
    expect(formatFileSize(10 * 1024 * 1024)).toBe("10 MB");
  });

  it("should format gigabytes correctly", () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe("1 GB");
    expect(formatFileSize(2.5 * 1024 * 1024 * 1024)).toBe("2.5 GB");
  });
});

describe("isImageMimeType", () => {
  it("should return true for image types", () => {
    expect(isImageMimeType("image/jpeg")).toBe(true);
    expect(isImageMimeType("image/png")).toBe(true);
    expect(isImageMimeType("image/gif")).toBe(true);
    expect(isImageMimeType("image/webp")).toBe(true);
    expect(isImageMimeType("image/svg+xml")).toBe(true);
    expect(isImageMimeType("image/bmp")).toBe(true);
  });

  it("should return false for non-image types", () => {
    expect(isImageMimeType("application/pdf")).toBe(false);
    expect(isImageMimeType("text/plain")).toBe(false);
    expect(isImageMimeType("video/mp4")).toBe(false);
    expect(isImageMimeType("audio/mp3")).toBe(false);
  });

  it("should return false for empty string", () => {
    expect(isImageMimeType("")).toBe(false);
  });
});

describe("getFileExtension", () => {
  it("should return lowercase extension", () => {
    expect(getFileExtension("file.pdf")).toBe(".pdf");
    expect(getFileExtension("document.PDF")).toBe(".pdf");
    expect(getFileExtension("image.PNG")).toBe(".png");
  });

  it("should handle multiple dots in filename", () => {
    expect(getFileExtension("file.test.pdf")).toBe(".pdf");
    expect(getFileExtension("my.document.docx")).toBe(".docx");
  });

  it("should return empty string for files without extension", () => {
    expect(getFileExtension("filename")).toBe("");
    expect(getFileExtension("noextension")).toBe("");
  });

  it("should handle hidden files", () => {
    expect(getFileExtension(".gitignore")).toBe(".gitignore");
    expect(getFileExtension(".env")).toBe(".env");
  });

  it("should handle empty string", () => {
    expect(getFileExtension("")).toBe("");
  });
});
