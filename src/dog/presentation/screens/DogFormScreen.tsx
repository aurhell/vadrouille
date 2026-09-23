import * as ImagePicker from "expo-image-picker"
import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { Image, ScrollView } from "react-native"
import { YStack } from "tamagui"

import { useSession } from "@/shared/providers/session-provider"
import { Body, Button, Card, ChoiceChipGroup, ConfirmDialog, DateField, Label, PersonRow, ScreenHeader, TextField } from "@/shared/ui"

import { deleteDogMessage } from "../delete-dog-message"
import { useSentCoOwnerInvites } from "../hooks/use-co-owner-invites"
import { useCancelCoOwnerInvite, useInviteCoOwner, useLeaveCoOwnership } from "../hooks/use-co-owner-mutations"
import { useCreateDog, useRemoveDog, useRemoveDogPhoto, useUpdateDog, useUpdateDogPhoto } from "../hooks/use-dog-mutations"
import { useDog } from "../hooks/use-dogs"
import { useFriends } from "../hooks/use-friends"

import type { DogSex } from "../../domain/entities/dog"

const ERROR_MESSAGE = {
  required: "Le nom est obligatoire",
} as const

const SEX_OPTIONS: { value: DogSex | ""; label: string }[] = [
  { value: "", label: "Non renseigné" },
  { value: "male", label: "Mâle" },
  { value: "female", label: "Femelle" },
]

const PHOTO_ERROR_MESSAGE = {
  unsupported_format: "Format non supporté (JPEG ou PNG). La photo précédente est conservée.",
  too_large: "Fichier trop volumineux. La photo précédente est conservée.",
} as const

async function pickPhoto(): Promise<ImagePicker.ImagePickerAsset | undefined> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!permission.granted) return undefined

  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8 })
  return result.canceled ? undefined : result.assets[0]
}

/** Local date parts, not toISOString() — that's UTC and can shift the date by a day
 * depending on the device's timezone relative to midnight. */
