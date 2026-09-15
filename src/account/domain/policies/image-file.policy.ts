export type ImageFileValidationResult = { valid: true } | { valid: false; reason: "unsupported_format" | "too_large" }

const SUPPORTED_MIME_TYPES = new Set(["image/jpeg", "image/png"])

// Matches the `avatars`/`dog-photos` Storage buckets' file_size_limit (see
// supabase/migrations/*_storage.sql).
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

export function validateImageFile(file: { mimeType: string; sizeBytes: number }): ImageFileValidationResult {
  if (!SUPPORTED_MIME_TYPES.has(file.mimeType)) {
    return { valid: false, reason: "unsupported_format" }
  }

  if (file.sizeBytes > MAX_IMAGE_SIZE_BYTES) {
    return { valid: false, reason: "too_large" }
  }

  return { valid: true }
}
