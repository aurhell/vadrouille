# Polices & icônes — Vadrouille (Direction A)

## Polices

Deux familles, rien de plus.

| Rôle | Famille | Graisses | Usage |
|---|---|---|---|
| `$heading` | Baloo 2 | 600, 700, 800 | titres d'écran, titres de carte, valeurs (heure, quota) |
| `$body` | Nunito | 400, 600, 700, 800 | corps, libellés, boutons, badges |

Fichiers à récupérer sur Google Fonts (licence OFL, redistribuable dans l'app) :

```
Baloo2-SemiBold.ttf   Baloo2-Bold.ttf   Baloo2-ExtraBold.ttf
Nunito-Regular.ttf    Nunito-SemiBold.ttf   Nunito-Bold.ttf   Nunito-ExtraBold.ttf
```

### Expo

```tsx
import { useFonts } from 'expo-font';

const [loaded] = useFonts({
  'Baloo2-SemiBold': require('./assets/fonts/Baloo2-SemiBold.ttf'),
  'Baloo2-Bold': require('./assets/fonts/Baloo2-Bold.ttf'),
  'Baloo2-ExtraBold': require('./assets/fonts/Baloo2-ExtraBold.ttf'),
  'Nunito-Regular': require('./assets/fonts/Nunito-Regular.ttf'),
  'Nunito-SemiBold': require('./assets/fonts/Nunito-SemiBold.ttf'),
  'Nunito-Bold': require('./assets/fonts/Nunito-Bold.ttf'),
  'Nunito-ExtraBold': require('./assets/fonts/Nunito-ExtraBold.ttf'),
});
if (!loaded) return null;
```

### React Native CLI

Poser les .ttf dans `assets/fonts/`, déclarer `"assets": ["./assets/fonts"]` dans
`react-native.config.js`, puis `npx react-native-asset`. Les noms de fichiers
doivent correspondre exactement aux clés `face` de `tamagui.config.ts`.

Le mapping des graisses est déjà fait dans `createFont` : en écrivant
`fontWeight="800"` sur un `Display`, Tamagui charge `Baloo2-ExtraBold`.
Ne jamais utiliser `fontFamily` en dur dans un écran — passer par
`Display`, `Title`, `Body`, `Label`.

## Icônes

Choix retenu : **emojis natifs**, pas de librairie d'icônes.

- Les emojis sont rendus par la police système : pas d'asset, pas de teinte possible.
- Un emoji n'est jamais seul porteur de sens : il accompagne toujours un mot
  (`8/10 🐕`, `Oui 🦮`) ou reste décoratif.
- Toujours `numberOfLines={1}` sur un texte qui contient un emoji à l'intérieur
  d'une pastille : sinon l'emoji passe à la ligne et sort du fond arrondi.
- Les chevrons et coches sont des caractères typographiques (`›`, `✓`, `✕`,
  `▾`, `＋`), rendus dans Nunito — ils héritent de la couleur du texte.
- Marquer les emojis décoratifs `accessibilityElementsHidden` /
  `importantForAccessibility="no"`, et donner un `accessibilityLabel` explicite
  aux pressables qui n'affichent qu'un glyphe (`✕` → « Fermer »).

Set utilisé dans l'app : 🦮 (marque, balades) · 🐕 (quota chiens) · 📍 (lieu) ·
⏳ (en attente) · 🖼 (photo choisie).

Si un besoin d'icônes vectorielles apparaît (navigation, réglages),
ajouter `@tamagui/lucide-icons` : les icônes acceptent `color="$colorSubtle"`
et `size` comme n'importe quel token.
