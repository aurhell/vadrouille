# vadrouille

Appli mobile permettant d'organiser des balades de chiens entre amis. Voir `00-vision.md` pour le pitch complet.

> Repo, slug Expo (`app.config.ts`), bundle identifier et projet Supabase à nommer `vadrouille` / `vadrouille-app` selon la convention retenue — anciennement scaffoldés sous le placeholder `dogwalk-app`.

## Stack

React Native + TypeScript (Expo, Expo Router) · Supabase (Postgres/Auth/Realtime/Storage/RLS) · Tamagui · Zustand + TanStack Query · Vitest · DDD/Clean Architecture.

Détail complet → `architecture-technique.md`.

## Prérequis

- Node.js + [pnpm](https://pnpm.io)
- [Docker](https://www.docker.com/) (stack Supabase locale)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [EAS CLI](https://docs.expo.dev/eas/) (pour les builds — pas nécessaire en dev local pur)

## Setup

```bash
pnpm install

# Démarrer le backend local (Postgres, Auth, Storage, Realtime, Studio)
supabase start

# Appliquer les migrations du schéma (voir modele-de-donnees.md)
supabase db reset

# Démarrer l'app (Expo Router)
pnpm dev
```

⚠️ Les notifications push ne fonctionnent pas dans Expo Go — nécessite un EAS development build. Détail → `distribution.md`.

## Tests

```bash
pnpm test
```

Convention : Vitest, écrit en TDD, tests nommés en Given/When/Then (`describe("Given ...")` / `test("When ..., Then ...")`). Détail → `architecture-technique.md` §Tests.

## Documentation du projet

| Document | Contenu |
|---|---|
| `00-vision.md` | Pitch, stack macro, fonctionnalités MVP, flux narratif |
| `architecture-technique.md` | DDD/Clean Architecture, stack d'implémentation, setup dev local, tests/TDD, ordre d'implémentation suggéré |
| `modele-de-donnees.md` | Schéma des tables, règles métier (quota, fenêtre de réponse, reprogrammation), politiques RLS complètes |
| `design-system.md` | Tamagui, tokens, conventions UI |
| `account.docs.md`, `dog.docs.md`, `friend.docs.md`, `walk.docs.md` | Specs fonctionnelles par domaine (`src/domain/<domaine>/`) |
| `rgpd-securite.md` | Auth, consentement, droit à l'oubli |
| `distribution.md` | Dev local → cercle privé (amis) → publication stores |
| `roadmap.md` | Fonctionnalités post-MVP |

## Structure

```
app/              # routes Expo Router (fines, délèguent aux features)
src/
  dog/            # feature autonome : domain/ application/ infrastructure/ presentation/ + dog.docs.md
  walk/           # idem
  friend/         # idem
  account/        # idem
  shared/         # transverse : di/ (composition root), ui/ (composants Tamagui génériques)
```

Chaque feature contient ses 4 couches Clean Architecture (même structure partout) — détail → `architecture-technique.md`.
