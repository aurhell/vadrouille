# Specs — Domaine Friend

*Ce fichier vit dans le repo à `src/domain/friend/friend.docs.md`. Voir `architecture-technique.md` §Documentation des specs pour la convention.*

**US3.1** — En tant qu'utilisateur, je veux ajouter un ami via un code d'invitation, afin de pouvoir l'inviter à des balades.

```gherkin
Feature: Ajout d'un ami par code d'invitation

  Scenario: Rédemption d'un code valide
    Given "Alice" a pour code d'invitation "AB12CD"
    When je saisis le code "AB12CD"
    Then je deviens ami avec Alice
    And Alice devient automatiquement mon amie (relation bidirectionnelle)

  Scenario Edge Case: Code invalide ou inexistant
    Given je saisis un code qui ne correspond à aucun profil
    When je valide
    Then je vois un message "Code invalide"
    And aucune amitié n'est créée

  Scenario Edge Case: Rédemption de son propre code
    Given mon propre code d'invitation est "XY99ZZ"
    When je saisis mon propre code
    Then l'action est refusée
    And je vois un message "Tu ne peux pas t'ajouter toi-même"

  Scenario Edge Case: Amitié déjà existante
    Given je suis déjà ami avec Alice
    When je saisis à nouveau le code d'Alice
    Then aucune nouvelle relation n'est créée
    And je vois un message m'indiquant que nous sommes déjà amis

  Scenario Edge Case: Double rédemption simultanée
    Given deux requêtes tentent de rédimer le même code vers la même paire d'utilisateurs au même instant
    When les deux requêtes sont traitées
    Then une seule relation d'amitié est créée (contrainte d'unicité en base)
    And aucune erreur visible n'est présentée à l'utilisateur

  Scenario: Régénération du code
    Given mon code actuel est "XY99ZZ"
    When je régénère mon code depuis les réglages
    Then un nouveau code est généré et affiché
    And l'ancien code "XY99ZZ" n'est plus valide pour être rédimé

  Scenario: Consulter la liste de mes amis
    Given j'ai ajouté un ou plusieurs amis
    When j'accède à l'écran de mes amis
    Then je vois la liste de tous mes amis actuels
```

## Hypothèses & points à confirmer

Aucune à ce stade pour ce domaine.
