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

## Tester sur le simulateur iOS

```bash
xcrun simctl list devices available   # lister les simulateurs installés
open -a Simulator                     # ouvre l'app Simulator (démarre le device par défaut)
pnpm dev                              # démarre Metro, puis appuyer sur "i" dans le terminal
```

`i` dans le terminal Metro build l'app et l'ouvre automatiquement dans Expo Go sur le
simulateur actuellement démarré (ou le démarre s'il n'y en a aucun). Pas besoin de Xcode.

### Ouvrir deux simulateurs en parallèle (tester les invitations entre deux comptes)

```bash
pnpm dev:dual                                    # alice@vadrouille.test + bob@vadrouille.test
pnpm dev:dual alice@x.test bob@x.test             # emails custom
pnpm dev:dual --reset                             # repart sur un onboarding vierge pour les deux
pnpm dev:dual --with-dogs                         # profils pré-créés (onboarding sauté), amis, un chien chacun
```

Une seule commande : démarre deux simulateurs iPhone de modèles différents (un seul modèle
d'iPhone ne peut être démarré qu'une fois), démarre Metro si besoin, installe Expo Go sur
chaque device s'il n'y est pas déjà, ouvre le projet dessus, puis crée les deux comptes
fixture et affiche un lien magique par device — à coller dans l'encadré pointillé "DEV" de
l'écran de connexion de chacun (voir section suivante). Idempotent : relançable sans tout
recréer si les simulateurs/Metro tournent déjà.

Par défaut : les deux premiers modèles d'iPhone disponibles sur la machine. Pour forcer des
modèles précis : `SIM_DEVICE_1="iPhone 14" SIM_DEVICE_2="iPhone 17 Pro" pnpm dev:dual`.

Sans `--with-dogs` : les deux comptes démarrent sans profil, donc sur l'onboarding — utile
pour tester ce flux. Une fois onboardés à la main, récupérer le code d'invitation d'un des
deux (Réglages → "Mon code d'invitation") et le rédimer depuis l'écran "Amis" de l'autre pour
tester la relation bidirectionnelle.

Avec `--with-dogs` : les deux comptes sautent l'onboarding (profil déjà créé), sont déjà amis
l'un de l'autre, et ont chacun un chien ("Rex" pour alice, "Milo" pour bob) — prêt à tester
une invitation de foyer partagé (co-ownership) entre les deux devices sans rien saisir à la
main. `--reset` avec `--with-dogs` nettoie aussi les chiens de la fixture (sinon
`dogs.created_by` passe à `NULL` au lieu d'être supprimé — voir `modele-de-donnees.md` — et
on se retrouve avec des chiens fantômes).

Détail → `scripts/dev-two-sims.mjs`.

## Se connecter en dev sans passer par l'email

```bash
pnpm dev:login          # crée/réutilise dev@vadrouille.test, imprime un lien à coller
pnpm dev:login --reset  # supprime le compte fixture d'abord (repart sur un onboarding vierge)
```

Court-circuite le round-trip email/Mailpit : colle le lien imprimé dans l'encadré pointillé
"DEV" de l'écran de connexion (visible uniquement en dev). Voir aussi
`src/account/presentation/screens/dev-paste-magic-link.tsx` et `supabase/config.toml` §`[auth]`
pour le pourquoi (limite connue d'Expo Go + bug amont GoTrue sur `emailRedirectTo`).

## Peupler un graphe d'amis pour tester

Tester l'écran "Amis" à la main est fastidieux (rédimer un code, accepter, refuser...) — ce
script peuple directement en base l'état complet dont tu as besoin, pas à pas dans l'UI :

```bash
pnpm dev:seed-friends                                       # dev@vadrouille.test : 2 amis acceptés, 2 invitations reçues, 2 envoyées
pnpm dev:seed-friends moi@x.test --accepted=3 --received=1 --sent=0   # comptes à la carte (0 = aucun)
pnpm dev:seed-friends --reset                                # repart avec un compte "moi" tout neuf
pnpm dev:reset-seed                                          # supabase db reset + seed par défaut, en une commande
```

Colle le lien imprimé dans l'encadré DEV comme pour `dev:login`. Les comptes en face sont
nommés pour s'y retrouver d'un coup d'œil : `friend_*` (amis acceptés), `incoming_*`
(t'ont envoyé une demande, "Invitations reçues"), `outgoing_*` (tu leur as envoyé une
demande, "Invitations envoyées"). Relancer la commande réinitialise juste ce graphe (le
compte "moi" est conservé sauf `--reset`) — rien d'autre dans la base n'est touché.

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
