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

# Config de l'app : URL + clé publiable du backend local
cp .env.example .env
# → EXPO_PUBLIC_SUPABASE_ANON_KEY : le PUBLISHABLE_KEY affiché par `supabase status -o json`
# → EXPO_PUBLIC_SUPABASE_URL : sur téléphone physique, remplacer 127.0.0.1 par l'IP LAN du
#   Mac (`ipconfig getifaddr en0`) — 127.0.0.1 sur le téléphone pointe vers le téléphone,
#   pas vers le Mac. Le simulateur/émulateur n'a pas ce problème.

# Démarrer l'app (Expo Router)
pnpm dev
```

⚠️ Les notifications push ne fonctionnent pas dans Expo Go — nécessite un EAS development build. Détail → `distribution.md`.

## Stack Supabase locale

`supabase start` fait tourner toute la stack (Postgres, Auth, Storage, Realtime, Studio) dans des conteneurs Docker gérés directement par la CLI Supabase — il n'y a pas de `docker-compose.yml` dans ce repo : la CLI génère et pilote elle-même sa propre config Docker à partir de `supabase/config.toml`. Ajouter un compose maison en plus ferait doublon et risquerait de diverger des versions d'images attendues par la CLI.

**Commandes utiles**

```bash
supabase start    # démarre la stack (idempotent, ne recrée pas si déjà up)
supabase stop      # arrête les conteneurs
supabase status    # réaffiche URLs/ports/clés sans redémarrer
supabase db reset  # rejoue toutes les migrations depuis zéro (⚠️ efface les données locales)
```

**Ports locaux** (définis dans `supabase/config.toml`, modifiables si conflit avec un autre projet) :

| Service | URL |
|---|---|
| API (REST/Auth/Storage/Realtime, via Kong) | http://127.0.0.1:54321 |
| Postgres | postgresql://postgres:postgres@127.0.0.1:54322/postgres |
| Studio (UI web) | http://127.0.0.1:54323 |
| Mailpit (emails Magic Link interceptés) | http://127.0.0.1:54324 |

**Config & schéma**

- `supabase/config.toml` — configuration de la stack (ports, auth, storage...), versionné.
- `supabase/migrations/*.sql` — schéma + RLS complets, appliqués dans l'ordre du nom de fichier par `supabase db reset` / `supabase db push`. Détail des règles métier et des politiques → `modele-de-donnees.md`.
- `supabase/.branches`, `supabase/.temp`, `supabase/.env` — état local généré par la CLI, gitignorés.

## Tests

```bash
pnpm test
```

Convention : Vitest, écrit en TDD, tests nommés en Given/When/Then (`describe("Given ...")` / `test("When ..., Then ...")`). Détail → `architecture-technique.md` §Tests.

## Se connecter en dev sans passer par l'email

```bash
pnpm dev:login          # crée/réutilise dev@vadrouille.test, imprime un lien à coller
pnpm dev:login --reset  # supprime le compte fixture d'abord (repart sur un onboarding vierge)
```

Court-circuite le round-trip email/Mailpit : colle le lien imprimé dans l'encadré pointillé
"DEV" de l'écran de connexion (visible uniquement en dev). Voir aussi
`src/account/presentation/screens/dev-paste-magic-link.tsx` et `supabase/config.toml` §`[auth]`
pour le pourquoi (limite connue d'Expo Go + bug amont GoTrue sur `emailRedirectTo`).

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
