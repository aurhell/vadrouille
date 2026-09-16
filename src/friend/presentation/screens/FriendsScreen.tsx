import { useRef, useState } from "react"
import { Alert, FlatList } from "react-native"
import { Swipeable } from "react-native-gesture-handler"
import { XStack, YStack } from "tamagui"

import { useSession } from "@/account/presentation/providers/session-provider"
import type { Friend } from "../../domain/entities/friend"
import { usePullToRefresh } from "@/shared/hooks/use-pull-to-refresh"
import { Avatar, Body, Button, Card, EmptyState, RefreshControl, ScreenHeader, TextField, Title } from "@/shared/ui"
import {
  useAcceptFriendRequest,
  useCancelFriendRequest,
  useDeclineFriendRequest,
  useLookupInviteCode,
  useRedeemInviteCode,
  useRemoveFriend,
} from "../hooks/use-friend-mutations"
import { useFriends, useReceivedFriendRequests, useSentFriendRequests } from "../hooks/use-friends"

const REDEEM_OUTCOME_MESSAGE: Record<string, string> = {
  invalid_code: "Code invalide",
  own_code: "Tu ne peux pas t'ajouter toi-même",
  already_friends: "Vous êtes déjà amis",
  already_pending: "Invitation déjà envoyée, en attente de réponse",
  auto_accepted: "Vous étiez déjà invités mutuellement : vous êtes maintenant amis !",
  created: "Invitation envoyée !",
}

function FriendRow({ friend }: { friend: Friend }) {
  return (
    <XStack alignItems="center" gap="$3" minHeight="$tap">
      <Avatar friend={{ id: friend.id, username: friend.username, avatarUrl: friend.avatarUrl ?? undefined }} size="sm" />
      <Body fontWeight="700" flex={1}>
        {friend.username}
      </Body>
    </XStack>
  )
}

const REMOVE_ACTION_WIDTH = 88

function RemoveFriendRow({ friend, onRemove }: { friend: Friend; onRemove: (friend: Friend) => void }) {
  const swipeableRef = useRef<Swipeable>(null)

  function handlePress() {
    swipeableRef.current?.close()
    Alert.alert(`Retirer ${friend.username} ?`, "Vous ne serez plus amis. Tu pourras te réajouter plus tard avec un code d'invitation.", [
      { text: "Annuler", style: "cancel" },
      { text: "Retirer", style: "destructive", onPress: () => onRemove(friend) },
    ])
  }

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      overshootRight={false}
      // The friend card itself is the front layer, sliding left to reveal this — that way the
      // avatar/pseudo you're about to remove stay in view for the whole gesture, instead of
      // scrolling off and leaving a disconnected "Retirer" button with no context (see
      // friend.docs.md "Retrait d'un ami").
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
            Retirer
          </Body>
        </XStack>
      )}
    >
      {/* flat: sitting on top of the red action panel, not the page background — a drop
       * shadow here just bleeds an ugly halo onto the red as the card slides over it. */}
      <Card flat backgroundColor="$backgroundStrong">
        <FriendRow friend={friend} />
      </Card>
    </Swipeable>
  )
}

