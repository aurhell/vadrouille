import * as ImagePicker from "expo-image-picker"
import { useState } from "react"
import { Image } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { XStack, YStack } from "tamagui"

import { useSession } from "../providers/session-provider"
import { useCreateProfile, useSignOut, useUpdateAvatar } from "../hooks/use-account-mutations"
import { Body, Button, Display, TextField } from "@/shared/ui"

const ERROR_MESSAGE = {
  required: "Le pseudo est obligatoire",
  invalid_format: "3 à 20 caractères : lettres, chiffres, _ ou .",
} as const

const AVATAR_ERROR_MESSAGE = {
  unsupported_format: "Photo non ajoutée : format non supporté (JPEG ou PNG).",
  too_large: "Photo non ajoutée : fichier trop volumineux.",
} as const

async function pickPhoto(): Promise<ImagePicker.ImagePickerAsset | undefined> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!permission.granted) return undefined

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  })
  return result.canceled ? undefined : result.assets[0]
}

export function OnboardingScreen() {
  const insets = useSafeAreaInsets()
  const { session } = useSession()
  const [username, setUsername] = useState("")
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset>()
  const [unexpectedError, setUnexpectedError] = useState<string>()
  const createProfile = useCreateProfile()
  const updateAvatar = useUpdateAvatar()
  const signOut = useSignOut()

  const result = createProfile.data
  const errorMessage = result && !result.success ? ERROR_MESSAGE[result.reason] : undefined
  const submitting = createProfile.isPending || updateAvatar.isPending

  async function handleSubmit() {
    if (!session) return
    setUnexpectedError(undefined)

    try {
      const outcome = await createProfile.mutateAsync({ id: session.user.id, username })
      if (!outcome.success) return

      if (photo) {
        const avatarOutcome = await updateAvatar.mutateAsync({
          id: session.user.id,
          file: { uri: photo.uri, mimeType: photo.mimeType ?? "image/jpeg", sizeBytes: photo.fileSize ?? 0 },
        })
        // Non-blocking: the profile already exists at this point, so onboarding is
        // considered done either way (matches "Avatar — passer l'étape" continuing
        // regardless) — this only surfaces *why* the photo specifically didn't make it.
        if (!avatarOutcome.success) setUnexpectedError(AVATAR_ERROR_MESSAGE[avatarOutcome.reason])
      }
      // No manual navigation: the root layout's auth gate redirects away from onboarding as
      // soon as the profile query (updated above via mutation cache writes) resolves non-null.
    } catch {
      // E.g. a stale cached session pointing at a deleted/recreated auth user (foreign key
      // violation on profiles.id): there's no way to recover in place, only to sign out and
      // start a fresh login.
      setUnexpectedError("Un problème est survenu. Reconnecte-toi pour réessayer.")
    }
  }

  return (
    <YStack flex={1} backgroundColor="$accent">
      <YStack paddingHorizontal="$6" paddingTop="$9" paddingBottom="$6" gap="$3">
        {/* flex-start, not center: the title wraps to 2 lines here, and centering against the
         * whole 2-line block visually misaligns the emoji from the first line's cap-height. */}
        <XStack alignItems="flex-start" gap="$2">
          <Body fontSize={30} lineHeight={41}>
            🦮
          </Body>
          <Display size="lg" color="$accentText" flexShrink={1}>
            Bienvenue sur Vadrouille !
          </Display>
        </XStack>
        <Body size="lg" color="$accentText" opacity={0.95}>
          Comment tes amis te reconnaîtront-ils ?
        </Body>
      </YStack>

      <YStack
        flex={1}
        backgroundColor="$background"
        borderTopLeftRadius={38}
        borderTopRightRadius={38}
        padding="$6"
        paddingBottom={Math.max(insets.bottom, 16) + 16}
        gap="$6"
      >
        <YStack alignItems="center" gap="$3">
          <YStack
            width={104}
            height={104}
            borderRadius="$round"
            backgroundColor="$accentSoft"
            borderWidth={3}
            borderStyle="dashed"
            borderColor="$warning"
            alignItems="center"
            justifyContent="center"
            overflow="hidden"
            onPress={async () => setPhoto((await pickPhoto()) ?? photo)}
          >
            {photo ? (
              <Image source={{ uri: photo.uri }} style={{ width: 104, height: 104 }} />
            ) : (
              <Body fontSize={34} lineHeight={40}>
                ＋
              </Body>
            )}
          </YStack>
          <Body size="sm" tone="subtle" fontWeight="700">
            Ajoute une photo (optionnel)
          </Body>
        </YStack>

        <TextField
          large
          label="Ton pseudo"
          placeholder="@pseudo"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
          state={errorMessage ? "error" : username ? "filled" : "default"}
          helper={errorMessage}
        />

        <YStack flex={1} justifyContent="flex-end" gap="$3">
          {unexpectedError ? (
            <Body size="sm" color="$danger" textAlign="center" fontWeight="700">
              {unexpectedError}
            </Body>
          ) : null}
          <Button full disabled={!username || submitting} loading={submitting} onPress={handleSubmit}>
            C'est parti !
          </Button>
          <Body size="xs" tone="subtle" textAlign="center" fontWeight="600">
            Tu pourras le changer plus tard.
          </Body>
          <Body
            size="xs"
            tone="subtle"
            textAlign="center"
            fontWeight="700"
            minHeight="$tap"
            paddingVertical="$2"
            hitSlop={12}
            onPress={() => signOut.mutate()}
          >
            Ce n'est pas moi — se déconnecter
          </Body>
        </YStack>
      </YStack>
    </YStack>
  )
}
