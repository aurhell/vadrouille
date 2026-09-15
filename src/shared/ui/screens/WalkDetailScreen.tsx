import { ScrollView, XStack, YStack } from 'tamagui';
import {
  Avatar,
  Body,
  Card,
  DogPhoto,
  QuotaBar,
  RsvpSheet,
  ScreenHeader,
  StatusBadge,
  Title,
} from '../components';
import { confirmedDogs } from '../types';
import type { RsvpStatus, Walk } from '../types';
import { formatDuration, formatWalkDate, formatWalkTime } from '../mocks';

export interface WalkDetailScreenProps {
  walk: Walk;
  onBack?: () => void;
  /** fired by the docked answer bar; optimistic update is up to the caller */
  onRespond?: (status: RsvpStatus) => void;
  onPressParticipant?: (friendId: string) => void;
}

export function WalkDetailScreen({
  walk,
  onBack,
  onRespond,
  onPressParticipant,
}: WalkDetailScreenProps) {
  const dogs = confirmedDogs(walk);
  const shownDogs = dogs.slice(0, 3);
  const extraDogs = dogs.length - shownDogs.length;

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScreenHeader
        tone="accent"
        title={walk.place}
        subtitle={
          formatWalkDate(walk.startsAt) +
          ' · ' +
          formatWalkTime(walk.startsAt) +
          ' · ' +
          formatDuration(walk.durationMinutes)
        }
        onBack={onBack}
      />

      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <Card>
          <QuotaBar current={dogs.length} total={walk.dogCapacity} />
          <XStack gap="$3" marginTop="$4">
            {shownDogs.map((d) => (
              <DogPhoto key={d.id} dog={d} showName size="md" shape="round" />
            ))}
            {extraDogs > 0 ? (
              <YStack alignItems="center" gap="$2">
                <YStack
                  width="$dogMd"
                  height="$dogMd"
                  borderRadius="$round"
                  backgroundColor="$accentSoft"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Body size="sm" fontWeight="800" tone="accent">
                    +{extraDogs}
                  </Body>
                </YStack>
                <Body size="xs" tone="subtle" fontWeight="700">
                  autres
                </Body>
              </YStack>
            ) : null}
          </XStack>
        </Card>

        <Card gap="$3">
          <Title>Participants</Title>
          {walk.participants.map((p) => (
            <XStack
              key={p.friend.id}
              alignItems="center"
              gap="$3"
              minHeight="$tap"
              onPress={() => onPressParticipant?.(p.friend.id)}
            >
              <Avatar
                friend={p.friend}
                size="md"
                width={36}
                height={36}
                borderWidth={0}
                tone={p.status === 'pending' ? 'muted' : undefined}
              />
              <YStack flex={1}>
                <Body
                  size="lg"
                  fontWeight="700"
                  tone={p.status === 'declined' ? 'subtle' : 'default'}
                  textDecorationLine={p.status === 'declined' ? 'line-through' : 'none'}
                >
                  {p.friend.username}
                </Body>
                {p.status === 'confirmed' && p.dogs.length > 0 ? (
                  <Body size="xs" tone="subtle">
                    {p.dogs.length} chien{p.dogs.length > 1 ? 's' : ''}
                  </Body>
                ) : null}
              </YStack>
              <StatusBadge status={p.status} />
            </XStack>
          ))}
        </Card>
      </ScrollView>

      <RsvpSheet value={walk.myStatus} onChange={onRespond} />
    </YStack>
  );
}
