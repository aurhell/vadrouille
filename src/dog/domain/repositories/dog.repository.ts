import type { Dog, DogSex } from "../entities/dog"

export type DogInput = {
  name: string
  breed?: string | null
  birthDate?: string | null
  sex?: DogSex | null
}

export type DogRepository = {
  /** Dogs I own or co-own (accepted only) — never someone else's. */
  list(): Promise<Dog[]>
  findById(id: string): Promise<Dog | null>
  /** Creates the dog and makes the caller its accepted owner (server-side trigger). */
  create(input: DogInput): Promise<Dog>
  update(id: string, input: DogInput): Promise<Dog>
  /** RLS-enforced: only the owner can actually delete — see dog.docs.md "Un co-owner tente
   * de supprimer un chien". */
  remove(id: string): Promise<void>
  updatePhoto(id: string, photoUrl: string): Promise<Dog>
  removePhoto(id: string): Promise<Dog>
}
