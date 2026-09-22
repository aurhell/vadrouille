import * as Linking from "expo-linking"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

import { supabase } from "@/shared/supabase/client"

import { parseAuthCallbackError } from "./parse-auth-callback-error"
import { parseAuthCallbackUrl } from "./parse-auth-callback-url"

import type { Session } from "@supabase/supabase-js"

type SessionContextValue = {
  session: Session | null
  /** true only until the initial session check resolves — not on later auth changes. */
  loading: boolean
  /** Set when a magic link callback came back with an error (expired/already-used link —
   * GoTrue uses the same `otp_expired` code for both, see parse-auth-callback-error.ts). */
  authError: string | null
  clearAuthError: () => void
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined)

const AUTH_ERROR_MESSAGE: Record<string, string> = {
  otp_expired: "Ce lien a expiré ou a déjà été utilisé. Demande un nouveau lien.",
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    async function handleUrl(url: string | null) {
      if (!url) return

      const callbackError = parseAuthCallbackError(url)
      if (callbackError) {
        setAuthError(AUTH_ERROR_MESSAGE[callbackError.code] ?? callbackError.description)
        return
      }

      const tokens = parseAuthCallbackUrl(url)
      if (!tokens) return

      await supabase.auth.setSession({ access_token: tokens.accessToken, refresh_token: tokens.refreshToken })
    }

    // Cold start: the app was opened directly via the magic link.
    Linking.getInitialURL().then(handleUrl)

    // Warm start: the app was already running (e.g. backgrounded) when the link was opened.
    const subscription = Linking.addEventListener("url", ({ url }) => handleUrl(url))

    return () => subscription.remove()
  }, [])

  return (
    <SessionContext.Provider value={{ session, loading, authError, clearAuthError: () => setAuthError(null) }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider")
  }
  return context
}
