import { validateDogName } from "../../domain/policies/dog-name.policy"

import type { Dog } from "../../domain/entities/dog"
import type { DogInput, DogRepository } from "../../domain/repositories/dog.repository"

export type UpdateDogResult = { success: true; dog: Dog } | { success: false; reason: "required" }

export class UpdateDog {
  constructor(private readonly dogs: DogRepository) {}

  async execute(id: string, input: DogInput): Promise<UpdateDogResult> {
    const validation = validateDogName(input.name)
    if (!validation.valid) {
      return { success: false, reason: validation.reason }
    }

    const dog = await this.dogs.update(id, input)
    return { success: true, dog }
  }
}
