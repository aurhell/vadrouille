export type EmailValidationResult = { valid: true } | { valid: false; reason: "invalid_format" }

// Pragmatic client-side check: reject the obviously malformed and let Supabase Auth be the
// source of truth for anything more subtle (it validates again server-side regardless).
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(email: string): EmailValidationResult {
  if (!EMAIL_FORMAT.test(email)) {
    return { valid: false, reason: "invalid_format" }
  }

  return { valid: true }
}
