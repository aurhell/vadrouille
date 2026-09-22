# Specs — Domaine Walk

*Ce fichier vit dans le repo à `src/domain/walk/walk.docs.md`. Voir `architecture-technique.md` §Documentation des specs pour la convention. Les invariants métier détaillés (quota, fenêtre de réponse, reprogrammation) sont documentés en profondeur dans `modele-de-donnees.md` §Règles métier — ce fichier se concentre sur le comportement observable côté utilisateur.*

**US4.1** — En tant qu'organisateur, je veux créer une balade avec un lieu, une heure et une durée, et y inviter des amis, afin de coordonner une sortie.

**US5.1** — En tant qu'utilisateur, je veux voir la liste de mes balades à venir et le détail de chacune (participants, chiens confirmés), afin de savoir qui vient et de m'organiser.

**US6.1** — En tant qu'invité, je veux répondre oui/non/peut-être à une balade et indiquer quels chiens je fais venir, afin que l'organisateur sache à quoi s'attendre.

**US7.1** — En tant qu'organisateur, je veux pouvoir modifier l'heure, le lieu ou la durée d'une balade déjà envoyée, afin de m'adapter aux imprévus tout en redemandant confirmation à tout le monde.

**US8.1** — En tant qu'invité, je veux être notifié quand un ami me propose une balade ou la reprogramme, afin de pouvoir répondre à temps.

