import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { Body, Label } from './Text';

export interface DateFieldProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date) => void;
  maximumDate?: Date;
  placeholder?: string;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('fr-FR');
}

/**
 * A native date picker, not a free-text field — typing "2024" into a plain TextField and
 * submitting sends an incomplete date straight to Postgres (`invalid input syntax for type
 * date`). iOS and Android need genuinely different wiring: iOS renders the picker inline once
 * opened, Android's picker is an imperative dialog that dismisses itself.
 */
export function DateField({ label, value, onChange, maximumDate, placeholder = 'Choisir une date' }: DateFieldProps) {
  const [iosPickerOpen, setIosPickerOpen] = useState(false);

  function handlePress() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: value ?? new Date(),
        mode: 'date',
        maximumDate,
        onChange: (event, selected) => {
          if (event.type === 'set' && selected) onChange(selected);
        },
      });
    } else {
      setIosPickerOpen((open) => !open);
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
          {value ? formatDate(value) : placeholder}
        </Body>
      </XStack>
      {Platform.OS === 'ios' && iosPickerOpen ? (
        <DateTimePicker
          value={value ?? new Date()}
          mode="date"
          display="spinner"
          maximumDate={maximumDate}
          onChange={(_event, selected) => {
            if (selected) onChange(selected);
          }}
        />
      ) : null}
    </YStack>
  );
}
