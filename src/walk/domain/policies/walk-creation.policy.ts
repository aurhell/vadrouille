export type WalkCreationValidationResult =
  | { valid: true }
  | { valid: false; reason: "location_required" | "start_time_past" | "too_many_dogs" }

const MAX_DOGS_PER_WALK = 10

export function validateWalkCreation(input: { locationText: string; startTime: string; dogIds: string[] }): WalkCreationValidationResult {
  if (input.locationText.trim().length === 0) {
    return { valid: false, reason: "location_required" }
  }
  if (new Date(input.startTime).getTime() <= Date.now()) {
    return { valid: false, reason: "start_time_past" }
  }
  if (input.dogIds.length > MAX_DOGS_PER_WALK) {
    return { valid: false, reason: "too_many_dogs" }
  }
  return { valid: true }
}
