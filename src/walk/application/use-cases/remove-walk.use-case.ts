import type { WalkRepository } from "../../domain/repositories/walk.repository"

export class RemoveWalk {
  constructor(private readonly walks: WalkRepository) {}

  execute(id: string): Promise<void> {
    return this.walks.remove(id)
  }
}
