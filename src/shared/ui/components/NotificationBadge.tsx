import { YStack } from 'tamagui';
import { Body } from './Text';

export interface NotificationBadgeProps {
  /** Renders nothing when 0 or less — a badge only ever announces something pending. */
  count: number;
  /** Above this, show "max+" instead of the exact number (a tab icon has no room for "128"). */
  max?: number;
}

/** Small numeric pill, meant to sit absolutely-positioned over an icon — see `IconWithBadge`. */
export function NotificationBadge({ count, max = 9 }: NotificationBadgeProps) {
  if (count <= 0) return null;
  const label = count > max ? `${max}+` : String(count);

  return (
    <YStack
      position="absolute"
      top={-4}
      right={-8}
      minWidth={16}
      height={16}
      paddingHorizontal={4}
      borderRadius="$round"
      backgroundColor="$danger"
      alignItems="center"
      justifyContent="center"
    >
      <Body size="xs" fontWeight="800" color="$colorInverse" numberOfLines={1} lineHeight={14}>
        {label}
      </Body>
    </YStack>
  );
}
