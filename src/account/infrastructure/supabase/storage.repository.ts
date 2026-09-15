import type { SupabaseClient } from "@supabase/supabase-js"
import type { StorageRepository } from "../../domain/repositories/storage.repository"

const BUCKET = "avatars"

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
}

export class SupabaseStorageRepository implements StorageRepository {
  constructor(private readonly client: SupabaseClient) {}

  async uploadAvatar(userId: string, file: { uri: string; mimeType: string; sizeBytes: number }): Promise<string> {
    // A fresh, unique filename per upload — never reuse the previous avatar's path, or
    // UpdateAvatar's "upload new, then delete old" sequence would delete the file it just
    // uploaded when both resolve to the same path.
    const extension = EXTENSION_BY_MIME_TYPE[file.mimeType] ?? "jpg"
    const path = `${userId}/${Date.now()}.${extension}`

    const response = await fetch(file.uri)
    const body = await response.arrayBuffer()

    const { error } = await this.client.storage.from(BUCKET).upload(path, body, { contentType: file.mimeType })
    if (error) throw error

    return this.client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
  }

  async deleteAvatar(url: string): Promise<void> {
    const marker = `/${BUCKET}/`
    const index = url.indexOf(marker)
    if (index === -1) return

    const path = url.slice(index + marker.length)
    const { error } = await this.client.storage.from(BUCKET).remove([path])
    if (error) throw error
  }
}
