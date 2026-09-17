import { useRouter } from "expo-router"
import { useState } from "react"
import { ScrollView } from "react-native"
import { XStack, YStack } from "tamagui"

import { useSession } from "@/account/presentation/providers/session-provider"
import { useDogs } from "@/dog/presentation/hooks/use-dogs"
import { useFriends } from "@/friend/presentation/hooks/use-friends"
import { Avatar, Body, Button, ChoiceChipGroup, DateField, DogPhoto, Label, ScreenHeader, TextField } from "@/shared/ui"
import { durationOptions } from "@/shared/ui/mocks"
import { useCreateWalk } from "../hooks/use-walk-mutations"

const ERROR_MESSAGE = {
  location_required: "Le lieu est obligatoire",
  start_time_past: "L'heure de départ doit être dans le futur",
  too_many_dogs: "Maximum 10 chiens par balade",
} as const

function combineDateAndTime(date: Date, time: Date): Date {
  const combined = new Date(date)
  combined.setHours(time.getHours(), time.getMinutes(), 0, 0)
  return combined
}

function toggle(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((existing) => existing !== id) : [...ids, id]
}

/** Tells the user what's still missing instead of leaving them to guess why the submit
 * button is disabled — see WalkFormScreen's required fields (lieu, date, heure). */
function missingFieldsMessage(missing: string[]): string | undefined {
  if (missing.length === 0) return undefined
  const joined = missing.length === 1 ? missing[0] : `${missing.slice(0, -1).join(", ")} et ${missing[missing.length - 1]}`
  return `Renseigne ${joined} pour créer la balade`
}

export function WalkFormScreen() {
  const router = useRouter()
  const { session } = useSession()
  const userId = session?.user.id
  const { data: dogs } = useDogs(userId)
  const { data: friends } = useFriends(userId)
  const createWalk = useCreateWalk(userId)

  const [locationText, setLocationText] = useState("")
  const [date, setDate] = useState<Date | null>(null)
  const [time, setTime] = useState<Date | null>(null)
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [dogIds, setDogIds] = useState<string[]>([])
  const [friendIds, setFriendIds] = useState<string[]>([])

  const result = createWalk.data
  const errorMessage = result && !result.success ? ERROR_MESSAGE[result.reason] : undefined
  const missing = [
    !locationText.trim() && "le lieu",
    !date && "la date",
    !time && "l'heure",
  ].filter((field): field is string => !!field)
  const canSubmit = missing.length === 0

  async function handleSubmit() {
    if (!date || !time) return
    const outcome = await createWalk.mutateAsync({
      locationText,
      startTime: combineDateAndTime(date, time).toISOString(),
      durationMinutes,
      dogIds,
      friendIds,
    })
    if (outcome.success) router.replace("/walks")
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScreenHeader title="Nouvelle balade" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <YStack flex={1} padding="$5" gap="$5">
          <TextField label="Lieu" placeholder="Parc de la Tête d'Or" value={locationText} onChangeText={setLocationText} />

          {/* Stacked, not side by side: iOS's inline time spinner has two columns
           * (heures/minutes) and needs full width to render without clipping. */}
          <DateField label="Date" value={date} onChange={setDate} minimumDate={new Date()} />
          <DateField label="Heure" mode="time" value={time} onChange={setTime} />

          <YStack gap="$2">
            <Label>Durée</Label>
            <ChoiceChipGroup
              options={durationOptions.map((option) => ({ value: option.minutes, label: option.label }))}
              value={durationMinutes}
              onChange={setDurationMinutes}
            />
          </YStack>

          <YStack gap="$2">
            <Label>Mes chiens (optionnel)</Label>
            {dogs && dogs.length > 0 ? (
              dogs.map((dog) => (
                <XStack key={dog.id} alignItems="center" gap="$3" minHeight="$tap" onPress={() => setDogIds((ids) => toggle(ids, dog.id))}>
                  <DogPhoto dog={{ id: dog.id, name: dog.name, breed: dog.breed ?? "", ageYears: 0, photoUrl: dog.photoUrl ?? undefined }} size="sm" />
                  <Body flex={1} fontWeight="700">
                    {dog.name}
                  </Body>
                  {dogIds.includes(dog.id) ? (
                    <Body fontWeight="800" tone="accent">
                      ✓
                    </Body>
                  ) : null}
                </XStack>
              ))
            ) : (
              <Body size="sm" tone="subtle">
                Tu n'as pas encore de chien — tu peux quand même créer la balade.
              </Body>
            )}
          </YStack>

          <YStack gap="$2">
            <Label>Inviter des amis (optionnel)</Label>
            {friends && friends.length > 0 ? (
              friends.map((friend) => (
                <XStack
                  key={friend.id}
                  alignItems="center"
                  gap="$3"
                  minHeight="$tap"
                  onPress={() => setFriendIds((ids) => toggle(ids, friend.id))}
                >
                  <Avatar friend={{ id: friend.id, username: friend.username, avatarUrl: friend.avatarUrl ?? undefined }} size="sm" />
                  <Body flex={1} fontWeight="700">
                    {friend.username}
                  </Body>
                  {friendIds.includes(friend.id) ? (
                    <Body fontWeight="800" tone="accent">
                      ✓
                    </Body>
                  ) : null}
                </XStack>
              ))
            ) : (
              <Body size="sm" tone="subtle">
                Tu n'as pas encore d'ami à inviter.
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
                {missingFieldsMessage(missing)}
              </Body>
            ) : null}
            <Button size="md" disabled={!canSubmit || createWalk.isPending} loading={createWalk.isPending} onPress={handleSubmit}>
              Créer la balade
            </Button>
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  )
}