```gherkin
Feature: Création d'une balade

  Scenario: Création nominale
    Given je suis connecté, j'ai au moins un chien et au moins un ami
    When je crée une balade avec un lieu, une heure de départ future, une durée, mes chiens et des amis à inviter
    Then la balade est créée
    And je suis automatiquement inscrit comme participant avec le statut "yes"
    And mes chiens sélectionnés sont confirmés pour cette balade (walk_dogs)
    And chaque ami sélectionné reçoit une invitation avec le statut "pending"
    And chaque ami sélectionné reçoit une notification push

  Scenario Edge Case: Heure de départ dans le passé
    Given je crée une balade
    When je renseigne une heure de départ déjà passée
    Then la création est refusée
    And je vois un message "L'heure de départ doit être dans le futur"

  Scenario Edge Case: Sélection d'un chien qui n'est pas le mien
    Given je crée une balade
    When je consulte la liste de chiens sélectionnables
    Then seuls les chiens dont je suis owner ou co-owner apparaissent

  Scenario Edge Case: Sélection d'un ami qui n'est pas dans ma liste
    Given je crée une balade
    When je consulte la liste des personnes invitables
    Then seuls mes amis actuels apparaissent

  Scenario Edge Case: Dépassement du quota dès la création
    Given je sélectionne plus de 10 de mes propres chiens à la création de la balade
    When je valide
    Then la création est refusée
    And je vois un message "Maximum 10 chiens par balade"

  Scenario Edge Case: Création sans ami sélectionné
    Given je crée une balade sans sélectionner aucun ami
    When je valide
    Then la balade est créée (je peux la programmer seul et inviter plus tard, hors scope MVP*)

Feature: Liste et détail des balades

  Scenario: Consulter mes balades à venir
    Given je suis connecté
    When j'accède à l'écran des balades
    Then je vois la liste des balades à venir auxquelles je participe (organisées par moi ou par un ami), triées par date de départ

  Scenario Edge Case: Aucune balade à venir
    Given je n'ai aucune balade à venir
    When j'accède à l'écran des balades
    Then je vois un état vide m'invitant à en créer une

  Scenario: Consulter le détail d'une balade
    Given je participe à une balade (organisateur ou invité)
    When j'ouvre son détail
    Then je vois le lieu, l'heure de départ et la durée
    And je vois chaque participant avec son statut (yes/no/maybe/pending), et un compteur discret du nombre de chiens qu'il ou elle amène juste à côté de son nom ("toi · 2 chiens")
    And je vois séparément la liste des chiens confirmés (photos, noms), dans sa propre carte au-dessus des participants

  Scenario: Mise à jour en direct des réponses
    Given je consulte le détail d'une balade
    When un autre participant modifie sa réponse ou qu'un chien confirmé change
    Then l'écran se met à jour automatiquement, sans action de ma part (Supabase Realtime)

  Scenario Edge Case: Accès à une balade à laquelle je ne participe pas
    Given une balade existe mais je n'en suis ni organisateur ni participant invité
    When je tente d'accéder à son détail
    Then l'accès est refusé

Feature: Historique des balades passées

  Scenario: Accéder à l'historique depuis la liste des balades à venir
    Given je suis sur l'écran des balades à venir
    When je choisis "Voir mes balades passées"
    Then je vois la liste des balades dont l'heure de départ est passée, auxquelles je participe (organisées par moi ou par un ami), triées de la plus récente à la plus ancienne

  Scenario Edge Case: Aucune balade passée
    Given je n'ai aucune balade passée
    When j'accède à l'historique
    Then je vois un état vide

  Scenario: Filtrer sur mes balades confirmées uniquement
    Given je consulte l'historique de mes balades passées
    When j'active le filtre "Confirmées uniquement"
    Then seules les balades où j'ai répondu "oui" restent affichées

  Scenario: Consulter le détail d'une balade passée
    Given je participe (organisateur ou invité) à une balade passée
    When j'ouvre son détail
    Then je vois le lieu, l'heure de départ, la durée, et chaque participant avec son statut final et un compteur discret du nombre de chiens qu'il ou elle a amenés juste à côté de son nom
    And aucune action n'est proposée (pas de réponse RSVP, pas d'annulation, pas de sélection de chiens)

Feature: Réponse à une invitation

  Scenario: Répondre "oui" en dessous du quota
    Given 8 chiens sont déjà confirmés sur une balade (quota de 10)
    And je possède un chien non encore confirmé sur cette balade
    When je réponds "oui" et sélectionne mon chien
    Then ma réponse est enregistrée en "yes"
    And mon chien est ajouté à la liste des chiens confirmés (9/10)

  Scenario Edge Case: Réponse "oui" qui dépasserait le quota
    Given 10 chiens sont déjà confirmés sur une balade
    When je tente de confirmer un de mes chiens supplémentaires
    Then l'action est refusée
    And je vois un message "Cette balade est complète (10/10 chiens)"
    And mon statut RSVP personnel n'est pas affecté (je peux toujours répondre "yes" sans chien)

  Scenario Edge Case: Réponse "oui" sans sélectionner de chien
    Given je suis invité à une balade
    When je réponds "oui" sans sélectionner de chien
    Then ma réponse "yes" est enregistrée
    And aucun chien n'est ajouté à la liste des confirmés

  Scenario Edge Case: Réponse après la fenêtre de verrouillage (H+5min)
    Given une balade a débuté il y a plus de 5 minutes
    When je tente de répondre ou de modifier ma réponse
    Then l'action est refusée
    And je vois un message "Cette balade n'accepte plus de réponses"

  Scenario Edge Case: Chien déjà confirmé par un co-owner
    Given "Rex" (dont je suis co-owner avec Alice) est déjà confirmé sur cette balade par Alice
    When je consulte la balade
    Then je vois Rex déjà marqué comme confirmé
    And je peux le retirer si besoin (ce qui le retire pour Alice également, donnée partagée)

  Scenario Edge Case: Changement de réponse
    Given j'ai déjà répondu "oui" avec mon chien confirmé
    When je change ma réponse en "non"
    Then mon statut RSVP passe à "no"
    And mes chiens confirmés sont retirés de la balade, libérant leur slot dans le quota

Feature: Reprogrammation d'une balade

  Scenario: Modification de l'heure par l'organisateur
    Given je suis l'organisateur d'une balade avec des réponses existantes (yes/no/maybe)
    When je modifie l'heure de départ
    Then le statut de tous les participants repasse à "pending"
    And les chiens déjà confirmés restent confirmés (pas de perte de la sélection à cause d'un simple changement d'heure/lieu/durée)
    And tous les participants (y compris ceux encore "pending") reçoivent une notification de mise à jour

  Scenario: Modification du lieu ou de la durée uniquement
    Given je suis l'organisateur d'une balade avec des réponses existantes
    When je modifie uniquement le lieu (heure et durée inchangées)
    Then le même comportement de reset s'applique que pour un changement d'heure

  Scenario: Inviter d'autres amis en reprogrammant
    Given je suis l'organisateur d'une balade avec des participants déjà invités
    When je modifie la balade et sélectionne un ami pas encore invité
    Then cet ami est ajouté comme participant "pending"
    And les participants déjà invités ne sont ni retirés ni dupliqués

  Scenario Edge Case: Modification par un participant non-organisateur
    Given je suis un simple participant (pas organisateur) d'une balade
    When je tente de modifier l'heure, le lieu ou la durée
    Then l'action est refusée

  Scenario Edge Case: Modification après le début de la balade
    Given une balade a déjà débuté (start_time dans le passé)
    When l'organisateur tente de la modifier
    Then l'action est refusée
    And un message invite à créer une nouvelle balade

Feature: Annulation d'une balade

  Scenario: L'organisateur annule une balade à venir
    Given je suis l'organisateur d'une balade dont le départ n'a pas encore eu lieu
    When j'annule la balade
    Then la balade est définitivement supprimée
    And elle disparaît de la liste des balades de tous les participants
    And aucune notification n'est envoyée aux participants au MVP

  Scenario Edge Case: Un participant non-organisateur tente d'annuler
    Given je suis un simple participant (pas organisateur) d'une balade
    When je tente de l'annuler
    Then l'action est refusée

  Scenario Edge Case: Annulation après le début de la balade
    Given une balade a déjà débuté (start_time dans le passé)
    When l'organisateur tente de l'annuler
    Then l'action est refusée

Feature: Notifications liées aux balades

  Scenario: Réception d'une invitation
    Given je suis ajouté comme participant "pending" à une nouvelle balade
    Then je reçois une notification push "🦮 {Organisateur} t'invite à une balade"

  Scenario: Réception d'une reprogrammation
    Given une balade à laquelle je participe est reprogrammée par l'organisateur
    Then je reçois une notification push "🦮 {Organisateur} a mis à jour la balade. Confirme ta présence !"

  Scenario Edge Case: Notifications désactivées au niveau OS
    Given j'ai désactivé les notifications push pour Vadrouille dans les réglages de mon téléphone
    When je suis invité à une balade ou qu'elle est reprogrammée
    Then aucun push n'est reçu
    But l'invitation ou la mise à jour apparaît dans mon centre de notifications in-app
    And un indicateur signale la nouveauté à l'ouverture de l'appli
```
*\* Hypothèse — voir §"Hypothèses & points à confirmer" ci-dessous.*

