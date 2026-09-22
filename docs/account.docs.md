# Specs — Domaine Account (auth, profil, compte)

*Ce fichier vit dans le repo à `src/domain/account/account.docs.md`. Voir `architecture-technique.md` §Documentation des specs pour la convention.*

**US1.1** — En tant qu'utilisateur, je veux me connecter via un lien magique envoyé par email, afin de ne pas avoir à gérer de mot de passe.

**US1.2** — En tant que nouvel utilisateur, je veux compléter mon profil (pseudo obligatoire, avatar et premier chien optionnels) après ma première connexion, afin de pouvoir utiliser l'application.

**US9.1** — En tant qu'utilisateur, je veux pouvoir supprimer définitivement mon compte, afin d'exercer mon droit à l'oubli.

Décision de conception : le consentement RGPD/CGU reste **implicite** — une mention avec liens cliquables vers les CGU et la politique de confidentialité est affichée sur l'écran de connexion, sans case à cocher bloquante. Aucun scénario de validation n'y est donc associé. (Détail RGPD complet → `rgpd-securite.md`.)

```gherkin
Feature: Connexion par Magic Link

  Scenario: Demande de lien avec un email valide
    Given je ne suis pas connecté
    When je saisis une adresse email valide et je demande un lien de connexion
    Then je reçois un email contenant un lien magique
    And un message m'indique de consulter ma boîte mail

  Scenario: Connexion via le lien reçu
    Given j'ai reçu un email avec un lien magique valide
    When je clique sur le lien depuis mon appareil
    Then je suis authentifié
    And je suis redirigé vers l'écran principal (liste des balades, premier onglet — il n'y a pas d'écran d'accueil dédié)

  Scenario Edge Case: Email au format invalide
    Given je ne suis pas connecté
    When je saisis une adresse email au format invalide
    Then je vois un message d'erreur "Adresse email invalide"
    And aucun email n'est envoyé

  Scenario Edge Case: Lien magique expiré
    Given j'ai reçu un lien magique dont la durée de validité est dépassée
    When je clique sur le lien
    Then je vois un message "Ce lien a expiré, demande un nouveau lien"
    And je ne suis pas authentifié

  Scenario Edge Case: Lien magique déjà utilisé
    Given j'ai déjà utilisé un lien magique pour me connecter une première fois
    When je clique une seconde fois sur ce même lien
    Then je vois un message d'erreur clair
    And je suis invité à redemander un nouveau lien

  Scenario Edge Case: Demandes de lien rapprochées
    Given j'ai déjà demandé un lien magique il y a moins de quelques secondes
    When je redemande immédiatement un nouveau lien
    Then la demande est limitée (rate limiting natif Supabase Auth)
    And je vois un message m'invitant à patienter

Feature: Création du profil (onboarding après le premier lien magique)

  Scenario: Première connexion — profil à créer
    Given je clique sur mon lien magique pour la toute première fois
    When je suis authentifié
    Then aucun profil n'existe encore pour mon compte
    And je suis dirigé vers l'étape de choix de pseudo (onboarding), pas vers l'accueil

  Scenario: Choix du pseudo
    Given je suis en cours d'onboarding
    When je saisis un pseudo respectant le format attendu (3 à 20 caractères, lettres/chiffres/underscore/point — pas de contrainte d'unicité, voir "Pseudo identique à un autre utilisateur" plus bas)
    Then mon profil est créé avec ce pseudo
    And un code d'invitation m'est automatiquement généré
    And je passe à l'étape suivante de l'onboarding (avatar)

  Scenario Edge Case: Pseudo vide
    Given je suis à l'étape de choix du pseudo
    When je valide sans rien saisir
    Then je vois un message "Le pseudo est obligatoire"
    And mon profil n'est pas créé

  Scenario Edge Case: Pseudo au format invalide
    Given je suis à l'étape de choix du pseudo
    When je saisis un pseudo trop court, trop long, ou contenant des caractères non autorisés
    Then je vois un message précisant le format attendu
    And mon profil n'est pas créé

  Scenario: Pseudo identique à un autre utilisateur
    Given le pseudo "Bob" est déjà utilisé par un autre utilisateur
    When je saisis "Bob" comme pseudo
    Then mon profil est créé normalement avec le pseudo "Bob"
    And les deux comptes coexistent (la différenciation se fait via l'email, pas le pseudo)

  Scenario: Ajout d'un avatar (optionnel)
    Given mon profil vient d'être créé avec un pseudo
    When on me propose d'ajouter une photo de profil et que je choisis une image valide depuis ma galerie ou mon appareil photo
    Then l'image est uploadée dans le stockage
    And elle devient ma photo de profil

  Scenario Edge Case: Avatar — passer l'étape
    Given je suis à l'étape d'ajout d'avatar
    When je choisis de passer cette étape
    Then aucune photo n'est enregistrée
    And je peux continuer l'onboarding sans avatar

  Scenario Edge Case: Avatar — format ou taille non supportés
    Given je suis à l'étape d'ajout d'avatar
    When je sélectionne un fichier dans un format non supporté ou dépassant la taille maximale autorisée
    Then je vois un message d'erreur explicite
    And aucune image n'est uploadée

  Scenario: Proposition d'ajouter un premier chien (optionnel)
    Given mon onboarding est en cours après le choix du pseudo
    When on me propose de créer la fiche de mon premier chien
    Then je peux le faire immédiatement ou passer cette étape ("plus tard")
    And dans les deux cas, l'onboarding se termine et j'accède à l'écran principal (liste des balades, premier onglet — il n'y a pas d'écran d'accueil dédié)

  Scenario Edge Case: Onboarding interrompu avant le choix du pseudo
    Given je me suis authentifié via le lien magique mais je n'ai pas encore choisi de pseudo
    When je ferme puis rouvre l'application
    Then je suis redirigé vers l'étape "choix du pseudo"
    And je n'ai pas accès au reste de l'application tant que mon profil n'est pas créé

  Scenario: Connexion d'un utilisateur existant
    Given un profil existe déjà pour mon compte (pseudo déjà choisi lors d'une session précédente)
    When je clique sur mon lien magique
    Then je suis authentifié
    And je suis dirigé directement vers l'écran principal (liste des balades, premier onglet — il n'y a pas d'écran d'accueil dédié), sans repasser par l'onboarding

Feature: Modification du profil (pseudo, photo)

  Scenario: Consulter son adresse email
    Given je suis connecté et j'accède à mes réglages de profil
    When je regarde l'écran
    Then je vois l'adresse email de mon compte, affichée en lecture seule (pas de champ de saisie)
    And aucune action de l'écran ne permet de la modifier — l'email est immuable après création du compte

  Scenario: Modifier son pseudo
    Given je suis connecté et j'accède à mes réglages de profil
    When je saisis un nouveau pseudo respectant le format attendu (3 à 20 caractères, lettres/chiffres/underscore/point)
    Then mon pseudo est mis à jour
    And aucune vérification d'unicité n'est appliquée (plusieurs comptes peuvent partager le même pseudo)

  Scenario Edge Case: Pseudo vide lors de la modification
    Given je modifie mon pseudo
    When je valide un champ vide
    Then je vois un message "Le pseudo est obligatoire"
    And mon pseudo précédent est conservé

  Scenario Edge Case: Pseudo au format invalide lors de la modification
    Given je modifie mon pseudo
    When je saisis un pseudo trop court, trop long, ou contenant des caractères non autorisés
    Then je vois un message précisant le format attendu
    And mon pseudo précédent est conservé

  Scenario: Remplacer sa photo de profil
    Given je suis connecté et j'ai déjà une photo de profil
    When je sélectionne une nouvelle image valide
    Then la nouvelle image est uploadée et devient ma photo de profil
    And l'ancienne image est supprimée du stockage

  Scenario: Ajouter une photo de profil alors que je n'en avais pas
    Given je suis connecté et je n'ai pas encore de photo de profil
    When je sélectionne une image valide
    Then l'image est uploadée et devient ma photo de profil

  Scenario: Supprimer sa photo de profil
    Given je suis connecté et j'ai une photo de profil
    When je choisis de la supprimer
    Then je n'ai plus de photo de profil (retour à l'état par défaut)
    And l'image est supprimée du stockage

  Scenario Edge Case: Format ou taille non supportés lors de la modification
    Given je modifie ma photo de profil
    When je sélectionne un fichier dans un format non supporté ou dépassant la taille maximale autorisée
    Then je vois un message d'erreur explicite
    And ma photo de profil précédente reste inchangée

Feature: Préférence de thème (clair/sombre)

  Scenario: Choisir un thème explicite
    Given je suis dans mes réglages
    When je choisis "Clair" ou "Sombre"
    Then l'app applique ce thème immédiatement, indépendamment du réglage système de l'appareil
    And ce choix est conservé après avoir quitté et rouvert l'app

  Scenario: Suivre le thème du système
    Given j'ai choisi "Système" dans mes réglages (réglage par défaut)
    When le thème système de l'appareil change (clair ↔ sombre)
    Then l'app suit ce changement automatiquement

Feature: Déconnexion

  Scenario: Se déconnecter
    Given je suis connecté
    When je choisis "Se déconnecter" depuis mes réglages
    Then ma session est terminée
    And je suis redirigé vers l'écran de connexion
    And mon compte n'est pas supprimé (données intactes, simple fin de session)

Feature: Suppression de compte

  Scenario: Suppression nominale
    Given je n'ai aucun chien co-owned et aucune balade future en tant qu'organisateur
    When je confirme la suppression de mon compte
    Then mon profil et mes données personnelles sont supprimés définitivement
    And je suis déconnecté et redirigé vers l'écran de connexion

  Scenario Edge Case: Confirmation explicite requise
    Given je clique sur "Supprimer mon compte"
    When l'action n'a pas encore été confirmée
    Then une étape de confirmation explicite m'est présentée
    And la suppression n'est effective qu'après cette confirmation

  Scenario Edge Case: Suppression avec balades futures organisées
    Given j'organise une balade future avec des participants
    When je supprime mon compte
    Then la balade est annulée et supprimée
    And tous les participants reçoivent une notification "Balade annulée — l'organisateur a quitté Vadrouille"

  Scenario Edge Case: Suppression avec balades passées organisées
    Given j'ai organisé une balade dans le passé avec des participants
    When je supprime mon compte
    Then la balade passée est conservée pour l'historique des autres participants
    And mon identité y est remplacée par "Utilisateur supprimé"

  Scenario Edge Case: Suppression avec chiens co-owned
    Given je co-possède le chien "Rex" avec Alice
    When je supprime mon compte
    Then Rex reste disponible dans le compte d'Alice
    And mon lien de co-ownership sur Rex est retiré
```

