import { XStack } from "tamagui"

import { Button } from "./Button"
import { Card } from "./Card"
import { PersonRow } from "./PersonRow"

import type { Friend } from "../types"
import type { ReactNode } from "react"

export type InviteRequestCardProps = {
  person: Friend;
  /** overrides PersonRow's default "username" text — see PersonRow's `label` prop */
  label?: ReactNode;
  secondaryLabel: string;
  onSecondary: () => void;
  secondaryDisabled?: boolean;
  /** omit for a single-button card (e.g. "Retirer l'invitation" on a sent request) — present
   * for a two-button accept/decline card (a received request). */
  primaryLabel?: string;
  onPrimary?: () => void;
  primaryDisabled?: boolean;
}

/** A pending invite/request as a card: avatar + text, one or two action buttons below — friend
 * requests and co-owner invites, received or sent (see FriendsScreen, MyDogsScreen,
 * DogFormScreen). Two buttons (secondary + primary, both flex) for a received request the
 * other person can accept/decline; one (secondary, not flex) for a sent request only I can
 * cancel. */
export function InviteRequestCard({
  person,
  label,
  secondaryLabel,
  onSecondary,
  secondaryDisabled,
  primaryLabel,
  onPrimary,
  primaryDisabled,
}: InviteRequestCardProps) {
  return (
    <Card gap="$3">
      <PersonRow person={person} label={label} />
      <XStack gap="$3">
        <Button variant="secondary" size="sm" flex={primaryLabel ? 1 : undefined} disabled={secondaryDisabled} onPress={onSecondary}>
          {secondaryLabel}
        </Button>
        {primaryLabel ? (
          <Button size="sm" flex={1} disabled={primaryDisabled} onPress={onPrimary}>
            {primaryLabel}
          </Button>
        ) : null}
      </XStack>
    </Card>
  )
}
