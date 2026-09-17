export type DogNameValidationResult = { valid: true } | { valid: false; reason: "required" }

export function validateDogName(name: string): DogNameValidationResult {
  if (name.trim().length === 0) {
    return { valid: false, reason: "required" }
  }

  return { valid: true }
}