## Hypothèses & points à confirmer

1. **Format de confirmation de suppression de compte** — modélisé comme une étape de confirmation explicite, sans préciser l'UI exacte (double-tap, saisie d'un mot, etc.) — détail à trancher en conception UI plutôt qu'en specs fonctionnelles.
2. **Rate limiting du Magic Link** — supposé géré nativement par Supabase Auth (comportement par défaut), pas de règle métier custom à développer.
3. **"Proposition d'ajouter un premier chien"** (fin de l'onboarding) — implémenté comme une deuxième étape de route (`/onboarding/dog`, après `/onboarding`), pas un état local dans le même écran : la fiche gate d'authentification (`AuthGate` dans `app/_layout.tsx`) redirige normalement vers l'accueil dès que le profil existe, donc les deux étapes d'onboarding vivent sous le même segment `onboarding` pour que la gate ne coupe pas court entre les deux. Formulaire minimal (nom uniquement, réutilise `CreateDog` du domaine `dog`) — race/date de naissance/sexe/photo restent modifiables ensuite depuis "Mes chiens", cohérent avec le pseudo ("tu pourras le changer plus tard").
4. **Notification "Balade annulée — l'organisateur a quitté Vadrouille"** (suppression de compte avec balades futures organisées) — implémenté : l'Edge Function `delete-account` (déjà en contexte `service_role`) appelle directement l'API Expo Push pour chaque participant restant, avant de supprimer les balades futures. Best-effort — une erreur d'envoi n'empêche jamais la suppression du compte elle-même. Voir `modele-de-donnees.md` §Notifications push.
5. **"Utilisateur supprimé"** (balades passées organisées, après suppression du compte) — implémenté : `PastWalkDetailScreen` affiche "Organisée par {nom}", et `organizerDisplayName` (`src/walk/presentation/pair-participants-with-dogs.ts`) retombe sur "Utilisateur supprimé" quand `organizerId` est nul. Non ajouté à `WalkDetailScreen` (balades à venir) : le cas n'existe pas en pratique côté client puisque l'Edge Function `delete-account` annule déjà les balades futures d'un compte supprimé (voir scénario "Suppression avec balades futures organisées" ci-dessus) — seul un `organizerId` non nul peut donc apparaître sur une balade à venir.
