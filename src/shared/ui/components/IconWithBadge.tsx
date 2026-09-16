import type { ReactNode } from 'react';
import { YStack } from 'tamagui';
import { NotificationBadge } from './NotificationBadge';

export interface IconWithBadgeProps {
  count: number;
  children: ReactNode;
}

/** Wraps a tab/nav icon with a `NotificationBadge` pinned to its top-right corner — the
 * reusable pairing behind "Amis" (pending friend requests today, unanswered walk invites
 * later). */
export function IconWithBadge({ count, children }: IconWithBadgeProps) {
  return (
    <YStack>
      {children}
      <NotificationBadge count={count} />
    </YStack>
  );
}
