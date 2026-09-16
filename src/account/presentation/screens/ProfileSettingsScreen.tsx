import * as ImagePicker from "expo-image-picker"
import { useEffect, useState } from "react"
import { Alert, Image } from "react-native"
import { YStack } from "tamagui"

import { useSession } from "../providers/session-provider"
import { useProfile } from "../hooks/use-profile"
import { useDeleteAccount, useRemoveAvatar, useSignOut, useUpdateAvatar, useUpdateUsername } from "../hooks/use-account-mutations"
import { useRegenerateInviteCode } from "@/friend/presentation/hooks/use-friend-mutations"
import { Body, Button, Card, Label, ScreenHeader, TextField } from "@/shared/ui"

const ERROR_MESSAGE = {
  required: "Le pseudo est obligatoire",
  invalid_format: "3 à 20 caractères : lettres, chiffres, _ ou .",
} as const

const AVATAR_ERROR_MESSAGE = {
  unsupported_format: "Format non supporté (JPEG ou PNG). Ta photo précédente est conservée.",
  too_large: "Fichier trop volumineux. Ta photo précédente est conservée.",
} as const

/** "ABCD1234" -> "ABCD 1234" — a bare run of 8 uppercase alphanumerics reads as an
 * illegible blob at large sizes (thick weight + tight tracking make similar glyphs like
 * B/R or I/1 hard to tell apart); grouping breaks it into two chunks the eye can parse. */
function formatInviteCode(code: string): string {
  return code.match(/.{1,4}/g)?.join(" ") ?? code
}

export function ProfileSettingsScreen() {
  const { session } = useSession()
  const userId = session?.user.id
  const { data: profile } = useProfile(userId)

  const [username, setUsername] = useState("")
  const [avatarError, setAvatarError] = useState<string>()
  useEffect(() => {
    if (profile) setUsername(profile.username)
  }, [profile])

  const updateUsername = useUpdateUsername()
  const updateAvatar = useUpdateAvatar()
  const removeAvatar = useRemoveAvatar()
  const signOut = useSignOut()
  const deleteAccount = useDeleteAccount()
  const regenerateInviteCode = useRegenerateInviteCode(userId)

  const usernameResult = updateUsername.data
  const errorMessage = usernameResult && !usernameResult.success ? ERROR_MESSAGE[usernameResult.reason] : undefined
  const usernameChanged = profile !== undefined && profile !== null && username !== profile.username

  async function handleChangeAvatar() {
    if (!userId) return
    setAvatarError(undefined)

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) return

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8 })
    if (result.canceled) return

    const asset = result.assets[0]
    try {
      const outcome = await updateAvatar.mutateAsync({
        id: userId,
        file: { uri: asset.uri, mimeType: asset.mimeType ?? "image/jpeg", sizeBytes: asset.fileSize ?? 0 },
      })
      if (!outcome.success) setAvatarError(AVATAR_ERROR_MESSAGE[outcome.reason])
    } catch {
      setAvatarError("Un problème est survenu. Réessaie dans quelques instants.")
    }
  }

  function handleRemoveAvatar() {
    if (userId) removeAvatar.mutate({ id: userId })
  }

  function handleSaveUsername() {
    if (userId) updateUsername.mutate({ id: userId, username })
  }

  function handleDeleteAccount() {
    Alert.alert(
      "Supprimer ton compte ?",
      "Cette action est définitive : ton profil et tes données personnelles seront supprimés.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: () => deleteAccount.mutate() },
      ],
    )
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScreenHeader title="Réglages" />

      <YStack flex={1} padding="$5" gap="$6">
        <YStack alignItems="center" gap="$3">
          <YStack
            width={104}
            height={104}
            borderRadius="$round"
            backgroundColor="$accentSoft"
            alignItems="center"
            justifyContent="center"
            overflow="hidden"
            onPress={handleChangeAvatar}
          >
            {profile?.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={{ width: 104, height: 104 }} />
            ) : (
              <Body fontSize={34} lineHeight={40}>
                ＋
              </Body>
            )}
          </YStack>
          {profile?.avatarUrl ? (
            <Body size="sm" tone="accent" fontWeight="700" minHeight="$tap" paddingVertical="$2" hitSlop={12} onPress={handleRemoveAvatar}>
              Supprimer la photo
            </Body>
          ) : null}
          {avatarError ? (
            <Body size="sm" color="$danger" textAlign="center" fontWeight="700">
              {avatarError}
            </Body>
          ) : null}
        </YStack>

        <YStack gap="$2">
          <Label>Email</Label>
          <Body tone="subtle">{session?.user.email}</Body>
        </YStack>

        <TextField
          label="Pseudo"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          state={errorMessage ? "error" : "default"}
          helper={errorMessage}
        />
        {usernameChanged ? (
          <Button size="md" disabled={updateUsername.isPending} loading={updateUsername.isPending} onPress={handleSaveUsername}>
            Enregistrer le pseudo
          </Button>
        ) : null}

        {profile ? (
          <Card gap="$2">
            <Body size="sm" tone="subtle" fontWeight="700">
              Mon code d'invitation
            </Body>
            {/* explicit lineHeight: Body's default (md, 21) is shorter than this fontSize,
             * which clips Nunito Bold's tall strokes and makes adjacent letters look merged. */}
            <Body fontSize={26} lineHeight={32} fontWeight="700" letterSpacing={2}>
              {formatInviteCode(profile.inviteCode)}
            </Body>
            <Body
              size="sm"
              tone="accent"
              fontWeight="700"
              minHeight="$tap"
              paddingVertical="$2"
              hitSlop={12}
              onPress={() => regenerateInviteCode.mutate()}
            >
              {regenerateInviteCode.isPending ? "Régénération..." : "Régénérer le code"}
            </Body>
          </Card>
        ) : null}

        <YStack flex={1} justifyContent="flex-end" gap="$4">
          <Button variant="secondary" full disabled={signOut.isPending} loading={signOut.isPending} onPress={() => signOut.mutate()}>
            Se déconnecter
          </Button>
          <Body
            size="sm"
            tone="subtle"
            textAlign="center"
            fontWeight="700"
            minHeight="$tap"
            paddingVertical="$2"
            hitSlop={12}
            onPress={handleDeleteAccount}
          >
            Supprimer mon compte
          </Body>
        </YStack>
      </YStack>
    </YStack>
  )
}
