# 🗃️ Modèle de données — Vadrouille

## Schéma (v3)

```
profiles
  id (uuid, FK auth.users)
  username (obligatoire, 3-20 car. alphanum/_/. — pas d'unicité, différenciation via l'email)
  avatar_url (nullable, upload Supabase Storage)
  invite_code (unique, regénérable) · created_at

dogs
  id · name · breed · birth_date · photo_url (nullable, upload Supabase Storage)

dog_owners
  dog_id (FK dogs) · user_id (FK profiles) · role ('owner'|'co-owner')
  status ('pending'|'accepted')   -- une invitation de co-ownership doit être acceptée
  PRIMARY KEY (dog_id, user_id)

friendships
  user_id (FK profiles) · friend_id (FK profiles) · status ('pending'|'accepted') · created_at
  UNIQUE (user_id, friend_id)
  -- Une demande en attente est UNE SEULE ligne (demandeur -> destinataire, status='pending').
  -- L'acceptation ajoute la ligne miroir (destinataire -> demandeur, status='accepted') et
  -- fait passer l'originale à 'accepted' : une amitié acceptée reste donc toujours la paire
  -- de lignes symétriques historique. Voir §"Codes d'invitation d'amis" plus bas.

walks
  id · organizer_id (FK profiles, nullable)
  location_text · start_time · duration_minutes · created_at

walk_participants          -- RSVP de la personne, indépendant des chiens
  walk_id (FK walks) · user_id (FK profiles)
  status ('pending'|'yes'|'no'|'maybe') · responded_at

walk_dogs                  -- confirmation du chien, partagée entre co-owners
  walk_id (FK walks) · dog_id (FK dogs)
  status ('yes'|'maybe')            -- un chien n'a pas de statut "no", il est
                                     --   juste absent de la table si non confirmé
  updated_by (FK profiles)          -- audit : quel co-owner a fait l'action
  responded_at
  PRIMARY KEY (walk_id, dog_id)     -- garantit qu'un chien n'apparaît qu'une fois
                                     --   par balade, quel que soit le co-owner
```

Le comptage des chiens n'est pas porté par chaque participant mais par la table dédiée `walk_dogs`, clé sur `(walk_id, dog_id)`. Un chien en foyer partagé n'a donc qu'un seul état par balade, modifiable par n'importe lequel de ses co-owners — la contrainte `PRIMARY KEY` empêche nativement le double comptage.

## Règles métier de la balade (invariants domaine)

Ces invariants vivent dans `domain/policies/` (voir `architecture-technique.md`) et sont appliqués à deux niveaux : validation côté client pour l'UX, et contrainte au niveau base de données pour l'intégrité — indispensable ici car plusieurs clients écrivent directement dans Postgres sans serveur arbitre central.

### Capacité — 10 chiens max par balade

- Quota = `COUNT(*) FROM walk_dogs WHERE walk_id = X AND status = 'yes'`.
- Grâce à la fusion des slots par chien, la déduplication est **native** (contrainte `PRIMARY KEY`) — pas de logique de delta complexe nécessaire. Le trigger de quota se limite à un `COUNT` simple avant chaque `INSERT`/`UPDATE` sur `walk_dogs`.
- MVP : constante fixe `MAX_DOGS_PER_WALK = 10`.
- **Enforcement double niveau** : `domain/policies/WalkCapacityPolicy` côté client (retour UX immédiat) + trigger Postgres (source de vérité, protège contre deux confirmations simultanées).
- Pas de liste d'attente au MVP : rejet simple si quota atteint. Un slot libéré (`yes` retiré) ne notifie personne.

### Fenêtre de réponse — verrouillage à H+5min

Verrouillage (RSVP personnel ET confirmation des chiens) 5 minutes après `start_time`, plutôt qu'une conversion forcée `pending → no` (préserve la distinction "n'a pas répondu" / "a refusé").

