export type DogPhotoStorageRepository = {
  uploadPhoto(dogId: string, file: { uri: string; mimeType: string; sizeBytes: number }): Promise<string>
  deletePhoto(url: string): Promise<void>
}
