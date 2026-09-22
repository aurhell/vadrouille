export type AuthCallbackTokens = {
  accessToken: string
  refreshToken: string
}

/** Magic link callbacks carry the session tokens either in the URL's hash fragment
 * (implicit flow, the default) or, on some platforms/URL shapes, in the query string. */
export function parseAuthCallbackUrl(url: string): AuthCallbackTokens | null {
  const parsed = new URL(url)
  const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ""))

  const accessToken = hashParams.get("access_token") ?? parsed.searchParams.get("access_token")
  const refreshToken = hashParams.get("refresh_token") ?? parsed.searchParams.get("refresh_token")

  if (!accessToken || !refreshToken) return null

  return { accessToken, refreshToken }
}