## Hypothèses & points à confirmer

1. **Création d'une balade sans ami sélectionné** — autorisée par hypothèse, mais l'inviter des amis *après* la création n'est pas un flow défini au MVP. À confirmer que ce cas (balade solo, ou invitation a posteriori) est hors-scope v1.
2. **État d'implémentation** — TDD sur le domaine/l'application, vérifié de bout en bout contre la base réelle :
   - "Création d'une balade" (US4.1) : lieu, heure de départ future, durée, sélection de mes chiens (max 10) et de mes amis. Le formulaire ne propose que mes propres chiens/amis (requêtes déjà filtrées par domaine) — le refus RLS des cas limites (`walks_insert_as_organizer_future_only`) est vérifié directement en base, pas seulement côté client.
   - "Liste et détail des balades" (US5.1) : liste des balades à venir (organisées ou invité), détail avec participants/chiens confirmés. **Pas de Realtime pour l'instant** — le détail se met à jour au pull-to-refresh/refocus, pas en direct. La liste des balades est l'écran par défaut de l'app (premier onglet de la barre, accessible directement à "/") — il n'y a pas de page d'accueil séparée.
   - "Annulation d'une balade" : hors du brief US4.1–US8.1 initial (le brief ne couvrait que la création/consultation/réponse/reprogrammation), mais nécessaire dès qu'on peut créer une balade par erreur. Réservée à l'organisateur, tant que la balade n'a pas débuté (`walks_delete_organizer_future_only`, même pattern que `walks_update_organizer_future_only`) ; cascade native sur `walk_participants`/`walk_dogs`. Swipe-to-delete dans la liste et action dans le détail, tous deux réservés à l'organisateur. Voir aussi `roadmap.md` pour le cas non couvert (désinviter un seul participant sans tout annuler).
   - "Réponse à une invitation" (US6.1) : RSVP oui/peut-être/non (`RsvpSheet` docké en bas du détail de balade) et sélection de mes chiens confirmés (séparée de la réponse RSVP elle-même, comme décrit dans le Gherkin). Le quota (max 10) est vérifié côté client avant l'appel (`canConfirmDogForWalk`) pour un retour immédiat, le trigger SQL `enforce_walk_dogs_capacity` reste la source de vérité serveur. La fenêtre de réponse (`canRespondToWalk`, H+5min) masque le `RsvpSheet` et grise la sélection de chiens une fois expirée — RLS reste l'enforcement réel, vérifié par smoke test. Changer sa réponse loin de "oui" libère automatiquement mes propres chiens confirmés (jamais ceux d'un co-owner ou d'un autre participant) — `RespondToWalkInvite` reçoit `myDogIds` en paramètre (fourni par l'écran, qui les a déjà via le domaine `dog`) plutôt que d'injecter `DogRepository`, pour ne dépendre que de `WalkRepository`.
   - "Reprogrammation d'une balade" (US7.1) : écran dédié (`WalkEditScreen`, route `/walks/[id]/edit`), pré-rempli, accessible depuis le menu "•••" de l'organisateur. Pas de sélection de chiens sur cet écran — voir point 10.
   - "Notifications liées aux balades" (US8.1) : implémenté côté invitation et reprogrammation via des triggers DB `SECURITY DEFINER` qui appellent l'API Expo Push directement (pas d'Edge Function intermédiaire) — détail dans `modele-de-donnees.md` §Notifications push. Le scénario "Notifications désactivées au niveau OS" (fallback in-app) reste tel quel : l'écran des balades affiche déjà toute balade `pending` sans mécanisme séparé à construire, donc rien de plus à faire côté client pour ce cas.
