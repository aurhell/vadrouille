import { XStack } from "tamagui"

import { Avatar, type AvatarProps } from "./Avatar"
import { Body } from "./Text"

import type { Friend } from "../types"
import type { ReactNode } from "react"

export type PersonRowProps = {
  person: Friend;
  avatarSize?: AvatarProps["size"];
  /** Overrides the name text — e.g. "toi", "X — en attente", "X te propose de co-gérer Y".
   * Defaults to the person's username. */
  label?: ReactNode;
  /** Appended right after the name (label or username), same line (e.g. " · 2 chiens"). */
  suffix?: ReactNode;
  /** Rendered at the row's end, e.g. a StatusBadge. */
  trailing?: ReactNode;
  onPress?: () => void;
}

/** Avatar + name row — participants, friends, co-owners, invites (see WalkDetailScreen,
 * FriendsScreen, DogFormScreen, MyDogsScreen). One line, `minHeight="$tap"` so it's a valid
 * tap target whenever `onPress` is set. */
export function PersonRow({ person, avatarSize = "sm", label, suffix, trailing, onPress }: PersonRowProps) {
  return (
    <XStack alignItems="center" gap="$3" minHeight="$tap" onPress={onPress}>
      <Avatar friend={person} size={avatarSize} />
      <Body flex={1} fontWeight="700">
        {label ?? person.username}
        {suffix}
      </Body>
      {trailing}
    </XStack>
  )
}
