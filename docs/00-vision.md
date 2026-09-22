# 🦮 Vision — Vadrouille

## Pitch
**Vadrouille** — appli mobile permettant d'organiser des balades de chiens entre amis : créer son compte, gérer ses chiens (y compris en foyer partagé), gérer ses amis, proposer des balades (heure/lieu/durée), être notifié et répondre (oui/non/peut-être).

## Documentation du projet

| Document | Contenu |
|---|---|
| `00-vision.md` (ce document) | Pitch, stack macro, fonctionnalités MVP, flux narratif |
| `architecture-technique.md` | DDD/Clean Architecture, stack d'implémentation, setup dev local, tests/TDD |
| `modele-de-donnees.md` | Schéma des tables, règles métier (quota, fenêtre de réponse, reprogrammation), politiques RLS complètes |
| `design-system.md` | Tamagui, tokens, conventions UI |
| `account.docs.md`, `dog.docs.md`, `friend.docs.md`, `walk.docs.md` | Specs fonctionnelles par domaine — vivent dans le repo, co-localisées avec le code (`src/<domaine>/<domaine>.docs.md`) |
| `rgpd-securite.md` | Auth, consentement, droit à l'oubli |
| `distribution.md` | Dev local → cercle privé (amis) → publication stores |
| `roadmap.md` | Fonctionnalités post-MVP |

## Stack retenue (vue d'ensemble)

| Brique | Choix |
|---|---|
| Backend / DB | Supabase (Postgres + Auth + Realtime + RLS) |
| Mobile | React Native + TypeScript, Expo (managed) |
| Navigation | Expo Router (file-based) |
| Gestionnaire de paquets | pnpm |
| Structure de repo | Repo unique (4 couches en dossiers) |
| UI | Tamagui |
| Auth | Magic Link (email, sans mot de passe) |
| Dev local | Docker via `supabase start` |
| Architecture applicative | DDD + Clean Architecture |
| État UI | Zustand |
| État serveur / cache | TanStack Query (React Query) |
| Injection de dépendances | Container manuel (composition root) |
| Tests | Vitest, écrits en Given/When/Then |
| Validation | Zod |
| Backend custom | 2 Edge Functions (push, suppression de compte) |

*Détails d'implémentation → `architecture-technique.md`.*

## Fonctionnalités MVP

- Auth par Magic Link
- CRUD chiens (création, édition, suppression par l'owner), avec partage de propriété (foyer partagé, sur invitation acceptée) et photo
- Ajout d'amis par code personnel permanent, consultation de la liste d'amis
- Création de balade : lieu (texte libre), heure de départ, durée — l'organisateur est auto-inscrit comme participant `'yes'` et sélectionne ses chiens dès la création
- Invitation libre parmi tous ses amis
- Consultation de la liste des balades à venir et du détail d'une balade (participants, chiens confirmés), avec mise à jour en direct (Realtime)
- Modification de balade avec re-confirmation globale
- Notification push (invitation à une balade, reprogrammation, invitation de co-ownership)
- Réponse oui / non / peut-être ; confirmation des chiens partagée entre co-owners, quota 10, verrouillage H+5min
- Suppression de compte (droit à l'oubli RGPD)
- Photo de profil utilisateur, édition du profil (pseudo, photo)
- Déconnexion (logout, sans suppression de compte)

*Détails et edge cases → `account.docs.md`, `dog.docs.md`, `friend.docs.md`, `walk.docs.md`.*

## Nom de l'application

Nom retenu : **Vadrouille**. Décision actée — a remplacé le placeholder technique `dogwalk-app` utilisé jusqu'ici dans le scaffolding (repo, slug Expo, bundle identifier, projet Supabase).

⚠️ Point encore ouvert : la vérification de disponibilité (domaine + stores + antériorité) reste à faire avant toute publication publique — voir `distribution.md`. Non bloquant pour la phase actuelle (dev local / cercle privé), mais à traiter avant de passer en phase 3.

## Flux narratif — "inviter des amis à une balade"

1. Organisateur crée une balade → sélectionne ses chiens (auto-confirmé `'yes'`) et des amis à inviter
2. Chaque ami reçoit une invitation (`pending`) et une notification push
3. Chaque invité répond (oui/non/peut-être) puis, si "oui", confirme lesquels de ses chiens viennent (partagé avec ses co-owners éventuels), sous réserve du quota de 10 chiens et de la fenêtre de réponse (verrouillage 5 min après le départ)
4. L'organisateur peut reprogrammer (heure/lieu/durée) → toutes les réponses sont réinitialisées et tout le monde est re-notifié
5. Les mises à jour de réponses s'affichent en direct (Realtime) pour tous les participants
