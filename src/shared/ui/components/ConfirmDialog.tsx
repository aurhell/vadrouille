import { Modal } from "react-native"
import { YStack } from "tamagui"

import { Button } from "./Button"
import { Body, Title } from "./Text"

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Styled, cross-platform replacement for `Alert.alert` — a centered modal card with a
 * title, optional message, and confirm/cancel buttons (see WalkDetailScreen's original
 * cancel-walk dialog, generalized here). `destructive` colors the confirm button red for
 * irreversible actions (delete, cancel, remove). */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = "Annuler",
  destructive = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onCancel}>
      <YStack flex={1} backgroundColor="rgba(0,0,0,0.4)" alignItems="center" justifyContent="center" padding="$6">
        <YStack backgroundColor="$backgroundStrong" borderRadius="$5" padding="$5" gap="$4" width="100%">
          <Title size="md">{title}</Title>
          {message ? (
            <Body size="sm" tone="subtle">
              {message}
            </Body>
          ) : null}
          <YStack gap="$2">
            <Button
              backgroundColor={destructive ? "$danger" : undefined}
              shadowColor={destructive ? "$danger" : undefined}
              variant={destructive ? undefined : "primary"}
              onPress={onConfirm}
            >
              {confirmLabel}
            </Button>
            <Button variant="secondary" onPress={onCancel}>
              {cancelLabel}
            </Button>
          </YStack>
        </YStack>
      </YStack>
    </Modal>
  )
}
