import { Theme, XStack, YStack } from 'tamagui';
import { Body, Title } from './Text';

export interface QuotaBarProps {
  current: number;
  total: number;
  label?: string;
}

/** Dog capacity meter. Pairs with QuotaBadge; never used alone as the only cue. */
export function QuotaBar({ current, total, label = 'Chiens confirmés' }: QuotaBarProps) {
  const pct = total === 0 ? 0 : Math.min(1, current / total);
  return (
    <YStack gap="$3">
      <XStack alignItems="center" justifyContent="space-between">
        <Title size="md">{label}</Title>
        <Theme name="confirmed">
          <Body size="sm" fontWeight="800" color="$accentSoftText">
            {current}/{total}
          </Body>
        </Theme>
      </XStack>
      <YStack height={9} borderRadius="$round" backgroundColor="$backgroundMuted" overflow="hidden">
        <Theme name="confirmed">
          <YStack
            height={9}
            borderRadius="$round"
            backgroundColor="$accent"
            width={(pct * 100 + '%') as any}
            transition="medium"
          />
        </Theme>
      </YStack>
    </YStack>
  );
}
