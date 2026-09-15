import { useState } from "react"
import { YStack } from "tamagui"

import { supabase } from "@/shared/supabase/client"
import { Body, Button, TextField } from "@/shared/ui"

/**
 * Dev-only testing aid — not a product feature (see login.docs / account.docs.md, which spec
 * a clickable link, not a pasted one).
 *
 * Expo Go only understands exp:// links, never the app's own `vadrouille://` scheme, so
 * clicking the real magic link never reopens the app during local dev (see
 * supabase/config.toml's [auth] section for the full explanation, including the upstream
 * GoTrue bug this works around). This lets you paste the link straight from Mailpit
 * (http://<lan-ip>:54324) and complete sign-in without needing an EAS dev-client build.
 */
export function DevPasteMagicLink() {
  const [link, setLink] = useState("")
  const [error, setError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    setError(undefined)
    setSubmitting(true)
    try {
      const url = new URL(link.trim())
      const tokenHash = url.searchParams.get("token")
      const type = url.searchParams.get("type")
      if (!tokenHash || type !== "magiclink") {
        setError("Lien invalide — colle l'URL complète depuis Mailpit.")
        return
      }

      const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" })
      if (verifyError) setError(verifyError.message)
    } catch {
      setError("Lien invalide — colle l'URL complète depuis Mailpit.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <YStack borderWidth={2} borderStyle="dashed" borderColor="$warning" borderRadius="$4" padding="$4" gap="$3">
      <Body size="xs" tone="subtle" fontWeight="700">
        DEV — coller le lien magique depuis Mailpit
      </Body>
      <TextField
        placeholder="http://127.0.0.1:54321/auth/v1/verify?token=..."
        autoCapitalize="none"
        value={link}
        onChangeText={setLink}
        state={error ? "error" : "default"}
        helper={error}
      />
      <Button variant="secondary" size="sm" disabled={!link || submitting} loading={submitting} onPress={handleSubmit}>
        Valider le lien
      </Button>
    </YStack>
  )
}
