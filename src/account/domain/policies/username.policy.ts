export type UsernameValidationResult = { valid: true } | { valid: false; reason: "required" | "invalid_format" }

const USERNAME_FORMAT = /^[A-Za-z0-9_.]{3,20}$/

export function validateUsername(username: string): UsernameValidationResult {
  if (username.length === 0) {
    return { valid: false, reason: "required" }
  }

  if (!USERNAME_FORMAT.test(username)) {
    return { valid: false, reason: "invalid_format" }
  }

  return { valid: true }
}
