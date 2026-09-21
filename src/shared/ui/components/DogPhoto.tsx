import { Svg, Circle } from 'react-native-svg';
import { Image, YStack, styled } from 'tamagui';
import { useThemePreference } from '@/shared/providers/theme-preference-provider';
import { Body } from './Text';
import type { Dog } from '../types';

const Frame = styled(YStack, {
  name: 'DogPhoto',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  backgroundColor: '$backgroundMuted',
  variants: {
    size: {
      sm: { width: '$dogSm', height: '$dogSm' },
      md: { width: '$dogMd', height: '$dogMd' },
      lg: { width: '$dogLg', height: '$dogLg' },
    },
    shape: {
      /** round = inside a walk (a face in a crowd) */
      round: { borderRadius: '$round', borderWidth: 3, borderColor: '$warning' },
      /** rounded square = a dog record you can open */
      card: { borderRadius: '$4', borderWidth: 0 },
    },
    /** Dims the plain border so the dashed ring (see DASH_SIZE below) reads as the only ring —
     * RN can't render a dashed border on a round YStack (dashes only draw on straight edges),
     * so the ring is a separate absolutely-positioned Svg circle instead. */
    dashed: { true: { borderColor: 'transparent' } },
  } as const,
  defaultVariants: { size: 'md', shape: 'round' },
});

const DASH_SIZE: Record<'sm' | 'md' | 'lg', number> = { sm: 40, md: 56, lg: 70 };
const TEAL = { light: '#3FBFA8', dark: '#4FD2B8' };

export interface DogPhotoProps extends React.ComponentProps<typeof Frame> {
  dog: Dog;
  showName?: boolean;
  /** Shared dog, not yet confirmed for this walk — dashed teal ring instead of the default
   * solid one, so the "someone in your household can also bring this dog" fact stays legible
   * without a separate label (see WalkDetailScreen's DogPill). */
  dashed?: boolean;
  /** Green checkmark badge, bottom-right — same selection affordance as the friend picker
   * (see WalkFormScreen), instead of a coloured ring around the photo. */
  checked?: boolean;
}

export function DogPhoto({ dog, showName, dashed, checked, ...props }: DogPhotoProps) {
  const { resolvedTheme } = useThemePreference();
  const size = (props.size ?? 'md') as 'sm' | 'md' | 'lg';
  const diameter = DASH_SIZE[size];
  const radius = diameter / 2 - 1.5;
  return (
    <YStack alignItems="center" gap="$2">
      <YStack position="relative" width={diameter} height={diameter}>
        <Frame {...props} dashed={dashed}>
          {dog.photoUrl ? (
            <Image source={{ uri: dog.photoUrl }} width="100%" height="100%" />
          ) : (
            <Body size="xs" tone="subtle" fontWeight="700">
              {dog.name.slice(0, 1)}
            </Body>
          )}
        </Frame>
        {dashed ? (
          <Svg width={diameter} height={diameter} style={{ position: 'absolute', top: 0, left: 0 }}>
            <Circle
              cx={diameter / 2}
              cy={diameter / 2}
              r={radius}
              fill="none"
              stroke={TEAL[resolvedTheme]}
              strokeWidth={2}
              strokeDasharray="4,3"
            />
          </Svg>
        ) : null}
        {checked ? (
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
      {showName ? (
        <Body size="xs" fontWeight="700">
          {dog.name}
        </Body>
      ) : null}
    </YStack>
  );
}

export const DogPhotoFrame = Frame;
