import { useState } from "react"
import { YStack } from "tamagui"

import { useSession } from "@/shared/providers/session-provider"
import { useThemePreference } from "@/shared/providers/theme-preference-provider"
import { Body, Button, TextField, VadrouilleLockup } from "@/shared/ui"
import { themes } from "@/shared/ui/themes"

import { useRequestMagicLink } from "../hooks/use-account-mutations"

import { DevPasteMagicLink } from "./dev-paste-magic-link"

const ERROR_MESSAGE = {
  invalid_format: "Adresse email invalide",
} as const

export function LoginScreen() {
  const { resolvedTheme } = useThemePreference()
  const theme = themes[resolvedTheme]
  const { authError, clearAuthError } = useSession()
  const [email, setEmail] = useState("")
  const [linkSent, setLinkSent] = useState(false)
  const [unexpectedError, setUnexpectedError] = useState<string>()
  const requestMagicLink = useRequestMagicLink()

  const result = requestMagicLink.data
  const errorMessage = result && !result.success ? ERROR_MESSAGE[result.reason] : undefined

  async function handleSubmit() {
    clearAuthError()
    setUnexpectedError(undefined)

    try {
      const outcome = await requestMagicLink.mutateAsync(email)
      setLinkSent(outcome.success)
    } catch {
      // E.g. Supabase Auth's own rate limiting ("Demandes de lien rapprochées" in
      // account.docs.md) or a network error — both surface as a thrown error here rather
      // than the {success:false} shape used for client-side validation failures above.
      setUnexpectedError("Un problème est survenu. Réessaie dans quelques instants.")
    }
  }

  return (
    <YStack flex={1} backgroundColor="$background" justifyContent="center" paddingHorizontal="$6" gap="$6">
      <YStack alignItems="center" gap="$2">
        <VadrouilleLockup markSize={76} wordSize={38} color={theme.accent} background={theme.background} wordColor={theme.color} />
        <Body size="lg" tone="subtle" textAlign="center">
          Organise des balades de chiens entre amis.
        </Body>
      </YStack>

      {authError ? (
        <Body size="sm" color="$danger" textAlign="center" fontWeight="700">
          {authError}
        </Body>
      ) : null}

      {linkSent ? (
        <YStack backgroundColor="$backgroundStrong" borderRadius="$5" padding="$5" gap="$2" alignItems="center">
          <Body size="lg" fontWeight="700" textAlign="center">
            Lien envoyé ✓
          </Body>
          <Body tone="subtle" textAlign="center">
            Consulte ta boîte mail pour te connecter.
          </Body>
        </YStack>
      ) : (
        <YStack gap="$3">
          <TextField
            label="Adresse email"
            placeholder="toi@exemple.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            state={errorMessage ? "error" : "default"}
            helper={errorMessage}
          />
          {unexpectedError ? (
            <Body size="sm" color="$danger" fontWeight="700">
              {unexpectedError}
            </Body>
          ) : null}
          <Button full disabled={!email || requestMagicLink.isPending} loading={requestMagicLink.isPending} onPress={handleSubmit}>
            Recevoir un lien magique
          </Button>
          <Body size="xs" tone="subtle" textAlign="center">
            En continuant, tu acceptes les CGU et la politique de confidentialité de Vadrouille.
          </Body>
        </YStack>
      )}

      {__DEV__ ? <DevPasteMagicLink /> : null}
    </YStack>
  )
}
