import { ScrollView, YStack } from 'tamagui';
import { Button, DogCard, EmptyState, ScreenHeader } from '../components';
import type { Dog } from '../types';

export interface MyDogsScreenProps {
  dogs: Dog[];
  /** open the dog record (edit photo, breed, shared household) */
  onPressDog?: (dog: Dog) => void;
  onAddDog?: () => void;
}

export function MyDogsScreen({ dogs, onPressDog, onAddDog }: MyDogsScreenProps) {
  const shared = dogs.filter((d) => d.sharedWith).length;
  return (
    <YStack flex={1} backgroundColor="$background">
      <ScreenHeader
        title="Mes chiens"
        subtitle={
          dogs.length +
          ' compagnon' +
          (dogs.length > 1 ? 's' : '') +
          (shared ? ' · ' + shared + ' en foyer partagé' : '')
        }
      />
      {dogs.length === 0 ? (
        <EmptyState
          emoji="🐕"
          title="Aucun chien enregistré"
          body="Ajoute ton chien pour pouvoir l'emmener en balade et le partager avec ton foyer."
          actionLabel="Ajouter un chien"
          onAction={onAddDog}
        />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 14 }}
            showsVerticalScrollIndicator={false}
          >
            {dogs.map((d) => (
              <DogCard key={d.id} dog={d} onPress={onPressDog} />
            ))}
          </ScrollView>
          <YStack paddingHorizontal="$5" paddingBottom="$6">
            <Button full variant="dashed" onPress={onAddDog}>
              ＋ Ajouter un chien
            </Button>
          </YStack>
        </>
      )}
    </YStack>
  );
}
