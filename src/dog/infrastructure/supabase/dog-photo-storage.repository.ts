import type { SupabaseClient } from "@supabase/supabase-js"
import type { DogPhotoStorageRepository } from "../../domain/repositories/dog-photo-storage.repository"

const BUCKET = "dog-photos"

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
}

export class SupabaseDogPhotoStorageRepository implements DogPhotoStorageRepository {
  constructor(private readonly client: SupabaseClient) {}

  async uploadPhoto(dogId: string, file: { uri: string; mimeType: string; sizeBytes: number }): Promise<string> {
    // Fresh filename per upload, same reasoning as account avatars: never reuse the previous
    // photo's path, or "upload new, then delete old" would delete what it just uploaded.
    const extension = EXTENSION_BY_MIME_TYPE[file.mimeType] ?? "jpg"
    const path = `${dogId}/${Date.now()}.${extension}`

    const response = await fetch(file.uri)
    const body = await response.arrayBuffer()

    const { error } = await this.client.storage.from(BUCKET).upload(path, body, { contentType: file.mimeType })
    if (error) throw error

    return this.client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
  }

  async deletePhoto(url: string): Promise<void> {
    const marker = `/${BUCKET}/`
    const index = url.indexOf(marker)
    if (index === -1) return

    const path = url.slice(index + marker.length)
    const { error } = await this.client.storage.from(BUCKET).remove([path])
    if (error) throw error
  }
}
