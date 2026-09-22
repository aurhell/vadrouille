import { validateDogName } from "../../domain/policies/dog-name.policy"

import type { Dog } from "../../domain/entities/dog"
import type { DogInput, DogRepository } from "../../domain/repositories/dog.repository"

export type CreateDogResult = { success: true; dog: Dog } | { success: false; reason: "required" }

export class CreateDog {
  constructor(private readonly dogs: DogRepository) {}

  async execute(input: DogInput): Promise<CreateDogResult> {
    const validation = validateDogName(input.name)
    if (!validation.valid) {
      return { success: false, reason: validation.reason }
    }

    const dog = await this.dogs.create(input)
    return { success: true, dog }
  }
}