function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function fromISODate(isoDate: string | null): Date | null {
  if (!isoDate) return null
  const [year, month, day] = isoDate.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function CoOwnersSection({ dogId, userId, canManage }: { dogId: string; userId: string | undefined; canManage: boolean }) {
  const router = useRouter()
  const { data: existingDog } = useDog(dogId)
  const { data: friends } = useFriends(userId)
  const sentInvitesQuery = useSentCoOwnerInvites(userId)
  const sentInvitesForThisDog = (sentInvitesQuery.data ?? []).filter((invite) => invite.dogId === dogId)

  const inviteCoOwner = useInviteCoOwner(userId)
  const cancelInvite = useCancelCoOwnerInvite(userId)
  const leaveCoOwnership = useLeaveCoOwnership(userId)

  const [pickerOpen, setPickerOpen] = useState(false)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)

  if (!existingDog) return null

  const alreadyLinkedIds = new Set([...existingDog.coOwners.map((c) => c.id), ...sentInvitesForThisDog.map((i) => i.otherUser.id)])
  const availableFriends = (friends ?? []).filter((friend) => !alreadyLinkedIds.has(friend.id))

  async function handleLeave() {
    setLeaveDialogOpen(false)
    await leaveCoOwnership.mutateAsync(dogId)
    router.back()
  }

  return (
    <YStack gap="$3">
      <Label>Foyer partagé</Label>

      {existingDog.coOwners.length > 0 ? (
        existingDog.coOwners.map((coOwner) => (
          <PersonRow key={coOwner.id} person={{ id: coOwner.id, username: coOwner.username, avatarUrl: coOwner.avatarUrl ?? undefined }} />
        ))
      ) : (
        <Body size="sm" tone="subtle">
          Aucun co-owner pour l'instant.
        </Body>
      )}

      {canManage ? (
        <>
          {sentInvitesForThisDog.map((invite) => (
            <Card key={invite.otherUser.id} gap="$2">
              <PersonRow
                person={{ id: invite.otherUser.id, username: invite.otherUser.username, avatarUrl: invite.otherUser.avatarUrl ?? undefined }}
                label={`${invite.otherUser.username} — en attente`}
              />
              <Button
                variant="secondary"
                size="sm"
                disabled={cancelInvite.isPending}
                onPress={() => cancelInvite.mutate({ dogId, inviteeId: invite.otherUser.id })}
              >
                Retirer l'invitation
              </Button>
            </Card>
          ))}

          {pickerOpen ? (
            <YStack gap="$2">
              {availableFriends.length > 0 ? (
                availableFriends.map((friend) => (
                  <PersonRow
                    key={friend.id}
                    person={{ id: friend.id, username: friend.username, avatarUrl: friend.avatarUrl ?? undefined }}
                    onPress={() => {
                      inviteCoOwner.mutate({ dogId, friendId: friend.id })
                      setPickerOpen(false)
                    }}
                  />
                ))
              ) : (
                <Body size="sm" tone="subtle">
                  Tous tes amis sont déjà invités ou co-owners de {existingDog.name}.
                </Body>
              )}
            </YStack>
          ) : (
            <Body
              size="sm"
              tone="accent"
              fontWeight="700"
              minHeight="$tap"
              paddingVertical="$2"
              hitSlop={12}
              onPress={() => setPickerOpen(true)}
              accessibilityRole="button"
            >
              ＋ Inviter un ami
            </Body>
          )}
        </>
      ) : (
        <Body
          size="sm"
          tone="accent"
          fontWeight="700"
          minHeight="$tap"
          paddingVertical="$2"
          hitSlop={12}
          onPress={() => setLeaveDialogOpen(true)}
          accessibilityRole="button"
        >
          Quitter le foyer partagé
        </Body>
      )}

      <ConfirmDialog
        open={leaveDialogOpen}
        title="Quitter le foyer partagé ?"
        message={`Tu ne seras plus co-owner de ${existingDog.name}.`}
        confirmLabel="Quitter"
        onConfirm={handleLeave}
        onCancel={() => setLeaveDialogOpen(false)}
      />
    </YStack>
  )
}

