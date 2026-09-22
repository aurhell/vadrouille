# Specs — Domaine Friend

*Ce fichier vit dans le repo à `src/friend/friend.docs.md`. Voir `architecture-technique.md` §Documentation des specs pour la convention.*

**US3.1** — En tant qu'utilisateur, je veux ajouter un ami via un code d'invitation, avec confirmation des deux côtés, afin de m'assurer d'ajouter la bonne personne et de ne jamais me retrouver ami avec quelqu'un sans l'avoir accepté.

```gherkin
Feature: Ajout d'un ami par code d'invitation

  Scenario: Aperçu avant confirmation
    Given "Alice" a pour code d'invitation "AB12CD"
    When je saisis le code "AB12CD"
    Then je vois un aperçu du profil d'Alice (pseudo, photo) avant toute action
    And on me demande de confirmer : "Ajouter Alice comme amie ?"

  Scenario: Annulation depuis l'aperçu
    Given je vois l'aperçu du profil d'Alice après avoir saisi son code
    When je choisis de ne pas confirmer
    Then aucune demande n'est envoyée
    And je peux ressaisir un autre code

  Scenario: Envoi d'une demande d'ami
    Given je confirme l'ajout d'Alice après l'aperçu
    When la demande est envoyée
    Then je vois l'invitation dans ma liste "Invitations envoyées", avec possibilité de la retirer
    And aucune amitié n'est créée tant qu'Alice n'a pas répondu

  Scenario: Réception d'une demande d'ami
    Given Bob confirme l'ajout de mon profil après avoir saisi mon code
    When la demande est envoyée
    Then je reçois une notification "Bob vous a ajouté comme ami"
    And je vois la demande dans ma liste "Invitations reçues", avec les actions Accepter/Refuser

  Scenario: Acceptation d'une demande reçue
    Given Bob m'a envoyé une demande d'ami, toujours en attente
    When j'accepte la demande depuis "Invitations reçues"
    Then je deviens ami avec Bob
    And Bob devient automatiquement mon ami (relation bidirectionnelle)
    And la demande disparaît de mes invitations reçues et des invitations envoyées de Bob

  Scenario: Refus d'une demande reçue
    Given Bob m'a envoyé une demande d'ami, toujours en attente
    When je refuse la demande depuis "Invitations reçues"
    Then aucune amitié n'est créée
    And la demande disparaît de mes invitations reçues et des invitations envoyées de Bob
    And Bob peut renvoyer une nouvelle demande plus tard (pas de blocage permanent au MVP)

  Scenario: Retrait d'une demande envoyée
    Given j'ai envoyé une demande d'ami à Alice, toujours en attente
    When je retire la demande depuis "Invitations envoyées"
    Then la demande disparaît de mes invitations envoyées et des invitations reçues d'Alice
    And aucune amitié n'est créée

  Scenario Edge Case: Code invalide ou inexistant
    Given je saisis un code qui ne correspond à aucun profil
    When je valide
    Then je vois un message "Code invalide"
    And aucune demande n'est créée

  Scenario Edge Case: Rédemption de son propre code
    Given mon propre code d'invitation est "XY99ZZ"
    When je saisis mon propre code
    Then l'action est refusée
    And je vois un message "Tu ne peux pas t'ajouter toi-même"

  Scenario Edge Case: Amitié déjà existante
    Given je suis déjà ami avec Alice
    When je saisis à nouveau le code d'Alice et confirme
    Then aucune nouvelle demande n'est créée
    And je vois un message m'indiquant que nous sommes déjà amis

  Scenario Edge Case: Demande déjà en attente
    Given j'ai déjà envoyé une demande à Alice, toujours en attente de sa réponse
    When je saisis à nouveau le code d'Alice et confirme
    Then aucune nouvelle demande n'est créée
    And je vois un message m'indiquant que l'invitation est déjà en attente

  Scenario Edge Case: Demandes croisées
    Given Bob m'a déjà envoyé une demande d'ami, toujours en attente
    When je saisis le code de Bob et confirme
    Then la demande de Bob est automatiquement acceptée, sans créer de deuxième demande en attente
    And je deviens ami avec Bob immédiatement

  Scenario Edge Case: Double rédemption simultanée
    Given deux requêtes tentent de rédimer le même code vers la même paire d'utilisateurs au même instant
    When les deux requêtes sont traitées
    Then une seule demande est créée (contrainte d'unicité en base)
    And aucune erreur visible n'est présentée à l'utilisateur

  Scenario: Régénération du code
    Given mon code actuel est "XY99ZZ"
    When je régénère mon code depuis les réglages
    Then un nouveau code est généré et affiché
    And l'ancien code "XY99ZZ" n'est plus valide pour être rédimé

  Scenario: Consulter la liste de mes amis
    Given j'ai ajouté un ou plusieurs amis (demandes acceptées des deux côtés)
    When j'accède à l'écran de mes amis
    Then je vois la liste de toutes mes amitiés acceptées, distincte des invitations en attente

  Scenario: Rafraîchir la liste par pull-to-refresh
    Given je suis sur l'écran "Mes amis"
    When je tire la liste vers le bas
    Then mes amis, mes invitations reçues et mes invitations envoyées sont recalculés depuis le serveur
    And un retour visuel (anneau teinté + léger vibreur à la fin) confirme que le rafraîchissement a eu lieu

  Scenario: Badge d'invitations en attente sur le menu
    Given j'ai une ou plusieurs invitations d'ami reçues, toujours en attente
    When je regarde le menu de navigation
    Then un badge affichant leur nombre apparaît sur l'onglet "Amis"

  Scenario: Disparition du badge
    Given le badge de l'onglet "Amis" affiche mes invitations reçues en attente
    When j'ai répondu (accepté ou refusé) à toutes mes invitations reçues
    Then le badge disparaît de l'onglet "Amis"
```

