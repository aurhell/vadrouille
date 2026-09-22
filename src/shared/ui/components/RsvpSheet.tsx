import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Theme, XStack, YStack, styled } from "tamagui"

import { Body } from "./Text"

import type { RsvpStatus } from "../types"
import type { ReactNode } from "react"

const Dock = styled(YStack, {
  name: "RsvpSheet",
  backgroundColor: "$backgroundStrong",
  borderTopLeftRadius: "$5",
  borderTopRightRadius: "$5",
  padding: "$3",
  gap: "$3",
  shadowColor: "$shadowColor",
  shadowOpacity: 1,
  shadowRadius: 22,
  shadowOffset: { width: 0, height: -6 },
})

const Option = styled(YStack, {
  name: "RsvpOption",
  role: "button",
  flex: 1,
  minHeight: "$tap",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "$3",
  backgroundColor: "$accentSoft",
  cursor: "pointer",
  transition: "fast",
  pressStyle: { scale: 0.97 },
  variants: {
    active: { true: { backgroundColor: "$accent" } },
  } as const,
})

const options: { status: Exclude<RsvpStatus, "pending">; label: string }[] = [
  { status: "confirmed", label: "Oui 🦮" },
  { status: "maybe", label: "Peut-être" },
  { status: "declined", label: "Non" },
]

export type RsvpSheetProps = {
  value: RsvpStatus;
  prompt?: string;
  onChange?: (status: RsvpStatus) => void;
  /** Rendered below the Oui/Peut-être/Non row (or instead of it, see `hideButtons`), growing
   * the docked sheet upward instead of a separate scrollable card — e.g. a dog picker or a
   * collapsed one-line summary (see WalkDetailScreen). RsvpSheet itself stays generic: it
   * doesn't know what the extra content is, only that there is or isn't any right now. */
  children?: ReactNode;
  /** Suppresses the built-in prompt + Oui/Peut-être/Non row, leaving only `children` — for a
   * screen managing its own collapsed/expanded views inside the same docked chrome. */
  hideButtons?: boolean;
}

/** Docked answer bar. Always visible on the walk detail screen — no scroll to reply. */
export function RsvpSheet({ value, prompt = "Tu viens ?", onChange, children, hideButtons }: RsvpSheetProps) {
  const insets = useSafeAreaInsets()
  return (
    <Dock paddingBottom={Math.max(insets.bottom, 12) + 12}>
      {!hideButtons ? (
        <>
          <Body size="sm" tone="subtle" textAlign="center" fontWeight="700">
            {prompt}
          </Body>
          <XStack gap="$3">
            {options.map((o) => {
              const active = value === o.status
              return (
                <Theme key={o.status} name={o.status}>
                  <Option active={active} aria-checked={active} onPress={() => onChange?.(o.status)}>
                    <Body
                      size="lg"
                      fontWeight="800"
                      color={active ? "$accentText" : "$accentSoftText"}
                      numberOfLines={1}
                    >
                      {o.label}
                    </Body>
                  </Option>
                </Theme>
              )
            })}
          </XStack>
        </>
      ) : null}
      {children}
    </Dock>
  )
}
