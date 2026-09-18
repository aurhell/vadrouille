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
  // Compact pickers (see DateField) always render a concrete value — there's no "unselected"
  // look for them, unlike the old placeholder-text row — so these default to a real value
  // (an hour out) instead of null, and aren't part of the missing-fields message below.
  const [date, setDate] = useState(() => new Date())
  const [time, setTime] = useState(() => new Date(Date.now() + 60 * 60 * 1000))
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [dogIds, setDogIds] = useState<string[]>([])
  const [friendIds, setFriendIds] = useState<string[]>([])

  const result = createWalk.data
  const errorMessage = result && !result.success ? ERROR_MESSAGE[result.reason] : undefined
  const missing = [!locationText.trim() && "le lieu"].filter((field): field is string => !!field)
  const canSubmit = missing.length === 0

  async function handleSubmit() {
    const outcome = await createWalk.mutateAsync({
      locationText,
      startTime: combineDateAndTime(date, time).toISOString(),
      durationMinutes,
      dogIds,
      friendIds,
    })
    if (outcome.success) router.replace("/")
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScreenHeader
        title="Nouvelle balade"
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
          <TextField label="Où ?" placeholder="📍 Nom du lieu" value={locationText} onChangeText={setLocationText} />

          {/* Compact native pills, not the full inline spinner: side by side, the spinner
           * would otherwise clip against the half-width column (see DateField). */}
          <XStack gap="$3">
            <YStack flex={1}>
              <DateField label="Départ" mode="time" compact value={time} onChange={setTime} />
            </YStack>
            <YStack flex={1}>
              <DateField label="Jour" mode="date" compact value={date} onChange={setDate} minimumDate={new Date()} />
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
              <Label>Qui on invite ?</Label>
              {friendIds.length > 0 ? (
                <Body size="sm" fontWeight="800" tone="accent">
                  {friendIds.length} sélectionné{friendIds.length > 1 ? "s" : ""}
                </Body>
              ) : null}
            </XStack>
            {friends && friends.length > 0 ? (
              <XStack gap="$4" flexWrap="wrap">
                {friends.map((friend) => {
                  const selected = friendIds.includes(friend.id)
                  return (
                    <YStack key={friend.id} alignItems="center" gap="$2" width={64} onPress={() => setFriendIds((ids) => toggle(ids, friend.id))}>
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
                Tu n'as pas encore d'ami à inviter.
              </Body>
            )}
          </YStack>

          <YStack gap="$2">
            <Label>J'emmène</Label>
            {dogs && dogs.length > 0 ? (
              dogs.map((dog) => {
                const selected = dogIds.includes(dog.id)
                return (
                  <XStack
                    key={dog.id}
                    alignItems="center"
                    gap="$3"
                    minHeight="$tap"
                    backgroundColor="$backgroundStrong"
                    borderRadius="$5"
                    borderWidth={2}
                    borderColor={selected ? "$success" : "transparent"}
                    padding="$3"
                    onPress={() => setDogIds((ids) => toggle(ids, dog.id))}
                  >
                    <DogPhoto dog={{ id: dog.id, name: dog.name, breed: dog.breed ?? "", ageYears: 0, photoUrl: dog.photoUrl ?? undefined }} size="sm" />
                    <Body flex={1} fontWeight="700">
                      {dog.name}
                    </Body>
                    <YStack
                      width={22}
                      height={22}
                      borderRadius="$round"
                      borderWidth={selected ? 0 : 2}
                      borderColor="$borderColor"
                      backgroundColor={selected ? "$success" : "transparent"}
                      alignItems="center"
                      justifyContent="center"
                    >
                      {selected ? (
                        <Body fontSize={12} lineHeight={12} fontWeight="800" color="$colorInverse">
                          ✓
                        </Body>
                      ) : null}
                    </YStack>
                  </XStack>
                )
              })
            ) : (
              <Body size="sm" tone="subtle">
                Tu n'as pas encore de chien — tu peux quand même créer la balade.
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
              Proposer la balade 🐾
            </Button>
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  )
}
