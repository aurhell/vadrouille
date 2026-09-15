import { ScrollView, YStack } from 'tamagui';
import { Avatar, Body, Button, EmptyState, ScreenHeader, WalkCard } from '../components';
import type { Walk } from '../types';
import { me } from '../mocks';

export interface HomeScreenProps {
  /** upcoming walks, already sorted by start date */
  walks: Walk[];
  /** row tap → open the walk detail screen */
  onPressWalk?: (walk: Walk) => void;
  /** primary CTA and the empty-state CTA both fire this */
  onCreateWalk?: () => void;
  onPressProfile?: () => void;
}

export function HomeScreen({
  walks,
  onPressWalk,
  onCreateWalk,
  onPressProfile,
}: HomeScreenProps) {
  const empty = walks.length === 0;
  return (
    <YStack flex={1} backgroundColor="$background">
      <ScreenHeader
        title="Balades 🐾"
        subtitle={empty ? undefined : walks.length + ' sorties à venir'}
        rightSlot={
          <YStack onPress={onPressProfile} hitSlop={10}>
            <Avatar friend={me} size="lg" width={42} height={42} />
          </YStack>
        }
      />

      {empty ? (
        <EmptyState
          title="Aucune balade à venir"
          body="Lance la première ! Propose un lieu et une heure, tes amis reçoivent l'invitation aussitôt."
          actionLabel="Proposer une balade"
          onAction={onCreateWalk}
        />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 14 }}
            showsVerticalScrollIndicator={false}
          >
            {walks.map((w) => (
              <WalkCard key={w.id} walk={w} onPress={onPressWalk} />
            ))}
          </ScrollView>
          <YStack paddingHorizontal="$5" paddingBottom="$6" alignItems="center">
            <Button
              onPress={onCreateWalk}
              icon={
                <Body fontSize={18} color="$accentText">
                  ＋
                </Body>
              }
            >
              Nouvelle balade
            </Button>
          </YStack>
        </>
      )}
    </YStack>
  );
}
