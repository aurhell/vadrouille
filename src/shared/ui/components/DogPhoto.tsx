import { Image, YStack, styled } from 'tamagui';
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
    selected: { true: { borderWidth: 2, borderColor: '$success' } },
  } as const,
  defaultVariants: { size: 'md', shape: 'round' },
});

export interface DogPhotoProps extends React.ComponentProps<typeof Frame> {
  dog: Dog;
  showName?: boolean;
}

export function DogPhoto({ dog, showName, ...props }: DogPhotoProps) {
  return (
    <YStack alignItems="center" gap="$2">
      <Frame {...props}>
        {dog.photoUrl ? (
          <Image source={{ uri: dog.photoUrl }} width="100%" height="100%" />
        ) : (
          <Body size="xs" tone="subtle" fontWeight="700">
            {dog.name.slice(0, 1)}
          </Body>
        )}
      </Frame>
      {showName ? (
        <Body size="xs" fontWeight="700">
          {dog.name}
        </Body>
      ) : null}
    </YStack>
  );
}

export const DogPhotoFrame = Frame;
