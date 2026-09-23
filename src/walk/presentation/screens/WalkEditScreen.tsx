import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import { ScrollView } from "react-native"
import { Spinner, XStack, YStack } from "tamagui"

import { useSession } from "@/shared/providers/session-provider"
import { Body, Button, ChoiceChipGroup, CloseButton, DateField, EmptyState, Label, PersonPicker, ScreenHeader, TextField } from "@/shared/ui"
import { durationOptions } from "@/shared/ui/mocks"

import { useFriends } from "../hooks/use-friends"
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
  const { data: walk, isLoading: walkLoading } = walkQuery
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

  if (!walk) {
    return (
      <YStack flex={1} backgroundColor="$background">
        <ScreenHeader title="Modifier la balade" rightSlot={<CloseButton onPress={() => router.back()} />} />
        {walkLoading ? (
          <YStack flex={1} alignItems="center" justifyContent="center">
            <Spinner size="large" color="$accent" />
          </YStack>
        ) : (
          <EmptyState emoji="🤷" title="Balade introuvable" body="Cette balade a peut-être été annulée, ou tu n'y as plus accès." />
        )}
      </YStack>
    )
  }

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
      // update server-side (walks_update_organizer_future_only). Already surfaces the generic
      // fallback alert via the QueryClient's mutationCache.onError (app/_layout.tsx) — this
      // catch only exists so the rejection doesn't bubble up as an unhandled promise rejection.
    }
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScreenHeader
        title="Modifier la balade"
        rightSlot={<CloseButton onPress={() => router.back()} />}
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

          <PersonPicker
            label="Inviter d'autres amis"
            people={invitableFriends.map((friend) => ({ ...friend, avatarUrl: friend.avatarUrl ?? undefined }))}
            selectedIds={newFriendIds}
            onChange={setNewFriendIds}
            emptyLabel={friends && friends.length > 0 ? "Tous tes amis sont déjà invités." : "Tu n'as pas encore d'ami à inviter."}
          />

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
