# Vadrouille — design system (Direction A « Ludique & coloré »)

Tamagui + TypeScript. API en anglais, copie UI en français.

> **Statut par fichier** — `tamagui.config.ts`, `tokens.ts`, `themes.ts` et `components/` sont
> l'infra Tamagui réelle, branchée dans `app/_layout.tsx` et destinée à être réutilisée telle
> quelle par les vraies features. `types.ts`, `mocks.ts` et `screens/` sont la maquette de
> référence livrée avec le design system (données mockées, types simplifiés) — à consulter comme
> point de départ visuel/comportemental lors du TDD de chaque domaine, mais à **réimplémenter**
> dans `src/<feature>/presentation/` avec les vraies entités de domaine et les use-cases, pas à
> importer tel quel en prod (voir `architecture-technique.md`).

```
design-system/
  tamagui.config.ts   createTamagui complet : fonts, animations, shorthands, media
  tokens.ts           valeurs brutes (palette, space, size, radius, zIndex)
  themes.ts           tokens sémantiques : light, dark + sous-thèmes de statut
  types.ts            Walk, Dog, Friend, WalkParticipant, RsvpStatus + helpers (référence)
  mocks.ts            données de démo, libellés FR, formatteurs de date (référence)
  components/         11 briques UI
  screens/            les 5 écrans, pilotés par props + callbacks (référence)
  FONTS-AND-ICONS.md  intégration polices et règles emojis
```

## Brancher

```tsx
import { TamaguiProvider, Theme } from 'tamagui';
import { config } from './design-system';
import { HomeScreen } from './design-system/screens';
import { walks } from './design-system/mocks';

export default function App() {
  return (
    <TamaguiProvider config={config} defaultTheme="light">
      <HomeScreen walks={walks} onPressWalk={(w) => nav.navigate('Walk', { id: w.id })} />
    </TamaguiProvider>
  );
}
```

Thème sombre : `defaultTheme="dark"` ou `useColorScheme()`. Les composants ne
lisent que des tokens sémantiques, donc rien d'autre à changer.

Sous-thèmes de statut : `<Theme name="confirmed">…</Theme>` repointe
`$accent`, `$accentText`, `$accentSoft`, `$accentSoftText`.
`StatusBadge`, `QuotaBadge`, `QuotaBar` et `RsvpSheet` s'en servent déjà.

## Callbacks par écran

| Écran | Props |
|---|---|
| `HomeScreen` | `walks`, `onPressWalk`, `onCreateWalk`, `onPressProfile` |
| `WalkDetailScreen` | `walk`, `onBack`, `onRespond(status)`, `onPressParticipant(id)` |
| `CreateWalkScreen` | `friends`, `myDogs`, `initial`, `onClose`, `onPickDateTime()`, `onSubmit(draft)` |
| `MyDogsScreen` | `dogs`, `onPressDog`, `onAddDog` |
| `OnboardingUsernameScreen` | `isAvailable`, `checking`, `onChangeUsername`, `onPickPhoto()`, `onSubmit({username, photoUri})` |

Aucun écran ne fait d'appel réseau ni de navigation : ils remontent tout par
callback. L'état de formulaire de `CreateWalkScreen` et
`OnboardingUsernameScreen` est local, volontairement — passe `initial` pour
le préremplir.

## Les états vides

`HomeScreen` et `MyDogsScreen` basculent seuls sur `EmptyState` quand la
liste est vide. Le CTA de l'état vide déclenche le même callback que le CTA
principal.
