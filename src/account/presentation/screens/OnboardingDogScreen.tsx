import { useRouter } from "expo-router"
import { useState } from "react"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { YStack } from "tamagui"

import { useSession } from "@/shared/providers/session-provider"
import { Body, Button, Display, TextField } from "@/shared/ui"

import { useCreateDog } from "../hooks/use-create-dog"

const ERROR_MESSAGE = {
  required: "Le nom est obligatoire",
} as const

export function OnboardingDogScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { session } = useSession()
  const [name, setName] = useState("")
  const createDog = useCreateDog(session?.user.id)

  const result = createDog.data
  const errorMessage = result && !result.success ? ERROR_MESSAGE[result.reason] : undefined

  async function handleCreate() {
    const outcome = await createDog.mutateAsync({ name, breed: null, birthDate: null, sex: null })
    if (!outcome.success) return
    router.replace("/")
  }

  function handleSkip() {
    router.replace("/")
  }

  return (
    <YStack flex={1} backgroundColor="$accent">
      <YStack paddingHorizontal="$6" paddingTop="$9" paddingBottom="$6" gap="$3">
        <Body fontSize={30} lineHeight={41}>
          🐾
        </Body>
        <Display size="lg" color="$accentText">
          Un premier chien ?
        </Display>
        <Body size="lg" color="$accentText" opacity={0.95}>
          Ajoute la fiche de ton chien pour pouvoir l'inscrire à des balades. Tu pourras compléter le reste (race, photo...) plus tard.
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
        <TextField
          large
          label="Nom du chien"
          placeholder="Rex"
          value={name}
          onChangeText={setName}
          state={errorMessage ? "error" : name ? "filled" : "default"}
          helper={errorMessage}
        />

        <YStack flex={1} justifyContent="flex-end" gap="$3">
          <Button full disabled={!name || createDog.isPending} loading={createDog.isPending} onPress={handleCreate}>
            Ajouter mon chien
          </Button>
          <Body
            size="sm"
            tone="subtle"
            textAlign="center"
            fontWeight="700"
            minHeight="$tap"
            paddingVertical="$2"
            hitSlop={12}
            onPress={handleSkip}
            accessibilityRole="button"
          >
            Plus tard
          </Body>
        </YStack>
      </YStack>
    </YStack>
  )
}