3. **Quota de 10 chiens** — vérifié à la fois à la création (`validateWalkCreation`) et à la confirmation individuelle d'un chien (`canConfirmDogForWalk`, via `ToggleDogForWalk`) côté domaine, pour un retour immédiat. Le trigger SQL `enforce_walk_dogs_capacity` (pré-existant, voir `modele-de-donnees.md`) reste la source de vérité serveur dans les deux cas.
   - **Discrétion côté UI** (revu après un premier passage jugé trop présent) : aucun ratio "X/10" ni jauge de progression n'est affiché nulle part — ni sur la carte d'une balade dans la liste, ni sur son détail (`QuotaBadge`/`QuotaBar` retirés de `WalkCard` et `WalkDetailScreen`). Le nombre de chiens confirmés reste visible en comptant la liste elle-même. Un message discret (`dogQuotaMessage`) n'apparaît qu'à l'approche de la limite (2 places restantes ou moins : "Plus que N places" / "Plus qu'une place" / "Complet"), à la fois côté création (nombre de mes chiens sélectionnés) et côté réponse à une invitation (nombre total de chiens déjà confirmés sur la balade). Le refus explicite au-delà de la limite ("Cette balade est complète (10/10 chiens)") reste inchangé.
4. **Invitation d'un non-ami à une balade (faille corrigée)** — la policy RLS `walk_participants_insert_by_organizer` d'origine ne vérifiait que "l'auteur de la requête est l'organisateur", sans vérifier que la personne invitée est réellement une amie : une requête forgée aurait pu ajouter n'importe quel utilisateur comme participant, malgré le filtre côté client (`WalkFormScreen` ne propose que mes amis). Corrigé en alignant sur le pattern déjà utilisé pour l'invitation de co-owner (`dog_owners_insert_owner_invites_friend`) — vérifié par smoke test (auto-invitation de l'organisateur OK, ami OK, inconnu refusé).
5. **Retrait d'un chien partagé indépendant de mon propre RSVP** — la section "Mes chiens" du détail de balade n'était accessible que si mon propre statut était "yes", alors que le Gherkin "Chien déjà confirmé par un co-owner" n'exige pas que je sois moi-même "yes" pour retirer un chien qu'un autre co-owner a confirmé (la RLS ne vérifie que la propriété du chien + la fenêtre de réponse, jamais mon statut RSVP). Corrigé : la section s'affiche dès que j'ai au moins un chien, quel que soit mon statut.
6. **Historique des balades passées** — décisions de scope (issues d'un échange avec l'utilisateur avant dev) :
   - **Définition de "passée"** : `start_time <= maintenant`, symétrique du filtre `> maintenant` déjà utilisé pour "à venir" — une balade en cours (entre son heure de départ et son heure de fin) est donc déjà considérée comme "passée" pour l'historique, pas de troisième état "en cours".
   - **Accès** : lien discret depuis l'écran des balades à venir (pas un nouvel onglet, pas de toggle intégré à la liste à venir), toujours visible (y compris sur l'état vide "Aucune balade à venir") puisqu'il vit au-dessus de la liste, pas dans son footer.
   - **Filtre "Confirmées uniquement"** : appliqué côté client sur les balades déjà chargées (pas une requête séparée) — l'historique reste par défaut sur "Toutes" (organisées ou invité, peu importe ma réponse), au chargement de l'écran.
   - **Détail** : écran dédié en lecture seule, pas une réutilisation de `WalkDetailScreen` — pas de `RsvpSheet`, pas de sélection "Mes chiens", pas d'action d'annulation.
   - **Affichage "Utilisateur supprimé"** pour un `organizer_id` nul (organisateur ayant depuis supprimé son compte) : une ligne "Organisée par {nom}" a été ajoutée sous l'en-tête, via `organizerDisplayName` (voir point 5 de `account.docs.md`). Pas de statistiques ni de pagination (voir `roadmap.md` "Historique / stats de balades par chien").
