import { Theme, XStack, YStack, styled } from 'tamagui';
import { Body, Title } from './Text';
import { AvatarStack, Avatar } from './Avatar';
import { DogPhoto } from './DogPhoto';
import { QuotaBadge } from './StatusBadge';
import type { Dog, Walk } from '../types';
import { respondents, confirmedDogs } from '../types';
import { formatWalkDate, formatWalkTime, formatDuration } from '../mocks';

export const Card = styled(YStack, {
  name: 'Card',
  backgroundColor: '$backgroundStrong',
  borderRadius: '$5',
  padding: '$4',
  shadowColor: '$shadowColor',
  shadowOpacity: 0.15,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
  variants: {
    interactive: {
      true: {
        cursor: 'pointer',
        transition: 'fast',
        pressStyle: { scale: 0.985, backgroundColor: '$backgroundSoft' },
      },
    },
    /** shared household: dashed teal outline, the one dashed border that means "co-owned" */
    shared: {
      true: { borderWidth: 2.5, borderStyle: 'dashed', borderColor: '$success' },
    },
    flat: { true: { shadowOpacity: 0, borderWidth: 1, borderColor: '$borderColor' } },
  } as const,
});

export interface WalkCardProps {
  walk: Walk;
  onPress?: (walk: Walk) => void;
}

export function WalkCard({ walk, onPress }: WalkCardProps) {
  const yes = respondents(walk, 'confirmed');
  const dogs = confirmedDogs(walk);
  return (
    <Card interactive onPress={() => onPress?.(walk)}>
      <XStack gap="$3" alignItems="flex-start" justifyContent="space-between">
        <Title size="lg" flex={1}>
          {walk.place}
        </Title>
        <QuotaBadge current={dogs.length} total={walk.dogCapacity} />
      </XStack>
      <Body size="md" fontWeight="700" tone="accent" marginTop="$1">
        {formatWalkDate(walk.startsAt)} · {formatWalkTime(walk.startsAt)} ·{' '}
        {formatDuration(walk.durationMinutes)}
      </Body>
      <XStack alignItems="center" gap="$2" marginTop="$4">
        <AvatarStack friends={yes} max={3} />
        <Body size="sm" tone="subtle">
          {yes.length > 1 ? 'ont dit oui' : 'a dit oui'}
        </Body>
      </XStack>
    </Card>
  );
}

export interface DogCardProps {
  dog: Dog;
  onPress?: (dog: Dog) => void;
  /** true when this card is the front layer of a swipe-to-delete row — see FriendsScreen's
   * RemoveFriendRow for why a drop shadow there bleeds an ugly halo onto the reveal panel. */
  flat?: boolean;
}

export function DogCard({ dog, onPress, flat }: DogCardProps) {
  const shared = !!dog.sharedWith;
  return (
    <Card interactive flat={flat} shared={shared} onPress={() => onPress?.(dog)} padding="$3">
      <XStack gap="$4" alignItems="center">
        <DogPhoto dog={dog} size="lg" shape="card" />
        <YStack flex={1} gap="$1">
          <Title size="lg">{dog.name}</Title>
          <Body size="sm" tone="subtle">
            {dog.breed} · {dog.ageYears} an{dog.ageYears > 1 ? 's' : ''}
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
        {shared ? null : (
          <Body size="lg" color="$borderColor" fontWeight="800">
            ›
          </Body>
        )}
      </XStack>
    </Card>
  );
}
