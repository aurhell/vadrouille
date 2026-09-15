# 🎨 Design system — Vadrouille

Direction retenue : **A — « Ludique & coloré »**. Formes pleines, coins très arrondis, aplats de couleur vive. Généré via Claude Design, à partir de 3 propositions comparées sur 5 écrans clés.

📄 Version visuelle complète (palette, thèmes, composants, écrans de référence en image) → [`design-system/index.html`](./design-system/index.html) — `pnpm design-system` puis http://localhost:4040.

## Choix technique

Stack : **TypeScript · Tamagui**. API des composants en anglais, copie affichée en français. **11 composants**, **5 écrans** de référence (Home, WalkDetail, CreateWalk, MyDogs, Onboarding).

```
design-system/
├── tamagui.config.ts   # createTamagui : fonts, animations, shorthands, media
├── tokens.ts            # palette, space, size, radius, zIndex
├── themes.ts             # light, dark + 8 sous-thèmes de statut
├── types.ts               # Walk, Dog, Friend, WalkParticipant, RsvpStatus
├── mocks.ts                # données de démo, libellés FR, formatteurs
├── components/              # 11 briques + index.ts
├── screens/                  # Home, WalkDetail, CreateWalk, MyDogs, Onboarding
├── FONTS-AND-ICONS.md
└── README.md                 # branchement + table des callbacks par écran
```

## 1. Couleurs — palette et rôles

Les composants ne référencent **jamais une couleur brute** — toujours un token sémantique, ce qui rend les thèmes interchangeables.

| Nom | Hex | Token | Rôle |
|---|---|---|---|
| Coral 500 | `#FF6B4A` | `$accent` | Action principale (une par écran), heures/dates dans les cartes, fond du header d'onboarding |
| Amber 500 | `#FFC145` | `$warning` | "Peut-être", cadres de photo de chien, bordures pointillées d'ajout — devient `$accent` en thème sombre |
| Teal 500 | `#3FBFA8` | `$success` | Confirmé, sélection acquise, quota rempli, foyer partagé |
| Brown 800 | `#2B2118` | `$color` | Encre — brun chaud, jamais de noir pur (casserait la chaleur de la DA) |
| Cream 100 | `#FFF7F0` | `$background` | Fond d'écran (les cartes sont en blanc pur = `$backgroundStrong`, pour se détacher) |
| Brown 500 | `#8A7A6C` | `$colorSubtle` | Texte secondaire, libellés de champ, métadonnées — 4,6:1 sur fond crème |

## 2. Thèmes — clair et sombre, token par token

Le thème sombre est une **« nuit chaude »** : fond aubergine/brun, ambre promu accent principal. Le corail perd trop de contraste sur aubergine, il ne sert plus qu'au danger.

| Token | Light | Dark | Rôle |
|---|---|---|---|
| `$background` | `#FFF7F0` | `#1B1218` | Fond d'écran |
| `$backgroundStrong` | `#FFFFFF` | `#251A21` | Surface de carte |
| `$color` | `#2B2118` | `#F7EDE4` | Encre principale |
| `$colorSubtle` | `#8A7A6C` | `#B5A08F` | Texte secondaire |
| `$accent` | `#FF6B4A` | `#FFC145` | Action principale |
| `$accentText` | `#FFFFFF` | `#241019` | Texte sur `$accent` |
| `$borderColor` | `#EADDD0` | `#3B2A34` | Filets, cases à cocher vides |
| `$success` | `#3FBFA8` | `#4FD2B8` | Confirmé, sélection |
| `$danger` | `#E8542F` | `#FF8A6A` | Décliné, erreur de champ |

**Sous-thèmes de statut** : les 4 statuts de réponse (`confirmed`/`maybe`/`declined`/`pending`) existent en sous-thèmes Tamagui (`light_confirmed`, `dark_confirmed`, etc. — 8 au total). Ils ne surchargent que les 4 tokens d'accent : tout composant stylé sur `$accent` réagit automatiquement en étant enveloppé dans le bon `<Theme name="...">`.

## 3. Typographie — deux familles, quatre composants texte

Aucun écran n'écrit `fontFamily` en dur : tout passe par les composants `Display`, `Title`, `Body`, `Label`.

| Composant | Style | Usage |
|---|---|---|
| `Display size="lg"` | Baloo 2 ExtraBold, 34/36 | Écrans d'accueil de flow (ex: "Bienvenue sur Vadrouille") |
| `Display size="md"` | Baloo 2 ExtraBold, 30/31 | Titre d'écran (ex: "Balades 🦮") |
| `Title size="lg"` | Baloo 2 Bold, 20/23 | Titre de carte (ex: "Parc de la Tête d'Or") |
| `Body size="lg"` | Nunito SemiBold, 16/24 | Corps de texte |
| `Body size="md" tone="subtle"` | Nunito SemiBold, 14/21 | Métadonnées (dates, heures) |
| `Label` | Nunito ExtraBold, 13/17 | Libellés de champ/section |