**US3.2** — En tant qu'utilisateur, je veux pouvoir retirer un ami de ma liste, afin de mettre fin à une amitié que je ne souhaite plus maintenir.

```gherkin
Feature: Suppression d'un ami

  Scenario: Retrait d'un ami
    Given je suis ami avec Alice
    When je swipe sur Alice dans ma liste d'amis et confirme le retrait
    Then Alice n'est plus dans ma liste d'amis
    And je ne suis plus dans la liste d'amis d'Alice (relation bidirectionnelle)

  Scenario: Annulation depuis la confirmation
    Given je swipe sur Alice dans ma liste d'amis
    When on me demande de confirmer et que j'annule
    Then Alice reste dans ma liste d'amis

  Scenario: Ré-ajout après un retrait
    Given j'ai retiré Alice de ma liste d'amis
    When je rédime à nouveau son code d'invitation (ou elle rédime le mien)
    Then une nouvelle demande d'ami est envoyée, comme pour un premier ajout
```

## Hypothèses & points à confirmer

- **Pas d'expiration** des demandes en attente au MVP — elles restent visibles indéfiniment tant qu'aucune des deux parties n'agit (accepter/refuser/retirer).
- **Pas de blocage** après un refus : la personne refusée peut renvoyer une nouvelle demande (pas de compteur de tentatives, pas de cooldown au MVP — voir `roadmap.md` pour une éventuelle évolution).
- **Notification "demande d'ami reçue"** : push (trigger DB sur `friendships`, `status = 'pending'`, notifie `friend_id`) + badge, même mécanisme que les autres notifications de l'app (voir `modele-de-donnees.md` §Notifications push) — pas de canal dédié spécifique à ce domaine. Texte non spécifié dans le brief initial, choisi lors de l'implémentation : "👋 {Demandeur} veut devenir ton ami".
- **Aperçu avant confirmation** : ne crée aucun état côté serveur (pas de ligne "en attente de confirmation locale") — c'est un aller-retour en lecture seule (`lookup_invite_code`), la demande n'existe qu'après confirmation explicite.
- **Retrait d'ami** : aucune notification à l'autre personne au MVP (elle constate juste l'absence lors de sa prochaine visite) — cohérent avec l'absence de notification de suppression déjà actée pour d'autres domaines. Aucun blocage : les deux peuvent se ré-ajouter librement ensuite.
- **Pull-to-refresh** : pattern générique (`usePullToRefresh` + `<RefreshControl>`), pas spécifique au domaine friend — détail du composant et de ses limites (pas d'illustration custom, seulement teinte/titre) dans `design-system.md` §"Pull-to-refresh". Réutilisé tel quel pour la liste des balades.
- **Rafraîchissement au changement d'onglet** : pattern générique (`useRefetchOnFocus`), pas spécifique au domaine friend — voir `walk.docs.md` point 13 pour le détail (bug découvert et corrigé là, React Navigation ne démonte pas les écrans d'onglets donc le refetch-on-mount de TanStack Query ne se déclenchait jamais en y revenant).
- **Badge de notification** : pattern générique (`<NotificationBadge>` + `<IconWithBadge>`), pas spécifique au domaine friend — détail dans `design-system.md` §"Badge de notification sur un onglet". Le compteur vient du cache déjà chargé par `useReceivedFriendRequests` (pas de requête dédiée), donc se met à jour automatiquement avec la liste. Réutilisable pour les invitations de balade sans réponse.
