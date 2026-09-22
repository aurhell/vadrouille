# 🏗️ Architecture technique — Vadrouille

## Backend

Le principe "zéro API custom" tient presque entièrement : RLS (Row Level Security) porte toute la logique d'autorisation, et le client mobile parle directement au SDK Supabase.

Une exception incontournable (privilège que le client ne doit jamais avoir) :

1. **Suppression de compte (RGPD)** — nécessite `service_role`, donc une Edge Function dédiée, appelée par l'utilisateur authentifié, qui vérifie que le `user_id` correspond au token puis exécute la cascade de suppression (détail → `rgpd-securite.md`)

Deux exceptions plus légères, chacune traitée par une **fonction Postgres `SECURITY DEFINER`**, pas une Edge Function à part entière :

- **Rédemption d'un code d'invitation** — pas de SELECT client sur `profiles.invite_code` (sinon n'importe qui peut lister tous les codes et casser le modèle "il faut que ton ami te partage son code"). RPC `redeem_invite_code(code)` : vérifie le code, bloque l'auto-rédemption, et crée les deux lignes `friendships` (relation bidirectionnelle) en une transaction. Détail → `modele-de-donnees.md` §Politiques d'accès.
- **Notification push** — trigger DB sur `walk_participants` (invitation) / `walks` (reprogrammation) / `dog_owners` (co-ownership) / `friendships` (demande d'ami), chacun `SECURITY DEFINER`, qui appelle directement l'API Expo Push (`https://exp.host/--/api/v2/push/send`) via `pg_net`. Pas d'Edge Function intermédiaire : contrairement à la suppression de compte, l'API Expo Push ne demande aucun secret côté serveur, donc un relai n'aurait fait qu'ajouter une URL et un secret internes à gérer différemment entre le dev local et le cloud, pour la même unique requête HTTP que le trigger peut déjà émettre lui-même. Détail → migration `push_notifications.sql` et `modele-de-donnees.md` §Notifications push. Un token par utilisateur (pas de fan-out multi-appareil au MVP) dans `push_tokens`, RLS scoping strict à `auth.uid()` côté client (la lecture cross-utilisateur ne se fait que depuis les fonctions `SECURITY DEFINER`). Seule la notification "Balade annulée" (suppression de compte) part de l'Edge Function `delete-account` elle-même, qui a déjà un contexte `service_role` — même appel direct à Expo, pas de second hop non plus.

Tout le reste (CRUD chiens, amis, balades, réponses) reste 100% client-side, protégé par RLS.

## Pourquoi Expo plutôt que RN "bare"

- Le service **Expo Push** unifie FCM (Android) et APNs (iOS) derrière une seule API — gain de temps important pour ce périmètre, cohérent avec la contrainte de simplicité de stack.
- `expo-notifications` gère l'enregistrement des tokens et les permissions sans configuration native manuelle.
- Le dev local reste simple (Expo Dev Client / Expo Go), Docker sert uniquement à la stack Supabase locale — pas de conflit entre les deux.
- Reste "ejectable" vers du bare RN si un jour un module natif non supporté par Expo est nécessaire (config plugins).

## Architecture applicative — DDD + Clean Architecture (feature-first)

Expo Router impose un dossier `app/` à la racine pour le routing file-based. On le garde **volontairement fin** : chaque fichier de route se contente d'importer et de rendre l'écran correspondant depuis la feature concernée, sans logique.

Chaque **feature** (`dog`, `walk`, `friend`, `account`) est un dossier autonome contenant ses propres 4 couches Clean Architecture — cohérent partout, pas de mélange de styles :

```
app/                          # routes Expo Router — fichiers fins, délèguent aux features
  (auth)/
    login.tsx                 # → rend <LoginScreen /> depuis src/account/presentation/screens
    onboarding.tsx
  (tabs)/
    index.tsx                  # → rend <WalksListScreen /> — écran par défaut, pas de page d'accueil séparée
    dogs.tsx                   # → src/dog/presentation/screens
    friends.tsx                # → src/friend/presentation/screens
    profile.tsx                # → src/account/presentation/screens
  walks/
    [id].tsx                   # → rend <WalkDetailScreen />, poussé depuis l'onglet Balades
    new.tsx
  dogs/
    [id].tsx                   # → rend <DogFormScreen />, poussé depuis l'onglet Chiens
    new.tsx
  _layout.tsx                  # layout racine (providers : TanStack Query, DI, thème Tamagui)

src/
  dog/
    dog.docs.md                 # specs fonctionnelles (source de vérité, voir §Documentation des specs)
    domain/
      entities/                 # Dog
      repositories/               # DogRepository (interface/port)
    application/
      use-cases/                 # AddDog, UpdateDog, DeleteDog, InviteCoOwner, RespondToCoOwnerInvite...
      dto/
    infrastructure/
      supabase/                   # SupabaseDogRepository, InMemoryDogRepository (test double)
    presentation/
      screens/ components/ hooks/

  walk/
    walk.docs.md
    domain/
      entities/                 # Walk
      value-objects/             # WalkStatus, WalkDogStatus...
      policies/                  # WalkCapacityPolicy, ResponseWindowPolicy, WalkEditPolicy
      repositories/
    application/
      use-cases/                 # CreateWalk, RescheduleWalk, RespondToWalkInvite, ToggleDogForWalk...
      dto/
    infrastructure/
      supabase/
    presentation/
      screens/ components/ hooks/

  friend/
    friend.docs.md
    domain/ application/ infrastructure/ presentation/   # même structure

  account/
    account.docs.md
    domain/ application/ infrastructure/ presentation/   # même structure

  shared/                        # transverse, n'appartient à aucune feature
    di/                          # composition root — assemble les repositories de toutes les features
    ui/                          # composants Tamagui génériques (Button, Card...) réutilisés partout
    stores/                      # état UI vraiment cross-feature (rare — la plupart du state Zustand vit dans la feature concernée)
```

**Règle de dépendance** (au sein de chaque feature) : `presentation` → `application` → `domain` ← `infrastructure`. Le domaine ne connaît jamais Supabase. Une feature peut dépendre du `domain`/`application` d'une autre feature si le métier l'exige (ex: `walk/application` dépend de `dog/domain` et `friend/domain` pour valider qu'un chien/ami existe) — mais jamais de sa `presentation` ni de son `infrastructure`.

**Garde-fou pragmatique** : ne pas créer un repository/use-case séparé pour chaque micro-opération CRUD triviale. Regrouper par agrégat métier. L'objectif est la testabilité et le découplage vis-à-vis de Supabase, pas la multiplication des fichiers.

## Documentation des specs — versionnées avec le code

Les spécifications fonctionnelles (user stories + Gherkin) vivent **dans le repo**, co-localisées avec la feature qu'elles décrivent : un fichier `<feature>.docs.md` à la racine de chaque dossier de `src/` (`src/dog/dog.docs.md`, `src/walk/walk.docs.md`, `src/friend/friend.docs.md`, `src/account/account.docs.md`).

**Pourquoi** : une règle métier qui évolue et un fichier de specs qui décrit cette règle changent dans le **même commit**, donc la doc ne peut pas dériver silencieusement du code au fil du temps — contrairement à une doc externe (Notion, Confluence...) que personne ne pense à rouvrir.

**Script d'agrégation** : `scripts/build-specs.ts` (exécuté via `pnpm specs:build`) parcourt `src/*/*.docs.md` et concatène le tout en un seul document lisible, généré à la demande (pas committé — se régénère en une commande, évite un fichier dupliqué qui pourrait diverger des sources).

**Un tag git = une version de l'app + les specs correspondantes** : comme les `.docs.md` sont versionnés avec le code, checkout n'importe quel tag (`git checkout v0.3.0`) donne exactement les specs telles qu'elles étaient à cette version — aucune synchronisation manuelle à faire. En bonus, à la création d'un tag de release, `pnpm specs:build` peut être lancé pour attacher le document agrégé comme asset de la GitHub Release correspondante (lisible sans cloner le repo).

## Choix d'implémentation

| Sujet | Choix | Raisonnement |
|---|---|---|
| État UI | **Zustand** | Peu de boilerplate, pas de ceremony de Provider (contrairement à Context API pur), plus léger que Redux Toolkit pour la taille du projet |
| État serveur / cache | **TanStack Query** | Cache + gestion loading/error automatique autour des repositories ; s'intègre naturellement avec Realtime (invalidation du cache sur événement) |
| Injection de dépendances | **Container manuel** (composition root dans `shared/di/`) | Les libs de DI (tsyringe, InversifyJS) reposent sur decorators + `reflect-metadata`, source de frictions connues avec Metro (bundler RN/Expo) ; un wiring manuel reste 100% typé et trivial à tracer pour la taille de ce projet. Le container assemble les repositories concrets de toutes les features et les injecte dans les use-cases |
| Validation | **Zod** | Aux deux frontières naturelles : formulaires en `presentation`, DTOs en entrée des use-cases en `application`. Le `domain` reste du TypeScript pur, sans dépendance externe |

## Dev local

- Gestionnaire de paquets : **pnpm**
- Stack Supabase locale complète via Docker (`supabase start`) : Postgres, Auth, Storage, Realtime, Studio
- Migrations gérées via la CLI Supabase
- L'application Expo tourne indépendamment de Docker (Expo Dev Client / Expo Go), pointant vers l'instance Supabase locale en dev
- ⚠️ **Push notifications** : Expo Go ne supporte plus les notifications push à distance — un **EAS development build** est nécessaire dès qu'on veut tester ce flow (pas d'impact sur le code, juste sur le setup de test). Le simulateur iOS ne peut de toute façon jamais recevoir de push distante, build EAS ou pas (aucune identité APNs possible sans matériel réel) — seul un vrai iPhone en reçoit côté iOS ; côté Android, l'émulateur fonctionne (un vrai token FCM peut y être obtenu).

## Tests

**Vitest** comme test runner, sur toutes les couches (`domain`, `application` en priorité — logique pure, rapide à tester ; `infrastructure`/`presentation` où pertinent).

**TDD** : le test est écrit **avant** l'implémentation — cycle red/green/refactor, en particulier sur `domain` (entités, policies) et `application` (use-cases), là où la logique métier se concentre. Le titre du test en Given/When/Then (voir convention ci-dessous) se rédige directement à partir du scénario Gherkin correspondant dans le `<domaine>.docs.md` concerné, avant d'écrire le code qui le fait passer.

**Convention d'écriture — Gherkin via les primitives natives de Vitest**, sans framework BDD dédié (pas de fichiers `.feature`/Cucumber) : le "Given" devient un `describe` imbriqué, le "When ... Then ..." devient le titre du `test`. Ça garde une traçabilité directe avec les scénarios Gherkin des `*.docs.md`, sans dépendance supplémentaire.

```ts
import { describe, expect, test, beforeEach } from "vitest"
import { InMemoryDogRepository } from "./dogs.repository"
import { createDogFixture } from "../fixtures/dogs.entity.fixture"

describe("InMemoryDogRepository", () => {
  let repository: InMemoryDogRepository

  beforeEach(() => {
    repository = new InMemoryDogRepository()
  })

  describe("Given a new dog to save", () => {
    test("When I save the dog, Then it should be persisted with a generated ID", async () => {
      const result = await repository.save(createDogFixture)
      expect(result.id).toBeDefined()
    })
  })
})
```

**Conventions associées** (reprises d'un projet précédent de l'auteur) :
- Fichiers de test **colocalisés**, suffixe `.spec.ts` (ex: `dogs.repository.ts` + `dogs.repository.spec.ts` dans le même dossier)
- **Fixtures** : factories de données de test réutilisables et surchargeables (`{ ...createDogFixture, name: "Buddy" }`), dans un dossier `fixtures/` par agrégat, suffixe `.fixture.ts`
- **Repositories in-memory** comme test double pour tester `application`/`use-cases` sans dépendre de Supabase : chaque repository concret (`<feature>/infrastructure/supabase/...`) a un pendant in-memory implémentant la même interface (`<feature>/domain/repositories/`), utilisé uniquement dans les tests

## Ordre d'implémentation suggéré

Les 4 domaines ont des dépendances entre eux — `walk` a besoin que `dog` et `friend` existent déjà (une balade sélectionne des chiens et invite des amis). Séquence recommandée :

1. **`account`** — tout dépend de l'authentification pour exister (RLS, `auth.uid()`)
2. **`friend`** — pas de dépendance vers un autre domaine métier
3. **`dog`** — dépend de `friend` (invitation de co-owner réservée aux amis)
4. **`walk`** — dépend de `dog` et `friend` (sélection de chiens et d'amis à la création)

Au sein de chaque domaine, cycle TDD classique : écrire le test du scénario Gherkin le plus simple du `.docs.md` correspondant (souvent le scénario nominal), le faire passer, puis enchaîner sur les edge cases un par un.
