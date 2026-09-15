import { useState } from 'react';
import { ScrollView, XStack, YStack } from 'tamagui';
import {
  Avatar,
  Body,
  Button,
  Card,
  ChoiceChipGroup,
  DogPhoto,
  Label,
  TextField,
  Title,
} from '../components';
import type { Dog, Friend } from '../types';
import { durationOptions } from '../mocks';

export interface WalkDraft {
  place: string;
  startsAt: string;
  durationMinutes: number;
  invitedFriendIds: string[];
  dogIds: string[];
}

export interface CreateWalkScreenProps {
  friends: Friend[];
  myDogs: Dog[];
  initial?: Partial<WalkDraft>;
  onClose?: () => void;
  /** opens the platform date/time picker; returns the chosen ISO string */
  onPickDateTime?: () => Promise<string | undefined>;
  /** called with the complete draft — validation lives here, not in the screen */
  onSubmit?: (draft: WalkDraft) => void;
}

export function CreateWalkScreen({
  friends,
  myDogs,
  initial,
  onClose,
  onPickDateTime,
  onSubmit,
}: CreateWalkScreenProps) {
  const [place, setPlace] = useState(initial?.place ?? '');
  const [startsAt, setStartsAt] = useState(initial?.startsAt ?? '2026-09-19T10:00:00+02:00');
  const [duration, setDuration] = useState(initial?.durationMinutes ?? 90);
  const [invited, setInvited] = useState<string[]>(initial?.invitedFriendIds ?? []);
  const [dogIds, setDogIds] = useState<string[]>(initial?.dogIds ?? []);

  const toggle = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const time = new Date(startsAt);
  const hhmm = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(time);
  const day = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric' }).format(time);

  const pick = async () => {
    const next = await onPickDateTime?.();
    if (next) setStartsAt(next);
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      <XStack
        paddingHorizontal="$5"
        paddingTop="$4"
        paddingBottom="$2"
        alignItems="center"
        justifyContent="space-between"
      >
        <Title size="lg" fontSize={24}>
          Nouvelle balade
        </Title>
        <Body size="lg" fontWeight="800" tone="subtle" onPress={onClose} hitSlop={12}>
          ✕
        </Body>
      </XStack>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <TextField
          label="Où ?"
          placeholder="📍 Nom du lieu"
          value={place}
          onChangeText={setPlace}
          state={place ? 'filled' : 'default'}
        />

        <XStack gap="$3">
          <YStack flex={1} gap="$2">
            <Label>Départ</Label>
            <Card flat padding="$3" interactive onPress={pick} justifyContent="center" minHeight="$control">
              <Title size="md">{hhmm} ▾</Title>
            </Card>
          </YStack>
          <YStack flex={1} gap="$2">
            <Label>Jour</Label>
            <Card flat padding="$3" interactive onPress={pick} justifyContent="center" minHeight="$control">
              <Title size="md">{day} ▾</Title>
            </Card>
          </YStack>
        </XStack>

        <YStack gap="$2">
          <Label>Durée</Label>
          <ChoiceChipGroup
            value={duration}
            onChange={setDuration}
            options={durationOptions.map((d) => ({ value: d.minutes, label: d.label }))}
          />
        </YStack>

        <YStack gap="$3">
          <XStack alignItems="center" justifyContent="space-between">
            <Label>Qui on invite ?</Label>
            <Body size="xs" fontWeight="800" tone="accent">
              {invited.length} sélectionné{invited.length > 1 ? 's' : ''}
            </Body>
          </XStack>
          <XStack gap="$3" flexWrap="wrap">
            {friends.map((fr) => {
              const on = invited.includes(fr.id);
              return (
                <YStack
                  key={fr.id}
                  alignItems="center"
                  gap="$2"
                  opacity={on ? 1 : 0.5}
                  onPress={() => setInvited(toggle(invited, fr.id))}
                >
                  <YStack position="relative">
                    <Avatar friend={fr} size="lg" tone={on ? undefined : 'muted'} />
                    {on ? (
                      <YStack
                        position="absolute"
                        right={-2}
                        bottom={-2}
                        width={20}
                        height={20}
                        borderRadius="$round"
                        backgroundColor="$success"
                        borderWidth={2}
                        borderColor="$background"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Body size="xs" fontWeight="800" color="$colorInverse">
                          ✓
                        </Body>
                      </YStack>
                    ) : null}
                  </YStack>
                  <Body size="xs" fontWeight="700">
                    {fr.username}
                  </Body>
                </YStack>
              );
            })}
          </XStack>
        </YStack>

        <YStack gap="$3">
          <Label>J'emmène</Label>
          {myDogs.map((d) => {
            const on = dogIds.includes(d.id);
            return (
              <Card
                key={d.id}
                flat
                interactive
                padding="$3"
                borderWidth={2}
                borderColor={on ? '$success' : 'transparent'}
                onPress={() => setDogIds(toggle(dogIds, d.id))}
              >
                <XStack alignItems="center" gap="$3">
                  <DogPhoto dog={d} size="sm" shape="card" />
                  <Body size="lg" fontWeight="700" flex={1}>
                    {d.name}
                  </Body>
                  <YStack
                    width={22}
                    height={22}
                    borderRadius="$round"
                    alignItems="center"
                    justifyContent="center"
                    backgroundColor={on ? '$success' : 'transparent'}
                    borderWidth={on ? 0 : 2}
                    borderColor="$borderColor"
                  >
                    {on ? (
                      <Body size="xs" fontWeight="800" color="$colorInverse">
                        ✓
                      </Body>
                    ) : null}
                  </YStack>
                </XStack>
              </Card>
            );
          })}
        </YStack>
      </ScrollView>

      <YStack paddingHorizontal="$5" paddingBottom="$6">
        <Button
          full
          disabled={!place || invited.length === 0}
          onPress={() =>
            onSubmit?.({
              place,
              startsAt,
              durationMinutes: duration,
              invitedFriendIds: invited,
              dogIds,
            })
          }
        >
          Proposer la balade 🐾
        </Button>
      </YStack>
    </YStack>
  );
}