export function DogFormScreen({ dogId }: { dogId?: string }) {
  const router = useRouter()
  const { session } = useSession()
  const userId = session?.user.id
  const isEditing = !!dogId
  const { data: existingDog } = useDog(dogId)

  const [name, setName] = useState("")
  const [breed, setBreed] = useState("")
  const [birthDate, setBirthDate] = useState<Date | null>(null)
  const [sex, setSex] = useState<DogSex | "">("")
  const [nameError, setNameError] = useState<string>()
  const [photoError, setPhotoError] = useState<string>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    if (existingDog) {
      setName(existingDog.name)
      setBreed(existingDog.breed ?? "")
      setBirthDate(fromISODate(existingDog.birthDate))
      setSex(existingDog.sex ?? "")
    }
  }, [existingDog])

  const createDog = useCreateDog(userId)
  const updateDog = useUpdateDog(userId)
  const removeDog = useRemoveDog(userId)
  const updateDogPhoto = useUpdateDogPhoto(userId)
  const removeDogPhoto = useRemoveDogPhoto(userId)

  const submitting = createDog.isPending || updateDog.isPending
  const canDelete = existingDog?.myRole === "owner"

  async function handleChangePhoto() {
    if (!isEditing || !dogId) return
    setPhotoError(undefined)

    const photo = await pickPhoto()
    if (!photo) return

    try {
      const outcome = await updateDogPhoto.mutateAsync({
        id: dogId,
        file: { uri: photo.uri, mimeType: photo.mimeType ?? "image/jpeg", sizeBytes: photo.fileSize ?? 0 },
      })
      if (!outcome.success) setPhotoError(PHOTO_ERROR_MESSAGE[outcome.reason])
    } catch {
      setPhotoError("Un problème est survenu. Réessaie dans quelques instants.")
    }
  }

  function handleRemovePhoto() {
    if (dogId) removeDogPhoto.mutate(dogId)
  }

  async function handleSubmit() {
    setNameError(undefined)
    const input = { name, breed: breed.trim() || null, birthDate: birthDate ? toISODate(birthDate) : null, sex: sex || null }

    if (isEditing && dogId) {
      const result = await updateDog.mutateAsync({ id: dogId, input })
      if (!result.success) {
        setNameError(ERROR_MESSAGE[result.reason])
        return
      }
    } else {
      const result = await createDog.mutateAsync(input)
      if (!result.success) {
        setNameError(ERROR_MESSAGE[result.reason])
        return
      }
    }
    router.back()
  }

  async function handleRemoveDog() {
    if (!dogId) return
    setDeleteDialogOpen(false)
    await removeDog.mutateAsync(dogId)
    router.back()
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScreenHeader title={isEditing ? "Modifier la fiche" : "Nouveau chien"} onBack={() => router.back()} />

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <YStack flex={1} padding="$5" gap="$5">
          {isEditing ? (
            <YStack alignItems="center" gap="$3">
              <YStack
                width={104}
                height={104}
                borderRadius="$round"
                backgroundColor="$accentSoft"
                alignItems="center"
                justifyContent="center"
                overflow="hidden"
                onPress={handleChangePhoto}
                accessibilityRole="button"
                accessibilityLabel="Changer la photo du chien"
              >
                {existingDog?.photoUrl ? (
                  <Image source={{ uri: existingDog.photoUrl }} style={{ width: 104, height: 104 }} />
                ) : (
                  <Body fontSize={34} lineHeight={40}>
                    ＋
                  </Body>
                )}
              </YStack>
              {existingDog?.photoUrl ? (
                <Body
                  size="sm"
                  tone="accent"
                  fontWeight="700"
                  minHeight="$tap"
                  paddingVertical="$2"
                  hitSlop={12}
                  onPress={handleRemovePhoto}
                  accessibilityRole="button"
                >
                  Supprimer la photo
                </Body>
              ) : null}
              {photoError ? (
                <Body size="sm" color="$danger" textAlign="center" fontWeight="700">
                  {photoError}
                </Body>
              ) : null}
            </YStack>
          ) : (
            <Body size="sm" tone="subtle">
              Tu pourras ajouter une photo une fois la fiche créée.
            </Body>
          )}

          <TextField
            label="Nom"
            value={name}
            onChangeText={setName}
            state={nameError ? "error" : "default"}
            helper={nameError}
          />
          <TextField label="Race (optionnel)" value={breed} onChangeText={setBreed} />
          <DateField label="Date de naissance (optionnel)" value={birthDate} onChange={setBirthDate} maximumDate={new Date()} compact />

          <YStack gap="$2">
            <Label>Sexe (optionnel)</Label>
            <ChoiceChipGroup options={SEX_OPTIONS} value={sex} onChange={setSex} />
          </YStack>

          <Button size="md" disabled={!name || submitting} loading={submitting} onPress={handleSubmit}>
            {isEditing ? "Enregistrer" : "Créer la fiche"}
          </Button>

          {isEditing && dogId ? <CoOwnersSection dogId={dogId} userId={userId} canManage={!!canDelete} /> : null}

          {isEditing && canDelete ? (
            <Body
              size="sm"
              tone="subtle"
              textAlign="center"
              fontWeight="700"
              minHeight="$tap"
              paddingVertical="$2"
              hitSlop={12}
              onPress={() => setDeleteDialogOpen(true)}
              accessibilityRole="button"
            >
              Supprimer ce chien
            </Body>
          ) : null}
        </YStack>
      </ScrollView>

      {existingDog ? (
        <ConfirmDialog
          open={deleteDialogOpen}
          title="Supprimer ce chien ?"
          message={deleteDogMessage(existingDog)}
          confirmLabel="Supprimer"
          onConfirm={handleRemoveDog}
          onCancel={() => setDeleteDialogOpen(false)}
        />
      ) : null}
    </YStack>
  )
}