export function FriendsScreen() {
  const { session } = useSession()
  const userId = session?.user.id

  const friendsQuery = useFriends(userId)
  const sentRequestsQuery = useSentFriendRequests(userId)
  const receivedRequestsQuery = useReceivedFriendRequests(userId)
  const { data: friends } = friendsQuery
  const { data: sentRequests } = sentRequestsQuery
  const { data: receivedRequests } = receivedRequestsQuery

  const { refreshing, onRefresh } = usePullToRefresh(() =>
    Promise.all([friendsQuery.refetch(), sentRequestsQuery.refetch(), receivedRequestsQuery.refetch()]),
  )

  const lookupInviteCode = useLookupInviteCode()
  const redeemInviteCode = useRedeemInviteCode(userId)
  const acceptFriendRequest = useAcceptFriendRequest(userId)
  const declineFriendRequest = useDeclineFriendRequest(userId)
  const cancelFriendRequest = useCancelFriendRequest(userId)
  const removeFriend = useRemoveFriend(userId)

  const [code, setCode] = useState("")
  const [preview, setPreview] = useState<Friend | null>(null)
  const [message, setMessage] = useState<string>()

  async function handleLookup() {
    if (!code.trim()) return
    setMessage(undefined)

    const trimmed = code.trim()
    const found = await lookupInviteCode.mutateAsync(trimmed)
    if (!found) {
      setMessage(REDEEM_OUTCOME_MESSAGE.invalid_code)
      return
    }
    if (found.id === userId) {
      setMessage(REDEEM_OUTCOME_MESSAGE.own_code)
      return
    }
    setPreview(found)
  }

  function handleCancelPreview() {
    setPreview(null)
  }

  async function handleConfirm() {
    if (!preview) return
    const trimmed = code.trim()
    const outcome = await redeemInviteCode.mutateAsync(trimmed)
    setMessage(REDEEM_OUTCOME_MESSAGE[outcome.outcome])
    setPreview(null)
    if (outcome.outcome === "created" || outcome.outcome === "auto_accepted") setCode("")
  }

  const hasNothing = (friends?.length ?? 0) === 0 && (sentRequests?.length ?? 0) === 0 && (receivedRequests?.length ?? 0) === 0

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScreenHeader title="Mes amis" />

      <FlatList
        data={friends ?? []}
        keyExtractor={(friend) => friend.id}
        contentContainerStyle={{ padding: 20, paddingTop: 0, gap: 12 }}
        renderItem={({ item }) => <RemoveFriendRow friend={item} onRemove={(friend) => removeFriend.mutate(friend.id)} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <YStack gap="$5" paddingBottom="$4">
            {preview ? (
              <Card gap="$3">
                <XStack alignItems="center" gap="$3">
                  <Avatar friend={{ id: preview.id, username: preview.username, avatarUrl: preview.avatarUrl ?? undefined }} size="md" />
                  <Body flex={1} fontWeight="700">
                    Ajouter {preview.username} comme ami·e ?
                  </Body>
                </XStack>
                <XStack gap="$3">
                  <Button variant="secondary" size="sm" flex={1} onPress={handleCancelPreview}>
                    Annuler
                  </Button>
                  <Button
                    size="sm"
                    flex={1}
                    disabled={redeemInviteCode.isPending}
                    loading={redeemInviteCode.isPending}
                    onPress={handleConfirm}
                  >
                    Confirmer
                  </Button>
                </XStack>
              </Card>
            ) : (
              <YStack gap="$3">
                <TextField
                  label="Ajouter un ami"
                  placeholder="Code d'invitation"
                  value={code}
                  onChangeText={(text) => {
                    setCode(text)
                    setMessage(undefined)
                  }}
                  autoCapitalize="characters"
                  state={message ? "error" : "default"}
                  helper={message}
                />
                <Button size="md" disabled={lookupInviteCode.isPending || !code.trim()} loading={lookupInviteCode.isPending} onPress={handleLookup}>
                  Ajouter
                </Button>
              </YStack>
            )}

            {receivedRequests && receivedRequests.length > 0 ? (
              <YStack gap="$3">
                <Title size="sm">Invitations reçues</Title>
                {receivedRequests.map((requester) => (
                  <Card key={requester.id} gap="$3">
                    <FriendRow friend={requester} />
                    <XStack gap="$3">
                      <Button
                        variant="secondary"
                        size="sm"
                        flex={1}
                        disabled={declineFriendRequest.isPending}
                        onPress={() => declineFriendRequest.mutate(requester.id)}
                      >
                        Refuser
                      </Button>
                      <Button
                        size="sm"
                        flex={1}
                        disabled={acceptFriendRequest.isPending}
                        onPress={() => acceptFriendRequest.mutate(requester.id)}
                      >
                        Accepter
                      </Button>
                    </XStack>
                  </Card>
                ))}
              </YStack>
            ) : null}

            {sentRequests && sentRequests.length > 0 ? (
              <YStack gap="$3">
                <Title size="sm">Invitations envoyées</Title>
                {sentRequests.map((addressee) => (
                  <Card key={addressee.id} gap="$3">
                    <FriendRow friend={addressee} />
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={cancelFriendRequest.isPending}
                      onPress={() => cancelFriendRequest.mutate(addressee.id)}
                    >
                      Retirer l'invitation
                    </Button>
                  </Card>
                ))}
              </YStack>
            ) : null}

            {friends && friends.length > 0 ? <Title size="sm">Amis</Title> : null}
          </YStack>
        }
        ListEmptyComponent={
          hasNothing ? (
            <EmptyState title="Pas encore d'amis" body="Ajoute un ami avec son code d'invitation pour organiser des balades ensemble." />
          ) : null
        }
      />
    </YStack>
  )
}
