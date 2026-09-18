import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useId, useRef, useState, useSyncExternalStore } from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XStack, YStack } from 'tamagui';
import { useThemePreference } from '@/shared/providers/theme-preference-provider';
import * as pickerCoordinator from '../picker-coordinator';
import { Button } from './Button';
import { Body, Label } from './Text';

export interface DateFieldProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date) => void;
  maximumDate?: Date;
  minimumDate?: Date;
  placeholder?: string;
  /** 'date' (default) picks a calendar day; 'time' picks a time of day. */
  mode?: 'date' | 'time';
  /** iOS only: renders as a small themed pill that opens the picker in a bottom sheet, instead
   * of the custom row + inline spinner below it — for a pair of fields sitting side by side
   * (e.g. a walk's time + date) where the inline spinner would otherwise clip against the
   * half-width column (see WalkFormScreen). A Modal sheet is always full-width regardless of
   * the trigger's own width, which also means it needs none of the picker-coordinator dance.
   * Falls back to the default row + dialog on Android, which is already compact. */
  compact?: boolean;
}

function formatValue(date: Date, mode: 'date' | 'time'): string {
  return mode === 'time'
    ? date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('fr-FR');
}

/**
 * A native date/time picker, not a free-text field — typing "2024" into a plain TextField and
 * submitting sends an incomplete date straight to Postgres (`invalid input syntax for type
 * date`). iOS and Android need genuinely different wiring: iOS renders the picker inline once
 * opened, Android's picker is an imperative dialog that dismisses itself.
 */
export function DateField({
  label,
  value,
  onChange,
  maximumDate,
  minimumDate,
  placeholder,
  mode = 'date',
  compact = false,
}: DateFieldProps) {
  const id = useId();
  // Shared across every DateField instance on screen (see picker-coordinator.ts): opening
  // this one closes any other, and a touch anywhere else in the app (a chip, a list row, the
  // root layout's own touch capture) closes this one — with no state to lift into whichever
  // screen happens to render several fields side by side.
  const iosPickerOpen = useSyncExternalStore(pickerCoordinator.subscribe, () => pickerCoordinator.isOpen(id));
  const pickerRef = useRef<View>(null);
  const { resolvedTheme } = useThemePreference();
  const insets = useSafeAreaInsets();
  const [compactSheetOpen, setCompactSheetOpen] = useState(false);
  const resolvedPlaceholder = placeholder ?? (mode === 'time' ? 'Choisir une heure' : 'Choisir une date');

  if (compact && Platform.OS === 'ios') {
    return (
      <YStack gap="$2">
        {label ? <Label>{label}</Label> : null}
        <XStack
          backgroundColor="$backgroundStrong"
          borderRadius="$round"
          minHeight="$control"
          paddingHorizontal="$4"
          alignItems="center"
          justifyContent="center"
          cursor="pointer"
          onPress={() => setCompactSheetOpen(true)}
        >
          <Body color={value ? '$color' : '$colorFaint'} fontWeight="700">{value ? formatValue(value, mode) : resolvedPlaceholder}</Body>
        </XStack>
        <Modal visible={compactSheetOpen} transparent animationType="slide" onRequestClose={() => setCompactSheetOpen(false)}>
          <YStack flex={1} justifyContent="flex-end">
            <Pressable
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' }}
              onPress={() => setCompactSheetOpen(false)}
            />
            <YStack
              backgroundColor="$backgroundStrong"
              borderTopLeftRadius="$5"
              borderTopRightRadius="$5"
              padding="$4"
              paddingBottom={Math.max(insets.bottom, 12) + 12}
              gap="$3"
            >
              <DateTimePicker
                value={value ?? new Date()}
                mode={mode}
                display="spinner"
                maximumDate={maximumDate}
                minimumDate={minimumDate}
                themeVariant={resolvedTheme}
                onChange={(_event, selected) => {
                  if (selected) onChange(selected);
                }}
              />
              <Button onPress={() => setCompactSheetOpen(false)}>OK</Button>
            </YStack>
          </YStack>
        </Modal>
      </YStack>
    );
  }

  function handlePress() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: value ?? new Date(),
        mode,
        maximumDate,
        minimumDate,
        onChange: (event, selected) => {
          if (event.type === 'set' && selected) onChange(selected);
        },
      });
    } else {
      iosPickerOpen ? pickerCoordinator.closeAll() : pickerCoordinator.requestOpen(id);
    }
  }

  return (
    <YStack gap="$2">
      {label ? <Label>{label}</Label> : null}
      <XStack
        backgroundColor="$backgroundStrong"
        borderRadius="$3"
        borderWidth={2}
        borderColor="transparent"
        minHeight="$control"
        paddingHorizontal="$4"
        alignItems="center"
        cursor="pointer"
        onPress={handlePress}
      >
        <Body color={value ? '$color' : '$colorFaint'} fontWeight="600">
          {value ? formatValue(value, mode) : resolvedPlaceholder}
        </Body>
      </XStack>
      {Platform.OS === 'ios' && iosPickerOpen ? (
        <View
          ref={pickerRef}
          onLayout={() => {
            // Reports its own on-screen bounds so the root layout's outside-touch handler can
            // tell a touch that starts on the spinner (dragging it to pick a value) apart from
            // one that starts elsewhere — see picker-coordinator.ts.
            pickerRef.current?.measureInWindow((x, y, width, height) => {
              pickerCoordinator.setOpenBounds({ x, y, width, height });
            });
          }}
        >
          <DateTimePicker
            value={value ?? new Date()}
            mode={mode}
            display="spinner"
            maximumDate={maximumDate}
            minimumDate={minimumDate}
            // Without this the spinner follows the device's OS-level appearance, which can
            // mismatch the app's own theme (e.g. app forced to dark on a light-mode device) and
            // render near-illegible text — pin it to whichever theme the app is actually using.
            themeVariant={resolvedTheme}
            onChange={(_event, selected) => {
              if (selected) onChange(selected);
            }}
          />
        </View>
      ) : null}
    </YStack>
  );
}
