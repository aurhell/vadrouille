import { XStack, YStack, styled } from "tamagui"

import { Body } from "./Text"

const Chip = styled(YStack, {
  name: "ChoiceChip",
  role: "button",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "$tap",
  paddingHorizontal: "$4",
  borderRadius: "$round",
  backgroundColor: "$backgroundStrong",
  cursor: "pointer",
  transition: "fast",
  pressStyle: { scale: 0.96 },
  variants: {
    selected: {
      true: { backgroundColor: "$accent" },
    },
  } as const,
})

export type ChoiceChipGroupProps<T> = {
  options: { value: T; label: string }[];
  value: T;
  onChange?: (value: T) => void;
}

export function ChoiceChipGroup<T extends string | number>({
  options,
  value,
  onChange,
}: ChoiceChipGroupProps<T>) {
  return (
    <XStack gap="$2" flexWrap="wrap">
      {options.map((o) => {
        const selected = o.value === value
        return (
          <Chip
            key={String(o.value)}
            selected={selected}
            aria-checked={selected}
            onPress={() => onChange?.(o.value)}
          >
            <Body
              size="sm"
              fontWeight="800"
              color={selected ? "$accentText" : "$colorSubtle"}
              numberOfLines={1}
            >
              {o.label}
            </Body>
          </Chip>
        )
      })}
    </XStack>
  )
}

export const ChoiceChip = Chip
