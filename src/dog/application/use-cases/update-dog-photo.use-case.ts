import { validateImageFile } from "@/shared/domain/policies/image-file.policy"
import type { Dog } from "../../domain/entities/dog"
import type { DogPhotoStorageRepository } from "../../domain/repositories/dog-photo-storage.repository"
import type { DogRepository } from "../../domain/repositories/dog.repository"

export type UpdateDogPhotoInput = { id: string; file: { uri: string; mimeType: string; sizeBytes: number } }

export type UpdateDogPhotoResult = { success: true; dog: Dog } | { success: false; reason: "unsupported_format" | "too_large" }

export class UpdateDogPhoto {
  constructor(
    private readonly dogs: DogRepository,
    private readonly storage: DogPhotoStorageRepository,
  ) {}

  async execute(input: UpdateDogPhotoInput): Promise<UpdateDogPhotoResult> {
    const validation = validateImageFile({ mimeType: input.file.mimeType, sizeBytes: input.file.sizeBytes })
    if (!validation.valid) {
      return { success: false, reason: validation.reason }
    }

    const current = await this.dogs.findById(input.id)
    const photoUrl = await this.storage.uploadPhoto(input.id, input.file)

    if (current?.photoUrl) {
      await this.storage.deletePhoto(current.photoUrl)
    }

    const dog = await this.dogs.updatePhoto(input.id, photoUrl)
    return { success: true, dog }
  }
}
