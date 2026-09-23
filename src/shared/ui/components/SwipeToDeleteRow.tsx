import { useRef, useState, type ReactNode  } from "react"
import { View } from "react-native"
import { Swipeable } from "react-native-gesture-handler"
import { XStack } from "tamagui"

import { ConfirmDialog } from "./ConfirmDialog"
import { Body } from "./Text"

const REMOVE_ACTION_WIDTH = 88

export type SwipeToDeleteRowProps = {
  children: ReactNode;
  /** red action-panel label, revealed on swipe (e.g. "Retirer", "Supprimer", "Annuler") */
  actionLabel: string;
  confirmTitle: string;
  confirmMessage: string;
  /** destructive button label inside the confirmation dialog — defaults to `actionLabel`,
   * override when they need to read differently (e.g. panel "Annuler", dialog "Confirmer", since
   * "Annuler" is already the dialog's own cancel button). */
  confirmActionLabel?: string;
  onConfirm: () => void;
}

/** Swipe-left-to-reveal a red delete/remove action, gated behind a styled confirmation dialog
 * — walks, dogs, friends lists (see WalksListScreen, MyDogsScreen, FriendsScreen). The row
 * closes itself before the dialog opens, so it doesn't sit revealed underneath a dialog the
 * user might cancel. */
export function SwipeToDeleteRow({
  children,
  actionLabel,
  confirmTitle,
  confirmMessage,
  confirmActionLabel,
  onConfirm,
}: SwipeToDeleteRowProps) {
  const swipeableRef = useRef<Swipeable>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  function handlePress() {
    swipeableRef.current?.close()
    setConfirmOpen(true)
  }

  function handleConfirm() {
    setConfirmOpen(false)
    onConfirm()
  }

  return (
    <>
      {/* The swipe gesture itself has no VoiceOver/TalkBack equivalent (it conflicts with the
       * screen reader's own swipe navigation) — this custom accessibility action exposes the
       * same "Retirer"/"Supprimer" as a rotor action on the whole row, so it's reachable
       * without swiping. `accessible` groups the row into one stop rather than breaking it
       * apart, which still forwards a double-tap to whatever `onPress` the row's own content
       * (e.g. a WalkCard/DogCard) has for navigation. */}
      <View
        accessible
        accessibilityActions={[{ name: "activate", label: actionLabel }]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === "activate") handlePress()
        }}
      >
        <Swipeable
          ref={swipeableRef}
          friction={2}
          overshootRight={false}
          renderRightActions={() => (
            <XStack
              width={REMOVE_ACTION_WIDTH}
              alignItems="center"
              justifyContent="center"
              backgroundColor="$danger"
              borderRadius="$5"
              onPress={handlePress}
            >
              <Body fontWeight="800" color="$colorInverse">
                {actionLabel}
              </Body>
            </XStack>
          )}
        >
          {children}
        </Swipeable>
      </View>
      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel={confirmActionLabel ?? actionLabel}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}
