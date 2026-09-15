import { YStack } from 'tamagui';
import { Body, Display } from './Text';
import { Button } from './Button';

export interface EmptyStateProps {
  emoji?: string;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Empty is an invitation, not an error: big friendly mark, one clear action. */
export function EmptyState({
  emoji = '🦮',
  title,
  body,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" gap="$5" padding="$7">
      <YStack
        width={132}
        height={132}
        borderRadius="$round"
        backgroundColor="$accentSoft"
        alignItems="center"
        justifyContent="center"
      >
        <Body fontSize={58} lineHeight={66}>
          {emoji}
        </Body>
      </YStack>
      <Display size="sm" textAlign="center">
        {title}
      </Display>
      <Body size="lg" tone="subtle" textAlign="center">
        {body}
      </Body>
      {actionLabel ? (
        <Button onPress={onAction} icon={<Body fontSize={18} color="$accentText">＋</Body>}>
          {actionLabel}
        </Button>
      ) : null}
    </YStack>
  );
}