`IBM Plex Mono` en usage ponctuel technique (quotas, codes, étiquettes de spec) — pas dans les parcours utilisateur classiques.

## 4. Espacements, rayons, élévation — grille de 4pt

**Espacements** : `$1`=4 · `$2`=8 · `$3`=12 · `$4`=16 · `$5`=20 · `$6`=24 · `$7`=32. `$4` = gouttière interne d'une carte, `$5` = marge latérale d'écran, `$6` = respiration entre blocs.

**Rayons** : `$2`=12 · `$3`=18 · `$4`=22 · `$5`=26 · `round`=999. `$5` pour les cartes, `$4` pour champs et boutons secondaires, `round` pour boutons primaires, pastilles et avatars.

**Élévation** : deux ombres seulement — une neutre pour les cartes (`0 6px 18px rgba(43,33,24,.08)`), une teintée par sa propre couleur pour le bouton primaire (`0 10px 22px rgba(255,107,74,.38)`). En thème sombre, l'ombre passe en noir à 45%.

## 5. Composants (11)

| Composant | Props clés | Règle |
|---|---|---|
| `Button` | `variant`: primary/secondary/dashed · `size`: lg/md/sm | Un seul `primary` par écran. Hauteur min 44px sur les trois tailles |
| `StatusBadge` / `QuotaBadge` | `status`: confirmed/maybe/declined/pending · `emphasis`: soft/solid | Couleur du quota calculée par ratio : ≥70% = confirmé, ≥40% = peut-être, en dessous = décliné |
| `Avatar` / `AvatarStack` | `size`: sm/md/lg | Teinte auto-dérivée de l'id utilisateur — un ami garde sa couleur d'un écran à l'autre |
| `QuotaBar` | `current` · `total` · `label` | Jamais seule : toujours accompagnée du chiffre écrit (accessibilité) |
| `TextField` | `state`: default/filled/error | — |
| `ChoiceChipGroup` | `options` · `value` · `onChange` | Sélection unique, pastille active en accent plein (pas juste une bordure) |
| `DogPhoto` | `shape`: round/card · `size` · `selected` | Rond = un chien dans une balade. Carré arrondi = une fiche ouvrable |
| `RsvpSheet` | `value` · `prompt` · `onChange` | Barre ancrée en bas du détail de balade — répondre ne demande jamais de scroller |
| `Card` (shared) | `interactive`/`shared`/`flat` | Le pointillé turquoise ne signifie qu'une chose dans toute l'app : co-propriété |
| `EmptyState` | `emoji` · `title` · `body` · `actionLabel` | Même CTA que l'écran plein — jamais une impasse |
| `ScreenHeader` | `tone`: plain/accent · `title` · `subtitle` · `onBack` · `right` | — |

## 6. Do / Don't

**À faire**
- Un seul bouton primaire par écran, en bas, pleine largeur ou centré
- Toujours doubler la couleur d'un statut par un mot **et** un glyphe
- Passer par les tokens sémantiques, même pour un usage ponctuel
- `numberOfLines={1}` sur les textes de pastille contenant un emoji
- Donner un état vide à toute liste, avec le même CTA que l'écran plein

**À éviter**
- Empiler corail, ambre et turquoise en aplats dans un même bloc
- Coder une couleur en dur (`#FF6B4A`) dans un écran : le thème sombre casse
- Utiliser le pointillé turquoise pour autre chose que le foyer partagé
- Réduire un bouton ou une pastille cliquable sous 44px de hauteur
- Mettre un emoji seul comme unique porteur de sens
- Ajouter une troisième famille de police ou une troisième ombre

## 7. Accessibilité

| Paire | Ratio | Verdict |
|---|---|---|
| `$color` sur `$background` | 12,4:1 | AAA |
| `$colorSubtle` sur `$background` | 4,6:1 | AA |
| `$accentText` sur `$accent` | 3,2:1 | AA large |
| `$accentSoftText` sur `$accentSoft` | 6,1:1 | AA |
| `successSoftText` sur `successSoft` | 5,4:1 | AA |

**Règles** :
- Texte sur aplat corail : blanc plein, taille 16 minimum, graisse 800 (le ratio 3,2:1 n'est conforme qu'en "large text"). Pour un libellé plus petit sur corail → `$accentSoft` + `$accentSoftText`
- Token `$tap = 44` : toute zone cliquable en hérite via `minHeight="$tap"`. Les glyphes seuls (✕, ‹) reçoivent un `hitSlop` de 12
- Aucune information portée par la couleur seule : les statuts cumulent teinte, glyphe et mot ; la barre de quota est toujours accompagnée du ratio écrit
- Emojis décoratifs masqués aux lecteurs d'écran, `accessibilityLabel` explicite sur les pressables sans texte

## Écrans de référence

5 écrans clés mockés servent de base à l'implémentation : **Home** (liste des balades), **WalkDetail** (détail + RSVP), **CreateWalk** (création), **MyDogs** (mes chiens, avec distinction foyer partagé), **Onboarding** (choix du pseudo). Maquettes sources : fichiers Claude Design fournis, direction A.
