# Specs — Domaine Dog

*Ce fichier vit dans le repo à `src/domain/dog/dog.docs.md`. Voir `architecture-technique.md` §Documentation des specs pour la convention.*

**US2.1** — En tant qu'utilisateur, je veux ajouter une fiche pour mon chien, afin de pouvoir l'associer à des balades.

**US2.2** — En tant qu'utilisateur, je veux partager la propriété d'un chien avec un ami (foyer partagé), afin que nous puissions tous les deux l'inscrire à des balades.

**US8.2** — En tant qu'utilisateur, je veux être notifié quand un ami m'invite à devenir co-owner d'un de ses chiens, afin de pouvoir répondre à l'invitation.

```gherkin
Feature: Créer et gérer une fiche chien

  Scenario: Création d'un chien
    Given je suis connecté
    When je renseigne un nom pour un nouveau chien et je valide
    Then le chien est créé et apparaît dans ma liste de chiens
    And je suis automatiquement défini comme "owner" du chien

  Scenario Edge Case: Nom de chien vide
    Given je crée un chien
    When je valide sans renseigner de nom
    Then je vois un message d'erreur "Le nom est obligatoire"
    And le chien n'est pas créé

  Scenario: Modifier une fiche chien
    Given je suis owner ou co-owner (accepté) d'un chien
    When je modifie son nom, sa race ou sa date de naissance
    Then les informations sont mises à jour
    And tous les owners/co-owners voient la mise à jour (donnée partagée)

  Scenario: Supprimer un chien
    Given je suis owner d'un chien sans co-owner
    When je supprime sa fiche
    Then le chien est définitivement supprimé
    And sa photo est supprimée du stockage

  Scenario Edge Case: Un co-owner tente de supprimer un chien
    Given je suis co-owner (pas owner) d'un chien
    When je tente de supprimer sa fiche
    Then l'action est refusée (seul l'owner peut supprimer la fiche)

  Scenario: Ajout d'une photo au chien (optionnel)
    Given je crée ou modifie la fiche d'un chien dont je suis owner ou co-owner
    When j'ajoute une photo valide depuis ma galerie ou mon appareil photo
    Then l'image est uploadée dans le stockage
    And elle devient la photo de ce chien

  Scenario Edge Case: Photo de chien — format ou taille non supportés
    Given j'ajoute une photo à la fiche d'un chien
    When je sélectionne un fichier dans un format non supporté ou dépassant la taille maximale autorisée
    Then je vois un message d'erreur explicite
    And aucune image n'est uploadée

  Scenario Edge Case: Modification de la photo par un co-owner
    Given "Rex" est co-owned par moi et par Alice
    When Alice change la photo de Rex
    Then la nouvelle photo est visible pour moi également (donnée partagée par le chien, pas par owner)

Feature: Foyer partagé (co-ownership)

  Scenario: Inviter un co-owner sur un chien existant
    Given je suis owner du chien "Rex"
    And "Alice" est mon amie
    When j'invite Alice comme co-owner de Rex
    Then Alice reçoit une invitation à devenir co-owner de Rex
    And elle n'est pas encore co-owner tant qu'elle n'a pas répondu

  Scenario: Acceptation de l'invitation de co-ownership
    Given Alice a reçu une invitation à devenir co-owner de "Rex"
    When Alice accepte l'invitation
    Then Alice devient co-owner de Rex
    And Rex apparaît dans sa liste de chiens

  Scenario: Refus de l'invitation de co-ownership
    Given Alice a reçu une invitation à devenir co-owner de "Rex"
    When Alice refuse l'invitation
    Then Alice ne devient pas co-owner
    And Rex n'apparaît pas dans sa liste de chiens

  Scenario Edge Case: Inviter un co-owner qui n'est pas mon ami
    Given je suis owner du chien "Rex"
    And "Bob" n'est pas dans ma liste d'amis
    When je tente d'inviter Bob comme co-owner de Rex
    Then l'action est refusée
    And je vois un message m'indiquant que je dois d'abord être ami avec cette personne

  Scenario: Un co-owner se retire lui-même
    Given "Rex" est co-owned (accepté) par moi et par Alice
    When Alice choisit de se retirer de la co-ownership de Rex
    Then Alice n'est plus co-owner de Rex
    And Rex disparaît de sa liste de chiens
    And Rex reste inchangé pour les autres owners/co-owners

  Scenario Edge Case: Un co-owner supprime son compte
    Given "Rex" est co-owned par moi et par Alice
    When Alice supprime son compte
    Then Rex reste dans ma liste de chiens
    And le lien de co-ownership d'Alice est retiré

  Scenario Edge Case: Le seul owner supprime son compte
    Given je suis l'unique owner du chien "Rex" (pas de co-owner)
    When je supprime mon compte
    Then Rex est définitivement supprimé
    And les photos associées sont supprimées du stockage

Feature: Notification de co-ownership

  Scenario: Réception d'une invitation de co-ownership
    Given un ami m'invite à devenir co-owner d'un de ses chiens
    Then je reçois une notification push "🐾 {Ami} te propose de co-gérer {Chien} avec lui"
```

## Hypothèses & points à confirmer

1. **Suppression d'une fiche chien** — réservée à l'owner (pas aux co-owners), par cohérence avec la distinction de rôle déjà établie dans `dog_owners`. À confirmer.
