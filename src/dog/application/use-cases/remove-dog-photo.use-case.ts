import type { Dog } from "../../domain/entities/dog"
import type { DogPhotoStorageRepository } from "../../domain/repositories/dog-photo-storage.repository"
import type { DogRepository } from "../../domain/repositories/dog.repository"

export class RemoveDogPhoto {
  constructor(
    private readonly dogs: DogRepository,
    private readonly storage: DogPhotoStorageRepository,
  ) {}

  async execute(id: string): Promise<Dog> {
    const current = await this.dogs.findById(id)

    if (current?.photoUrl) {
      await this.storage.deletePhoto(current.photoUrl)
    }

    return this.dogs.removePhoto(id)
  }
}
