export interface AuthCallbackError {
  code: string
  description: string
}

/** GoTrue redirects an expired or already-used magic link with `error`/`error_code`/
 * `error_description` in the URL's hash fragment — the same `otp_expired` code either way,
 * it doesn't distinguish the two (confirmed empirically against the local instance). */
export function parseAuthCallbackError(url: string): AuthCallbackError | null {
  const parsed = new URL(url)
  const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ""))

  const code = hashParams.get("error_code") ?? parsed.searchParams.get("error_code")
  const description = hashParams.get("error_description") ?? parsed.searchParams.get("error_description")

  if (!code) return null

  return { code, description: description ?? code }
}
