# 🔒 RGPD & sécurité — Vadrouille

## Authentification

Magic Link — email seul collecté, pas de mot de passe, pas de sous-traitant tiers (pas de Google/Apple). Minimisation des données dès la conception.

Le premier lien magique authentifie l'utilisateur (`auth.users`) mais ne crée pas encore de `profile` : un onboarding post-connexion impose le choix d'un pseudo (obligatoire) avant tout accès au reste de l'appli ; avatar et premier chien sont proposés mais optionnels (détail → `account.docs.md`).

## Consentement

Implicite — mention avec liens cliquables vers les CGU et la politique de confidentialité sur l'écran de connexion, pas de case à cocher bloquante.

## Droit à l'oubli — suppression de compte

Déclenchée par l'utilisateur (bouton dans les réglages) → appel à une Edge Function dédiée (nécessite `service_role`, le client ne peut pas s'auto-supprimer de `auth.users`), qui applique cette cascade :

| Donnée | Traitement à la suppression |
|---|---|
| `profiles`, `auth.users` | Suppression définitive (+ avatar Storage) |
| `dogs` (dont l'utilisateur est seul owner) | Suppression définitive (+ photos Storage) |
| `dogs` (co-owned) | Retrait de la ligne `dog_owners` de l'utilisateur uniquement, le chien reste pour le/les autre(s) owner(s) |
| `friendships` | Suppression des lignes impliquant l'utilisateur |
| `walks` futures organisées | Annulées et supprimées, + notification push aux participants ("Balade annulée — l'organisateur a quitté Vadrouille") |
| `walks` passées organisées | Conservées pour l'historique des autres participants, `organizer_id` mis à `NULL` (affiché "Utilisateur supprimé") |
| `walk_participants` / `walk_dogs` liés à l'utilisateur | Supprimées |
| Fichiers Storage (avatar, photos de chiens supprimés) | Supprimés |

*Non-MVP* : portabilité des données (export sur demande) — faible volume de données par utilisateur, gérable manuellement au début.

## Points ouverts

1. Politique de confidentialité formelle à rédiger (texte légal, région d'hébergement Supabase à choisir en cohérence RGPD, ex : EU)
