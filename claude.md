# Vadrouille

App mobile pour organiser des balades de chiens entre amis. Stack : Expo (managed) + Expo Router, TypeScript, Tamagui, Zustand, TanStack Query, Zod, Supabase (Postgres + Auth + Realtime + Storage), pnpm.

Toute la doc de référence est dans `docs/`. La lire avant toute tâche substantielle — ne pas redécouvrir le projet par exploration du code.

- Vision & pitch : @docs/00-vision.md
- Architecture technique (feature-first, DDD-lite, Edge Functions, RPC) : @docs/architecture-technique.md
- Schéma de données + politiques RLS complètes : @docs/modele-de-donnees.md
- RGPD & sécurité : @docs/rgpd-securite.md
- Design system (tokens, composants, Tamagui) : @docs/design-system.md
- Distribution (TestFlight, Android) : @docs/distribution.md
- Roadmap post-MVP : @docs/roadmap.md
- Specs fonctionnelles par feature (Gherkin), co-localisées avec le code : @src/account/account.docs.md, @src/dog/dog.docs.md, @src/friend/friend.docs.md, @src/walk/walk.docs.md

## Architecture

Feature-first strict : `src/<feature>/{domain,application,infrastructure,presentation}/`, features = `account`, `friend`, `dog`, `walk`. `src/shared/` pour le cross-cutting réel uniquement (DI, composants UI génériques).

Règle de dépendance : `presentation → application → domain ← infrastructure` à l'intérieur d'une feature. Une feature peut dépendre du `domain`/`application` d'une autre (ex: `walk` → `dog`), **jamais** de sa `presentation`/`infrastructure`.

Chaque feature a un `<feature>.docs.md` co-localisé à sa racine — c'est la source de vérité fonctionnelle de cette feature, versionnée avec le code. Le mettre à jour si une règle métier change pendant l'implémentation.

Ordre d'implémentation : `account` → `friend` → `dog` → `walk` (ordre de dépendance).

## TDD

TDD strict : test avant implémentation. Vitest, style Gherkin via `describe`/`test` natifs — pas de Cucumber :

```ts
describe("Given ...", () => {
  test("When ..., Then ...", () => { ... })
})
```

Fixtures dans `fixtures/*.fixture.ts` (factories overridables). Tests contre des repositories en mémoire qui implémentent les interfaces du domain — jamais contre Supabase réel dans les tests unitaires/application.

## Sécurité

RLS activé sur toutes les tables — ne jamais introduire de logique d'accès côté client qui contredit ou duplique une policy déjà définie dans `docs/modele-de-donnees.md`. Toute nouvelle règle d'accès doit d'abord être ajoutée à ce doc, puis traduite en policy SQL — pas l'inverse.

Le `service_role` ne doit apparaître que dans les 2 Edge Functions documentées (notifications push, suppression de compte). La rédemption de code d'invitation passe par la fonction RPC `redeem_invite_code` (`SECURITY DEFINER`), pas par une 3ᵉ Edge Function.

## Design system

Toujours passer par les tokens sémantiques Tamagui (`$accent`, `$success`, etc.) et les composants `Display`/`Title`/`Body`/`Label` — jamais de couleur ou de `fontFamily` en dur, ça casse le thème sombre. Un seul bouton `primary` par écran. Détail complet : @docs/design-system.md.

## Vérification

- Logique métier (`domain`/`application`) : les tests Vitest sont la seule boucle de vérification (`pnpm test`). Ne jamais ouvrir le simulateur iOS pour confirmer qu'un test passe.
- Le simulateur iOS ne s'ouvre que pour une vérification visuelle réelle (rendu d'un écran, interaction UI) — jamais après chaque petite modification. Grouper les vérifications visuelles à la fin d'une feature ou d'un écran.
- Un seul screenshot par vérification visuelle, pas de captures répétées pour un même état d'écran.

## Divers

- Nom du projet : **Vadrouille** (définitif). Ne pas réintroduire `Baladog` ou le placeholder technique `dogwalk-app`.
- Région Supabase : EU (contrainte RGPD, voir `docs/rgpd-securite.md`).
