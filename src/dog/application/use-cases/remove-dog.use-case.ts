import type { DogPhotoStorageRepository } from "../../domain/repositories/dog-photo-storage.repository"
import type { DogRepository } from "../../domain/repositories/dog.repository"

export class RemoveDog {
  constructor(
    private readonly dogs: DogRepository,
    private readonly storage: DogPhotoStorageRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const dog = await this.dogs.findById(id)
    if (dog?.photoUrl) {
      await this.storage.deletePhoto(dog.photoUrl)
    }
    return this.dogs.remove(id)
  }
}
