import { Theme, XStack, YStack, styled } from "tamagui"

import { useThemePreference } from "@/shared/providers/theme-preference-provider"

import { themes } from "../themes"
import { type Dog, type Walk, respondents  } from "../types"

import { AvatarStack, Avatar } from "./Avatar"
import { DogPhoto } from "./DogPhoto"
import { IconChevronRight } from "./Icons"
import { Body, Title } from "./Text"
import { WalkMetaLine } from "./WalkMetaLine"

export const Card = styled(YStack, {
  name: "Card",
  backgroundColor: "$backgroundStrong",
  borderRadius: "$5",
  padding: "$4",
  shadowColor: "$shadowColor",
  shadowOpacity: 0.15,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
  variants: {
    interactive: {
      true: {
        cursor: "pointer",
        role: "button",
        transition: "fast",
        pressStyle: { scale: 0.985, backgroundColor: "$backgroundSoft" },
      },
    },
    /** shared household: dashed teal outline, the one dashed border that means "co-owned" */
    shared: {
      true: { borderWidth: 2.5, borderStyle: "dashed", borderColor: "$success" },
    },
    flat: { true: { shadowOpacity: 0, borderWidth: 1, borderColor: "$borderColor" } },
  } as const,
})

export type WalkCardProps = {
  walk: Walk;
  onPress?: (walk: Walk) => void;
  /** true when this card is the front layer of a swipe-to-delete row — see DogCard for why. */
  flat?: boolean;
}

export function WalkCard({ walk, onPress, flat }: WalkCardProps) {
  const yes = respondents(walk, "confirmed")
  return (
    <Card interactive flat={flat} onPress={() => onPress?.(walk)}>
      <Title size="lg">{walk.place}</Title>
      <YStack marginTop="$2">
        <WalkMetaLine startTime={walk.startsAt} durationMinutes={walk.durationMinutes} tone="card" />
      </YStack>
      <XStack alignItems="center" gap="$2" marginTop="$4">
        <AvatarStack friends={yes} max={3} />
        <Body size="sm" tone="subtle">
          {yes.length > 1 ? "ont dit oui" : "a dit oui"}
        </Body>
      </XStack>
    </Card>
  )
}

export type DogCardProps = {
  dog: Dog;
  onPress?: (dog: Dog) => void;
  /** true when this card is the front layer of a swipe-to-delete row — see FriendsScreen's
   * RemoveFriendRow for why a drop shadow there bleeds an ugly halo onto the reveal panel. */
  flat?: boolean;
}

export function DogCard({ dog, onPress, flat }: DogCardProps) {
  const shared = !!dog.sharedWith
  const { resolvedTheme } = useThemePreference()
  const theme = themes[resolvedTheme]
  return (
    <Card interactive flat={flat} shared={shared} onPress={() => onPress?.(dog)} padding="$3">
      <XStack gap="$4" alignItems="center">
        <DogPhoto dog={dog} size="lg" shape="card" />
        <YStack flex={1} gap="$1">
          <Title size="lg">{dog.name}</Title>
          <Body size="sm" tone="subtle">
            {dog.breed} · {dog.ageYears} an{dog.ageYears > 1 ? "s" : ""}
          </Body>
          {shared ? (
            <Theme name="confirmed">
              <XStack
                alignSelf="flex-start"
                alignItems="center"
                gap="$2"
                marginTop="$2"
                backgroundColor="$accentSoft"
                borderRadius="$round"
                paddingHorizontal={10}
                paddingVertical={5}
              >
                <Avatar friend={dog.sharedWith!} size="sm" />
                <Body size="xs" fontWeight="800" color="$accentSoftText">
                  Foyer partagé avec {dog.sharedWith!.username}
                </Body>
              </XStack>
            </Theme>
          ) : null}
        </YStack>
        {shared ? null : <IconChevronRight size={20} color={theme.borderColor} />}
      </XStack>
    </Card>
  )
}
