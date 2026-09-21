import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { Alert, ScrollView } from "react-native"
import { XStack, YStack } from "tamagui"

import { useSession } from "@/account/presentation/providers/session-provider"
import { useFriends } from "@/friend/presentation/hooks/use-friends"
import { Avatar, Body, Button, ChoiceChipGroup, DateField, Label, ScreenHeader, TextField } from "@/shared/ui"
import { durationOptions } from "@/shared/ui/mocks"
import { useUpdateWalk } from "../hooks/use-walk-mutations"
import { useWalk } from "../hooks/use-walks"

const ERROR_MESSAGE = {
  location_required: "Le lieu est obligatoire",
  start_time_past: "L'heure de départ doit être dans le futur",
} as const

function combineDateAndTime(date: Date, time: Date): Date {
  const combined = new Date(date)
  combined.setHours(time.getHours(), time.getMinutes(), 0, 0)
  return combined
}

function toggle(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((existing) => existing !== id) : [...ids, id]
}

/** Pre-filled variant of the create form — reprogramming, not a plain edit: changing the
 * lieu/heure/durée resets every non-pending RSVP to "pending" server-side (see
 * modele-de-donnees.md "Modification d'une balade déjà envoyée"), so the warning banner below
 * isn't optional copy, it's the one thing the organizer must know before saving. No dog picker
 * here — confirmed dogs are left untouched by the reset, there's nothing to re-select; only
 * the RSVP itself needs re-confirming, through the normal flow on WalkDetailScreen. Existing
 * participants can't be removed from this screen (see walk.docs.md "Reprogrammation d'une
 * balade" — uninviting a single participant is deferred, see roadmap.md). */
export function WalkEditScreen({ walkId }: { walkId: string }) {
  const router = useRouter()
  const { session } = useSession()
  const userId = session?.user.id
  const walkQuery = useWalk(walkId)
  const { data: walk } = walkQuery
  const { data: friends } = useFriends(userId)
  const updateWalk = useUpdateWalk(userId, walkId)

  const [locationText, setLocationText] = useState("")
  const [date, setDate] = useState(() => new Date())
  const [time, setTime] = useState(() => new Date())
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [newFriendIds, setNewFriendIds] = useState<string[]>([])

  useEffect(() => {
    if (walk) {
      setLocationText(walk.locationText)
      setDate(new Date(walk.startTime))
      setTime(new Date(walk.startTime))
      setDurationMinutes(walk.durationMinutes)
    }
  }, [walk])

  if (!walk) return null

  const alreadyInvitedIds = new Set(walk.participants.map((p) => p.id))
  const invitableFriends = (friends ?? []).filter((friend) => !alreadyInvitedIds.has(friend.id))

  const result = updateWalk.data
  const errorMessage = result && !result.success ? ERROR_MESSAGE[result.reason] : undefined
  const missing = [!locationText.trim() && "le lieu"].filter((field): field is string => !!field)
  const canSubmit = missing.length === 0

  async function handleSubmit() {
    try {
      const outcome = await updateWalk.mutateAsync({
        locationText,
        startTime: combineDateAndTime(date, time).toISOString(),
        durationMinutes,
        newFriendIds,
      })
      if (outcome.success) router.replace(`/walks/${walkId}`)
    } catch {
      // E.g. the walk started between opening this screen and saving — RLS refuses the
      // update server-side (walks_update_organizer_future_only).
      Alert.alert("Un problème est survenu. Réessaie dans quelques instants.")
    }
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScreenHeader
        title="Modifier la balade"
        rightSlot={
          <Body
            fontSize={20}
            fontWeight="700"
            color="$colorSubtle"
            onPress={() => router.back()}
            minHeight="$tap"
            minWidth="$tap"
            textAlign="center"
            hitSlop={12}
          >
            ✕
          </Body>
        }
      />

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <YStack flex={1} padding="$5" gap="$5">
          <YStack backgroundColor="$warningSoft" borderRadius="$4" padding="$3">
            <Body size="sm" fontWeight="700" color="$warningSoftText">
              ⚠️ Modifier le lieu, l'heure ou la durée réinitialise les réponses de tous les participants (y compris les tiennes) — chacun devra
              re-répondre. Les chiens déjà confirmés restent confirmés, pas besoin de les re-sélectionner.
            </Body>
          </YStack>

          <TextField label="Où ?" placeholder="📍 Nom du lieu" value={locationText} onChangeText={setLocationText} />

          <XStack gap="$3">
            <YStack flex={1}>
              <DateField label="Jour" mode="date" compact value={date} onChange={setDate} minimumDate={new Date()} />
            </YStack>
            <YStack flex={1}>
              <DateField label="Départ" mode="time" compact value={time} onChange={setTime} />
            </YStack>
          </XStack>

          <YStack gap="$2">
            <Label>Durée</Label>
            <ChoiceChipGroup
              options={durationOptions.map((option) => ({ value: option.minutes, label: option.label }))}
              value={durationMinutes}
              onChange={setDurationMinutes}
            />
          </YStack>

          <YStack gap="$3">
            <XStack alignItems="center" justifyContent="space-between">
              <Label>Inviter d'autres amis</Label>
              {newFriendIds.length > 0 ? (
                <Body size="sm" fontWeight="800" tone="accent">
                  {newFriendIds.length} sélectionné{newFriendIds.length > 1 ? "s" : ""}
                </Body>
              ) : null}
            </XStack>
            {invitableFriends.length > 0 ? (
              <XStack gap="$4" flexWrap="wrap">
                {invitableFriends.map((friend) => {
                  const selected = newFriendIds.includes(friend.id)
                  return (
                    <YStack key={friend.id} alignItems="center" gap="$2" width={64} onPress={() => setNewFriendIds((ids) => toggle(ids, friend.id))}>
                      <YStack position="relative">
                        <Avatar
                          friend={{ id: friend.id, username: friend.username, avatarUrl: friend.avatarUrl ?? undefined }}
                          size="lg"
                          tone={selected ? undefined : "muted"}
                          opacity={selected ? 1 : 0.5}
                        />
                        {selected ? (
                          <YStack
                            position="absolute"
                            bottom={-2}
                            right={-2}
                            width={20}
                            height={20}
                            borderRadius="$round"
                            borderWidth={2}
                            borderColor="$backgroundStrong"
                            backgroundColor="$success"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Body fontSize={11} lineHeight={11} fontWeight="800" color="$colorInverse">
                              ✓
                            </Body>
                          </YStack>
                        ) : null}
                      </YStack>
                      <Body size="xs" fontWeight="700" color={selected ? "$color" : "$colorFaint"} numberOfLines={1}>
                        {friend.username}
                      </Body>
                    </YStack>
                  )
                })}
              </XStack>
            ) : (
              <Body size="sm" tone="subtle">
                {friends && friends.length > 0 ? "Tous tes amis sont déjà invités." : "Tu n'as pas encore d'ami à inviter."}
              </Body>
            )}
          </YStack>

          <YStack flex={1} justifyContent="flex-end" gap="$3">
            {errorMessage ? (
              <Body size="sm" color="$danger" textAlign="center" fontWeight="700">
                {errorMessage}
              </Body>
            ) : !canSubmit ? (
              <Body size="sm" tone="subtle" textAlign="center" fontWeight="700">
                Renseigne le lieu pour enregistrer
              </Body>
            ) : null}
            <Button size="md" disabled={!canSubmit || updateWalk.isPending} loading={updateWalk.isPending} onPress={handleSubmit}>
              Enregistrer les modifications
            </Button>
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  )
}
