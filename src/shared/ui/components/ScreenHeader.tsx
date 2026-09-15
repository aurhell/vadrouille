import { XStack, YStack, styled } from 'tamagui';
import { Body, Display } from './Text';

const Frame = styled(YStack, {
  name: 'ScreenHeader',
  paddingHorizontal: '$5',
  paddingTop: '$4',
  paddingBottom: '$3',
  variants: {
    /** accent = coloured header block (walk detail, onboarding) */
    tone: {
      plain: { backgroundColor: 'transparent' },
      accent: { backgroundColor: '$accent', paddingBottom: '$6' },
    },
  } as const,
  defaultVariants: { tone: 'plain' },
});

export interface ScreenHeaderProps extends React.ComponentProps<typeof Frame> {
  title: string;
  subtitle?: string;
  /** renders a "‹ Retour" affordance */
  onBack?: () => void;
  /** named rightSlot (not `right`) — that name collides with the positioning style prop */
  rightSlot?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, onBack, rightSlot, ...props }: ScreenHeaderProps) {
  const accent = props.tone === 'accent';
  return (
    <Frame {...props}>
      {onBack ? (
        <Body
          size="sm"
          fontWeight="800"
          marginBottom="$3"
          opacity={0.85}
          color={accent ? '$accentText' : '$colorSubtle'}
          onPress={onBack}
          hitSlop={12}
        >
          ‹ Retour
        </Body>
      ) : null}
      <XStack alignItems="flex-end" justifyContent="space-between" gap="$3">
        <YStack flex={1} gap="$1">
          <Display size={accent ? 'sm' : 'md'} color={accent ? '$accentText' : '$color'}>
            {title}
          </Display>
          {subtitle ? (
            <Body
              size="md"
              fontWeight="700"
              color={accent ? '$accentText' : '$colorSubtle'}
              opacity={accent ? 0.92 : 1}
            >
              {subtitle}
            </Body>
          ) : null}
        </YStack>
        {rightSlot ? <YStack>{rightSlot}</YStack> : null}
      </XStack>
    </Frame>
  );
}

export const ScreenHeaderFrame = Frame;
