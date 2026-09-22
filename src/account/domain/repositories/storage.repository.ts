export type StorageRepository = {
  /** Uploads to the `avatars` bucket under `{userId}/...` and returns the public URL. */
  uploadAvatar(userId: string, file: { uri: string; mimeType: string; sizeBytes: number }): Promise<string>
  deleteAvatar(url: string): Promise<void>
}
