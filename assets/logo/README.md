# Logo Vadrouille — « Le repère »

Une empreinte de patte posée dans un point de rendez-vous. La marque est la
fusion exacte des deux icônes d'onglet : le repère de **Balades** et la patte
de **Chiens**. Elle dit ce que fait l'appli — donner rendez-vous avec son
chien — plutôt que ce qu'est un chien.

## Contenu

```
logo/
├── svg/
│   ├── vadrouille-mark-coral.svg            marque corail, patte crème
│   ├── vadrouille-mark-cream-on-coral.svg   marque crème, patte corail
│   ├── vadrouille-mark-ink.svg              marque encre (docs, favicon)
│   ├── vadrouille-mark-cutout.svg           patte évidée — fond transparent
│   ├── vadrouille-mark-cutout-cream.svg     idem, en crème
│   ├── vadrouille-appicon-1024.svg          tuile iOS / store, 1024×1024
│   ├── vadrouille-adaptive-foreground.svg   Android adaptive, 432×432
│   ├── vadrouille-adaptive-background.svg   Android adaptive, aplat corail
│   └── vadrouille-lockup-horizontal.svg     marque + mot
├── VadrouilleLogo.tsx                       composants react-native-svg
└── README.md
```

## La patte est un évidement

C'est la seule règle à ne pas rater. La patte n'est pas blanche : elle est
**trouée**, donc elle prend la couleur du fond. Les deux versions `-cutout`
sont de vrais tracés à `fill-rule="evenodd"` et fonctionnent sur n'importe
quel fond, y compris une photo. Les autres fichiers ont le fond peint en dur.

En React Native, `background` doit valoir la couleur réelle de la surface :

```tsx
<VadrouilleMark size={76} color="#FF6B4A" background="#FFF7F0" />   // sur crème
<VadrouilleMark size={46} color="#FFF7F0" background="#FF6B4A" />   // sur corail
```

## Usage

```bash
npx expo install react-native-svg
```

```tsx
import { VadrouilleMark, VadrouilleLockup } from './logo/VadrouilleLogo';

// Écran de connexion
<VadrouilleLockup markSize={76} wordSize={38} />

// En-tête d'onboarding, sur le corail
<VadrouilleLockup
  direction="inline"
  markSize={46}
  wordSize={30}
  color="#FFF7F0"
  background="#FF6B4A"
  wordColor="#FFF7F0"
/>
```

Le mot est en **Baloo 2 ExtraBold**, déjà chargée par l'appli. Sur toute
surface qui ne charge pas la police — e-mail, favicon, export — utiliser le
SVG et vectoriser le texte.

## Tailles

| Usage | Marque | Mot |
|---|---|---|
| Splash, connexion | 76 px | 38 px |
| En-tête d'écran | 46 px | 30 px |
| Barre de navigation, avatar | 32 px | — |
| Favicon | 20 px minimum | — |

En dessous de **20 px** les orteils se referment : passer alors à la version
`-ink` ou n'utiliser que la goutte du repère. Jamais sous 16 px.

## Couleurs

| Contexte | Marque | Patte |
|---|---|---|
| Sur crème `#FFF7F0` | `#FF6B4A` | `#FFF7F0` |
| Sur blanc | `#FF6B4A` | `#FFFFFF` |
| Sur corail `#FF6B4A` | `#FFF7F0` | `#FF6B4A` |
| Monochrome, documents | `#2B2118` | fond du support |

Le corail `#FF6B4A` est une couleur de **surface**. Pour du texte ou une
icône d'interface sur blanc, c'est `#C8391A` qu'il faut (6,3:1) — mais la
marque est une forme, pas de l'encre : elle garde le corail vif.

## Zone de protection

Une marge libre égale à **un quart de la hauteur de la marque** sur les quatre
côtés. Rien ne s'y pose, pas même le mot : le lockup l'intègre déjà.

## À ne pas faire

- Recolorer la patte en blanc pur sur un fond crème — elle doit disparaître
  dans le fond, pas s'en détacher.
- Ajouter une ombre portée, un contour ou un dégradé.
- Étirer le lockup : la marque et le mot ont un rapport de taille fixe (2:1).
- Utiliser la marque sur une photo sans passer par la version `-cutout`.
- Incliner ou faire pivoter la marque.

## Icônes d'application

**iOS** — `vadrouille-appicon-1024.svg`, à exporter en PNG 1024×1024 sans
transparence. La marque occupe 62,5 % de la tuile : le masque arrondi ne mord rien.

**Android** — icône adaptative : `vadrouille-adaptive-foreground.svg` et
`vadrouille-adaptive-background.svg`. L'art tient dans le cercle de sécurité
de 66 dp, donc la marque survit aux masques ronds, carrés et squircle.

Dans `app.json` (Expo) :

```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-foreground.png",
        "backgroundColor": "#FF6B4A"
      }
    },
    "splash": {
      "image": "./assets/splash.png",
      "backgroundColor": "#FFF7F0",
      "resizeMode": "contain"
    }
  }
}
```

Les SVG sont fournis en source : rasteriser aux tailles voulues avec `sharp`,
`resvg` ou l'export de ton outil de design.