- `domain/policies/ResponseWindowPolicy.canRespond(walk) = now() < start_time + 5min`
- Policy RLS `WITH CHECK` sur `UPDATE walk_participants` **et** sur `INSERT/UPDATE/DELETE walk_dogs`
- UI : un `pending` sur une balade passée s'affiche "Sans réponse", distinct de "Décliné"

### Modification d'une balade déjà envoyée (reprogrammation)

Déclenché par un changement de `start_time`, `location_text` ou `duration_minutes` (les trois traités de façon identique) sur une balade déjà notifiée :

- Tous les `walk_participants` dont le statut n'est pas `pending` sont réinitialisés à `pending` — y compris un `no` explicite.
- Toutes les lignes `walk_dogs` de la balade sont **supprimées**.
- **Tous** les participants reçoivent une notification push, y compris ceux encore `pending`.
- **Édition interdite une fois `start_time` déjà passé** — policy RLS `WITH CHECK (start_time > now())` sur `UPDATE walks`, en plus de la validation domaine à la création.
- Pas de limite de fréquence de modification au MVP.

## Codes d'invitation d'amis

Code personnel permanent, régénérable/révocable (`profiles.invite_code`) — pas d'expiration automatique (cf. usage "friend code" façon Discord, pas un lien à usage unique).

Rédimer un code n'établit plus une amitié directement : ça envoie une **demande d'ami en attente**, que le destinataire doit explicitement accepter (voir `friend.docs.md`). Six RPC `SECURITY DEFINER` couvrent le cycle de vie, toutes sur `public.friendships` :

- `lookup_invite_code(code)` — aperçu en lecture seule du profil propriétaire du code (pseudo, photo), utilisé pour l'écran de confirmation avant envoi. Ne crée rien.
- `redeem_invite_code(code)` — vérifie le code, bloque l'auto-rédemption, puis :
  - code inconnu → exception `invalid_invite_code`
  - propre code → exception `cannot_redeem_own_code`
  - déjà amis (ligne `accepted` existante) → `'already_friends'`, rien de créé
  - demande déjà envoyée (ligne `pending` existante, moi → cible) → `'already_pending'`, rien de créé
  - **demandes croisées** : la cible m'a déjà envoyé une demande en attente → celle-ci est acceptée directement (ligne miroir insérée, originale passée à `accepted`), retour `'auto_accepted'`
  - sinon → insertion d'une ligne `pending` (moi → cible), retour `'created'`
  - Double rédemption simultanée gérée par `ON CONFLICT (user_id, friend_id) DO NOTHING`, comme avant.
