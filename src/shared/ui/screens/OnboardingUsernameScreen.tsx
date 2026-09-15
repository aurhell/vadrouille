import { useState } from 'react';
import { YStack } from 'tamagui';
import { Body, Button, Display, TextField } from '../components';

export interface OnboardingUsernameScreenProps {
  /** debounced availability check; undefined while unknown */
  isAvailable?: boolean;
  checking?: boolean;
  onChangeUsername?: (username: string) => void;
  /** opens the image picker, returns the chosen local uri */
  onPickPhoto?: () => Promise<string | undefined>;
  onSubmit?: (payload: { username: string; photoUri?: string }) => void;
}

export function OnboardingUsernameScreen({
  isAvailable,
  checking,
  onChangeUsername,
  onPickPhoto,
  onSubmit,
}: OnboardingUsernameScreenProps) {
  const [username, setUsername] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();

  const helper = !username
    ? undefined
    : checking
      ? 'Vérification…'
      : isAvailable === false
        ? 'Ce pseudo est déjà pris'
        : '✓ Ce pseudo est libre';

  return (
    <YStack flex={1} backgroundColor="$accent">
      <YStack paddingHorizontal="$6" paddingTop="$9" paddingBottom="$6" gap="$3">
        <Body fontSize={46} lineHeight={52}>
          🦮
        </Body>
        <Display size="lg" color="$accentText">
          Bienvenue sur Vadrouille !
        </Display>
        <Body size="lg" color="$accentText" opacity={0.95}>
          Comment tes amis te reconnaîtront-ils ?
        </Body>
      </YStack>

      <YStack
        flex={1}
        backgroundColor="$background"
        borderTopLeftRadius={38}
        borderTopRightRadius={38}
        padding="$6"
        gap="$6"
      >
        <YStack alignItems="center" gap="$3">
          <YStack
            width={104}
            height={104}
            borderRadius="$round"
            backgroundColor="$accentSoft"
            borderWidth={3}
            borderStyle="dashed"
            borderColor="$warning"
            alignItems="center"
            justifyContent="center"
            onPress={async () => setPhotoUri((await onPickPhoto?.()) ?? photoUri)}
          >
            <Body fontSize={34} lineHeight={40}>
              {photoUri ? '🖼' : '＋'}
            </Body>
          </YStack>
          <Body size="sm" tone="subtle" fontWeight="700">
            Ajoute une photo (optionnel)
          </Body>
        </YStack>

        <TextField
          large
          label="Ton pseudo"
          placeholder="@pseudo"
          autoCapitalize="none"
          value={username}
          onChangeText={(v: string) => {
            setUsername(v);
            onChangeUsername?.(v);
          }}
          state={username ? (isAvailable === false ? 'error' : 'filled') : 'default'}
          helper={helper}
        />

        <YStack flex={1} justifyContent="flex-end" gap="$3">
          <Button full disabled={!username || isAvailable === false} onPress={() => onSubmit?.({ username, photoUri })}>
            C'est parti !
          </Button>
          <Body size="xs" tone="subtle" textAlign="center" fontWeight="600">
            Tu pourras le changer plus tard.
          </Body>
        </YStack>
      </YStack>
    </YStack>
  );
}
