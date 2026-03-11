// src/lib/storage.ts
// Local file storage implementation (no cloud dependency)
import { mkdir, writeFile, unlink, readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// Local storage directory (inside public folder for serving)
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export type UploadFolder =
  | "courses"
  | "assignments"
  | "submissions"
  | "certificates"
  | "profiles";

interface UploadResult {
  url: string;
  key: string;
}

/**
 * Ensure upload directory exists
 */
async function ensureDir(dir: string): Promise<void> {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

/**
 * Upload a file to local storage
 */
export async function uploadFile(
  file: Buffer,
  filename: string,
  folder: UploadFolder,
  contentType: string
): Promise<UploadResult> {
  // Sanitize filename
  const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const key = `${folder}/${Date.now()}-${safeName}`;
  const filePath = path.join(UPLOAD_DIR, key);

  // Ensure directory exists
  await ensureDir(path.dirname(filePath));

  // Write file
  await writeFile(filePath, file);

  // Return public URL (served by Next.js from /public)
  const url = `/uploads/${key}`;

  return { url, key };
}

/**
 * Delete a file from local storage
 */
export async function deleteFile(key: string): Promise<void> {
  const filePath = path.join(UPLOAD_DIR, key);
  
  try {
    await unlink(filePath);
  } catch (error) {
    // File might not exist, ignore error
    console.warn(`Failed to delete file: ${key}`, error);
  }
}

/**
 * Get a file from local storage
 */
export async function getFile(key: string): Promise<Buffer | null> {
  const filePath = path.join(UPLOAD_DIR, key);
  
  try {
    return await readFile(filePath);
  } catch {
    return null;
  }
}

/**
 * Get the public URL for a file
 */
export function getFileUrl(key: string): string {
  return `/uploads/${key}`;
}

/**
 * Extract the key from a URL
 */
export function extractKeyFromUrl(url: string): string | null {
  if (url.startsWith("/uploads/")) {
    return url.replace("/uploads/", "");
  }
  return null;
}

/**
 * Validate file type based on MIME type
 */
export function validateMimeType(
  mimeType: string,
  allowedTypes: string[]
): boolean {
  return allowedTypes.some((type) => {
    if (type.endsWith("/*")) {
      return mimeType.startsWith(type.replace("/*", "/"));
    }
    return mimeType === type;
  });
}

// Allowed MIME types
export const ALLOWED_DOCUMENT_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

export const ALLOWED_IMAGE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

export const ALLOWED_VIDEO_MIMES = ["video/mp4", "video/webm", "video/quicktime"];

export const ALLOWED_SUBMISSION_MIMES = [
  ...ALLOWED_DOCUMENT_MIMES,
  ...ALLOWED_IMAGE_MIMES,
];

export const ALLOWED_CONTENT_MIMES = [
  ...ALLOWED_DOCUMENT_MIMES,
  ...ALLOWED_IMAGE_MIMES,
  ...ALLOWED_VIDEO_MIMES,
];