- `accept_friend_request(requester_id)` / `decline_friend_request(requester_id)` — le destinataire répond : accepter fait passer la ligne `pending` à `accepted` et insère la ligne miroir ; refuser supprime la ligne `pending` (idempotent, pas d'erreur si déjà traitée par une action concurrente).
- `cancel_friend_request(addressee_id)` — le demandeur retire sa propre demande encore `pending` (idempotent, même logique).
- `remove_friend(target_user_id)` — met fin à une amitié `accepted` existante, dans les deux sens (idempotent). Voir détail dans la policy `friendships` plus bas.

Ces quatre RPC de mutation sont les seuls points d'écriture sur `friendships` — pas de policy `INSERT`/`UPDATE`/`DELETE` client, pour les mêmes raisons qu'avant (une transaction doit pouvoir toucher la ligne de l'autre personne, ce qu'une policy RLS classique ne peut pas exprimer).

## Politiques d'accès (RLS)

RLS activé sur toutes les tables. Principe général : on ne voit que ce qui touche directement son propre cercle (soi-même, ses amis, ses colocataires de balade ou de chien) — jamais de table "ouverte" par défaut.

### `profiles`

| Opération | Règle |
|---|---|
| SELECT | `id = auth.uid()` **OU** lien d'amitié avec l'utilisateur (`friendships`) **OU** partage une balade (`walk_participants` sur un `walk_id` commun) **OU** partage un chien (`dog_owners` sur un `dog_id` commun) |
| INSERT | `id = auth.uid()` uniquement (création du profil à l'onboarding) |
| UPDATE | `id = auth.uid()` uniquement (pseudo, avatar, régénération du code) |
| DELETE | Aucune — passe exclusivement par l'Edge Function de suppression de compte (`service_role`) |

⚠️ Le SELECT ci-dessus ne couvre **jamais** un inconnu (ni ami, ni co-participant) — donc impossible de retrouver le profil d'Alice par son `invite_code` avant d'être ami avec elle. C'est voulu : la rédemption de code ne passe pas par un SELECT direct sur `profiles`, mais par la fonction RPC `redeem_invite_code` (voir plus bas), qui tourne en `SECURITY DEFINER` et contourne RLS le temps de vérifier le code.

### `dogs`

| Opération | Règle |
|---|---|
| SELECT | Owner ou co-owner accepté (`dog_owners`) **OU** le chien est confirmé (`walk_dogs`) sur une balade à laquelle l'utilisateur participe (pour voir les chiens des autres dans le détail d'une balade) |
| INSERT | N'importe quel utilisateur connecté — la ligne `dog_owners(role='owner')` correspondante est créée dans la même transaction (ou via trigger `AFTER INSERT` sur `dogs`, avec `user_id = auth.uid()`) |
| UPDATE | Owner **ou** co-owner au statut `accepted` (`dog_owners`) |
| DELETE | Owner uniquement (`dog_owners.role = 'owner'`) — cohérent avec l'edge case déjà documentée plus haut |

### `dog_owners`

| Opération | Règle |
|---|---|
| SELECT | `user_id = auth.uid()` **OU** `dog_id` fait partie des chiens de l'utilisateur (pour voir la liste complète des owners/co-owners d'un chien qu'on possède) |
| INSERT (invitation) | Le demandeur est owner du `dog_id` (`EXISTS ... role='owner' AND user_id=auth.uid()`) **ET** la cible (`user_id` de la ligne insérée) est un ami **accepté** (`EXISTS` dans `friendships` avec `status='accepted'` — une demande d'ami encore `pending` ne compte pas) — la ligne est créée avec `role='co-owner'`, `status='pending'` |
| UPDATE (acceptation) | `user_id = auth.uid()` **ET** `status` actuel = `'pending'` → passage à `'accepted'` |
| DELETE (refus, ou retrait volontaire) | `user_id = auth.uid()` — couvre le refus d'une invitation pending et le retrait volontaire d'un co-owner accepté. Le rôle `'owner'` ne peut jamais se retirer par cette voie (suppression du chien ou du compte uniquement) |

### `friendships`

| Opération | Règle |
|---|---|
| SELECT | `user_id = auth.uid()` (mes amitiés acceptées + mes demandes envoyées) **OU** (`friend_id = auth.uid()` **ET** `status = 'pending'`) (les demandes reçues, où je ne suis pas `user_id`) |
| INSERT / UPDATE / DELETE | **Aucune policy client** — tout passe par les RPC `SECURITY DEFINER` `redeem_invite_code` / `accept_friend_request` / `decline_friend_request` / `cancel_friend_request` / `remove_friend` (voir §"Codes d'invitation d'amis"), seules capables de toucher atomiquement la ligne de l'autre personne |

⚠️ Deux fonctions, deux granularités : `is_friend_of()` (utilisée par la policy `dog_owners` ci-dessus, pour le partage de co-ownership) ne compte que les lignes `status = 'accepted'`. `has_friendship_edge()` (utilisée par `profiles_select_friend`) est plus large : toute ligne entre les deux personnes, `pending` **ou** `accepted`, dans les deux sens — nécessaire pour que les écrans "Invitations reçues"/"Invitations envoyées" puissent afficher pseudo + photo de l'autre personne avant même qu'elle ait accepté (ce n'est pas une fuite : c'est exactement l'identité que le demandeur a déjà affichée via `lookup_invite_code`, ou que le destinataire connaît déjà puisqu'il a reçu la demande). Pour un pur inconnu (aucune ligne du tout), `lookup_invite_code` reste le seul moyen de voir pseudo/photo, et seulement via cette RPC `SECURITY DEFINER`, pas via un SELECT direct.

`remove_friend(target_user_id)` — supprime les deux lignes `accepted` symétriques (voir `friend.docs.md` "Suppression d'un ami"). Idempotent, aucune notification à l'autre personne au MVP. Ne touche pas les lignes `pending` (c'est `cancel_friend_request`/`decline_friend_request` qui s'en chargent).

### `walks`

| Opération | Règle |
|---|---|
| SELECT | `organizer_id = auth.uid()` **OU** l'utilisateur a une ligne dans `walk_participants` pour cette balade |
| INSERT | N'importe quel utilisateur connecté, `WITH CHECK (organizer_id = auth.uid() AND start_time > now())` |
| UPDATE | `organizer_id = auth.uid()` **ET** `start_time > now()` (sur la ligne existante) — c'est la policy "édition interdite après le départ" déjà posée plus haut |
| DELETE | Aucune au MVP (pas d'annulation manuelle par le client — voir `roadmap.md` "cancel-walk"). Les balades futures d'un compte supprimé sont annulées par l'Edge Function de suppression de compte, pas par le client |

### `walk_participants`

| Opération | Règle |
|---|---|
| SELECT | Visibilité alignée sur la balade parente : `user_id = auth.uid()` **OU** l'utilisateur a une autre ligne sur le même `walk_id` |
| INSERT | Le demandeur est l'organisateur de `walk_id` (`EXISTS ... organizer_id = auth.uid()`) — l'organisateur crée sa propre ligne (`status='yes'`) et celles de chaque ami invité (`status='pending'`) à la création de la balade |
| UPDATE (réponse RSVP) | `user_id = auth.uid()` **ET** fenêtre de réponse ouverte (`now() < start_time + 5min`, jointure sur `walks`) — policy déjà posée plus haut |
| DELETE | Aucune (le reset de statut passe par UPDATE, pas par suppression de ligne) |

### `walk_dogs`

| Opération | Règle |
|---|---|
| SELECT | Même visibilité que `walk_participants` (aligné sur la balade parente) |
| INSERT / UPDATE (confirmer un chien, `yes`↔`maybe`) | Le demandeur est owner ou co-owner accepté du `dog_id` **ET** fenêtre de réponse ouverte **ET** quota non dépassé (trigger `COUNT`, déjà documenté plus haut) |
| DELETE (retirer un chien) | Owner ou co-owner accepté du `dog_id` **ET** fenêtre de réponse ouverte — un co-owner peut retirer un chien confirmé par l'autre co-owner (donnée partagée, cf. `walk.docs.md`) |

### Stockage (avatars, photos de chien)

Deux buckets, convention de chemin `{user_id}/...` pour les avatars et `{dog_id}/...` pour les photos de chien.

- **Écriture** (upload/remplacement/suppression) : restreinte au propriétaire de la ressource — soi-même pour un avatar, owner/co-owner accepté pour une photo de chien (même logique que `dogs`)
- **Lecture** : publique sur les deux buckets. Simplification volontaire — des photos de profil/chien sans donnée sensible, et ça évite de dupliquer toute la logique de visibilité (amis/co-participants) au niveau du stockage. À revoir si le périmètre de confidentialité change

## Points ouverts

1. Format technique du code d'invitation (longueur, alphabet, génération) — à définir en conception technique, pas bloquant fonctionnellement
2. **Révocation d'une invitation de co-ownership encore `pending` par l'owner qui l'a envoyée** — pas un scénario documenté dans `dog.docs.md`. Hypothèse retenue pour la RLS : seul l'invité peut supprimer la ligne `pending` (refus). Si on veut permettre à l'owner d'annuler son invitation avant réponse, il faudra élargir la policy DELETE de `dog_owners`
