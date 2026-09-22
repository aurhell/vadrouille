import { Body } from "./Text"

export type CloseButtonProps = {
  onPress: () => void;
}

/** "✕" close button for a ScreenHeader's `rightSlot` on modal-like forms (see WalkFormScreen,
 * WalkEditScreen). */
export function CloseButton({ onPress }: CloseButtonProps) {
  return (
    <Body fontSize={20} fontWeight="700" color="$colorSubtle" onPress={onPress} minHeight="$tap" minWidth="$tap" textAlign="center" hitSlop={12}>
      ✕
    </Body>
  )
}