7. **Détail de balade — deux cartes séparées, pas fusionnées** (une itération intermédiaire avait fusionné "Chiens confirmés" et "Participants" en une seule carte à deux lignes par personne — revenue en arrière : "Je ne suis pas convaincu", retour à la maquette design-system d'origine à deux cartes). État actuel :
   - Carte "Chiens confirmés" (lecture seule, au-dessus) : photos + noms des chiens confirmés pour la balade (jusqu'à 3 affichés, "+N autres" au-delà) — anneau pointillé teal autour de la photo si le chien est en foyer partagé (peu importe qui l'a confirmé, voir point 8), à la place d'un badge texte séparé.
   - Carte "Participants" (en dessous) : une ligne par personne, suffixe discret "· N chien(s)" juste à côté du nom si elle/il en amène, `StatusBadge` à droite (même composant que le résumé RSVP replié du `RsvpSheet`, pour la cohérence visuelle). **Ma propre ligne en tête des participants** : je m'affiche toujours en premier dans la liste (avec "toi" à la place de mon pseudo), quel que soit mon statut RSVP — plus facile de me retrouver dans une liste qui peut compter plusieurs dizaines d'amis.
   - **Association chien ↔ participant** (pour le compteur "· N chiens") : un chien n'est jamais compté sous ses deux co-owners s'ils participent tous les deux à la balade — il n'est compté que pour celui qui l'a effectivement confirmé (`walk_dogs.updated_by`, champ d'audit, exposé sur l'entité domaine `WalkDog.updatedBy`). Logique d'appariement dans `pairParticipantsWithDogs` (présentation, pas domaine), TDD, vérifié par smoke test.
   - Il n'y a plus de carte "Mes chiens" séparée dans le corps scrollable — la sélection de mes chiens vit désormais dans le `RsvpSheet` lui-même (voir point 8).
8. **`RsvpSheet` — sélection de chiens repliable dans la feuille, pas une carte à part** (plusieurs itérations après retours sur une maquette) :
   - Trois états locaux (`"buttons" | "dogs" | "collapsed"`), gérés dans `WalkDetailScreen` — `RsvpSheet` lui-même reste générique (accepte des `children` et un flag `hideButtons`, ne connaît rien aux chiens).
   - Répondre "Oui" fait apparaître la sélection de chiens (pills réutilisant le pattern déjà en place pour la sélection d'amis de `WalkFormScreen`) directement dans la feuille dockée, qui remonte (`LayoutAnimation`). Décision explicite : seul "Oui" révèle la sélection, pas "Peut-être".
   - Sélection automatique : si je n'ai qu'un seul chien, il est confirmé automatiquement dès ma première réponse "oui" (pas de choix à faire dans une liste d'un seul élément).
   - Chien en foyer partagé : anneau pointillé teal sur la pastille photo, qui reste affiché même une fois le chien sélectionné — le badge de sélection (coche verte en bas à droite de la photo, même pattern que la sélection d'amis) vient s'ajouter par-dessus, pas remplacer l'anneau.
   - "Valider" (après "oui") ou une réponse "non"/"peut-être" réduit la feuille à une ligne : `StatusBadge` + noms des chiens amenés, avec un bouton "Modifier" (si "oui") ou "Changer" (sinon) pour la ré-ouvrir.
   - Organisateur : "Annuler cette balade" n'est plus un lien discret en bas de page — un bouton "•••" dans l'en-tête ouvre un petit menu (une seule entrée pour l'instant) qui mène à une confirmation stylée maison (pas l'`Alert` natif), nommant les participants ayant déjà répondu "oui" le cas échéant.
   - Confirmer/retirer un chien met à jour la carte "Chiens confirmés" de façon optimiste (`useToggleDogForWalk`), sans attendre l'aller-retour réseau.
9. **Icônes** — les emoji de navigation (barre d'onglets) et de métadonnée (date/heure/durée, sur la carte de balade comme sur l'en-tête du détail) ont été remplacés par un set SVG (`Icons.tsx`, `react-native-svg`), pour un rendu cohérent entre plateformes et un meilleur contrôle du contraste (`$accentSoftText`, pas `$accent` qui n'a que 2,8:1 de contraste sur blanc). Un composant `Tag` générique (petit label secondaire) a été introduit à cette occasion mais n'est plus utilisé nulle part dans ce domaine aujourd'hui — ses deux usages d'origine ("toi" sur un chien confirmé, badge "Foyer partagé") ont depuis été retirés au profit de l'anneau pointillé du point 8.
10. **Reprogrammation d'une balade (US7.1)** — deux décisions de scope prises avec l'utilisateur au moment de l'implémentation :
    - **Les chiens confirmés ne sont plus effacés par une reprogrammation** — comportement revu par rapport à ce qu'implémentait le trigger DB dès l'origine (`reset_walk_responses_on_reschedule`, voir `modele-de-donnees.md`) : seul le statut RSVP repasse à "pending" (tout le monde doit re-répondre oui/non/peut-être), les lignes `walk_dogs` sont désormais conservées telles quelles — un chien déjà confirmé n'a pas besoin d'être re-sélectionné après un simple changement d'heure/lieu/durée. Migration `20260921213218_walks_reschedule_keeps_dogs.sql`, vérifié directement en base (participant repassé à `pending`, `walk_dogs` inchangé).
    - **On peut inviter de nouveaux amis en reprogrammant, mais pas désinviter un participant existant** — ajouté à `UpdateWalkInput.newFriendIds`, `upsert` avec `ignoreDuplicates: true` pour ne jamais toucher au statut d'un participant déjà invité. Retirer un participant sans tout annuler reste explicitement hors-MVP (voir `roadmap.md`).
    - **Pas de sélection de chiens sur `WalkEditScreen`** — cohérent avec le point précédent : puisque les chiens confirmés survivent à la reprogrammation, il n'y a rien à re-sélectionner sur cet écran ; seule la réponse RSVP elle-même doit être reconfirmée, via le flow normal de `WalkDetailScreen`.
    - **Pas de garde-fou côté client sur "balade déjà commencée"** avant d'ouvrir `WalkEditScreen` — même logique que "Annuler cette balade" (aucune vérification `start_time` avant d'agir) : la policy RLS `walks_update_organizer_future_only` reste la source de vérité, une erreur serveur est rattrapée par un message générique côté écran.
11. **Notifications push (US8.1)** — architecture détaillée dans `modele-de-donnees.md` §Notifications push et `architecture-technique.md` §Backend. Décision d'implémentation : les triggers DB appellent l'API Expo Push directement via `pg_net`, sans Edge Function de relai (celle envisagée à l'origine dans `architecture-technique.md`) — Expo Push n'exigeant aucun secret serveur, le relai n'aurait fait qu'ajouter une URL/un secret à gérer différemment entre dev local et cloud pour la même unique requête HTTP que SQL peut déjà émettre. Vérifié directement en base (le trigger d'invitation et celui de reprogrammation appellent bien `https://exp.host/--/api/v2/push/send`, réponse 200 avec un token de test invalide reconnu comme tel par Expo). Aucun test de bout en bout possible dans cet environnement (pas d'EAS dev build/appareil réel disponible ici) — voir `architecture-technique.md` pour la limite structurelle du simulateur iOS sur ce point.
