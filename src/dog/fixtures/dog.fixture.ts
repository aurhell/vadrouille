import type { Dog } from "../domain/entities/dog"

export const createDogFixture = (overrides: Partial<Dog> = {}): Dog => ({
  id: "dog-1",
  name: "Rex",
  breed: "Labrador",
  birthDate: "2020-01-01",
  sex: "male",
  photoUrl: null,
  myRole: "owner",
  coOwners: [],
  ...overrides,
})
