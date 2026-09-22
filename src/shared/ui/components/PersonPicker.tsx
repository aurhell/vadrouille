import { XStack, YStack } from 'tamagui';
import { Avatar } from './Avatar';
import { Body, Label } from './Text';
import type { Friend } from '../types';

function toggle(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((existing) => existing !== id) : [...ids, id];
}

export interface PersonPickerProps {
  /** field label, e.g. "Qui on invite ?" */
  label: string;
  people: Friend[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /** shown instead of the grid when `people` is empty */
  emptyLabel: string;
}

/** Avatar grid with a green checkmark badge for the selected state — friend/co-owner pickers
 * on walk create/edit (see WalkFormScreen, WalkEditScreen). Selection is toggled by tapping a
 * person, `onChange` receives the full next id list (mirrors useState's updater shape) rather
 * than a single toggled id, so callers can plug it straight into `setState` either way. */
export function PersonPicker({ label, people, selectedIds, onChange, emptyLabel }: PersonPickerProps) {
  return (
    <YStack gap="$3">
      <XStack alignItems="center" justifyContent="space-between">
        <Label>{label}</Label>
        {selectedIds.length > 0 ? (
          <Body size="sm" fontWeight="800" tone="accent">
            {selectedIds.length} sélectionné{selectedIds.length > 1 ? 's' : ''}
          </Body>
        ) : null}
      </XStack>
      {people.length > 0 ? (
        <XStack gap="$4" flexWrap="wrap">
          {people.map((person) => {
            const selected = selectedIds.includes(person.id);
            return (
              <YStack
                key={person.id}
                alignItems="center"
                gap="$2"
                width={64}
                onPress={() => onChange(toggle(selectedIds, person.id))}
              >
                <YStack position="relative">
                  <Avatar friend={person} size="lg" tone={selected ? undefined : 'muted'} opacity={selected ? 1 : 0.5} />
                  {selected ? (
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
                <Body size="xs" fontWeight="700" color={selected ? '$color' : '$colorFaint'} numberOfLines={1}>
                  {person.username}
                </Body>
              </YStack>
            );
          })}
        </XStack>
      ) : (
        <Body size="sm" tone="subtle">
          {emptyLabel}
        </Body>
      )}
    </YStack>
  );
}
