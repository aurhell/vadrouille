# 📦 Distribution — Vadrouille

## Les 3 phases de distribution

1. **Dev local** (actuel) — toi seul, stack Supabase locale via Docker, Expo Dev Client/Expo Go sur ton téléphone → voir `architecture-technique.md`
2. **Cercle privé** (ce document) — toi + une poignée d'amis, en dehors des stores officiels
3. **Publication publique** (plus tard, si validé) — App Store / Play Store

Aucun changement d'architecture entre ces phases : uniquement des changements de configuration/déploiement (profils EAS, backend hébergé). Le code reste identique.

## Backend pour la phase "cercle privé"

Le Docker local tourne sur ta machine — tes amis ne peuvent pas s'y connecter depuis leur téléphone. Il faut donc un **projet Supabase hébergé** (cloud), même à ce stade :

- Plan **gratuit** Supabase largement suffisant pour une poignée d'utilisateurs (limites généreuses en lignes de DB, requêtes, stockage, Edge Functions)
- Région **EU**, cohérent avec la décision RGPD déjà actée (`rgpd-securite.md`)
- Un seul environnement partagé suffit à ce stade — pas besoin de séparer staging/production tant qu'on reste entre amis. Cette distinction sera à introduire avant une publication publique
- Les mêmes migrations que le schéma local (`modele-de-donnees.md`) s'appliquent sur ce projet cloud via la CLI Supabase (`supabase db push` ou équivalent)

## Build de l'app — EAS Build

Prérequis communs : compte Expo (gratuit) + `eas-cli` + `eas.json` avec un profil dédié (ex: `preview`), distinct du profil `production` qui servira à la publication sur les stores plus tard.

### Android — simple et gratuit

- Build en `.apk` (pas `.aab`, réservé au Play Store), profil de distribution `"internal"` dans `eas.json`
- EAS génère un lien de téléchargement (page web + QR code)
- Chaque ami Android ouvre le lien sur son téléphone, active "Installer depuis des sources inconnues" (une seule fois), installe directement
- **Aucun compte développeur nécessaire, gratuit**

### iOS — nécessite un compte Apple Developer Program (obligatoire)

Contrairement à Android, Apple ne permet aucune distribution — même strictement privée — sans compte développeur payant (**99$/an**). Incompressible, quel que soit le canal choisi ci-dessous.

**TestFlight avec lien public (recommandé pour ce cas d'usage)**
- Build signé App Store, envoyé via `eas submit` vers TestFlight
- Génération d'**un seul lien public** dans App Store Connect, partageable où tu veux (groupe WhatsApp, etc.)
- Chaque ami : installe l'app **TestFlight** (une fois), tape sur le lien, installe ton app — aucune collecte d'UDID, aucun rebuild à chaque nouvel ami
- Jusqu'à 10 000 testeurs via lien public — largement suffisant
- ⚠️ Correction d'une confusion classique : les "testeurs internes" TestFlight (sans review, instantanés) doivent être membres de ton équipe Apple Developer avec un rôle — inutilisable pour des amis. Un lien public relève du **testing externe**, qui impose une **Beta App Review** (~24h en général, parfois plus) pour le **premier build uniquement** ; les builds suivants passent généralement sans re-review complète
- ⚠️ **Point de vigilance lié à l'auth Magic Link** : un reviewer Apple doit pouvoir se connecter pour tester l'app lors de cette review — prévoir un compte de démo dédié (ou une note explicative précise) dans les informations de review App Store Connect. Contrainte ponctuelle (le premier build), pas récurrente
- Les builds expirent après **90 jours** — sans impact réel ici vu le rythme d'itération prévu sur cette phase

**Alternative — Ad-hoc** (uniquement si un jour tu veux restreindre l'accès à une liste fermée d'appareils) : signature limitée aux UDID enregistrés au préalable, zéro review humaine (pas de souci reviewer/Magic Link), mais contrainte forte — **tout nouvel appareil ajouté impose un rebuild complet**. Pas pertinent tant que l'objectif est juste "accès simple pour toi et tes potes", sans restriction particulière.

→ **TestFlight + lien public recommandé** : aucune gestion de liste (UDID ou testeurs), un seul lien à partager, aucun rebuild quand un ami rejoint.

## Itérer rapidement — EAS Update (OTA)

Une fois les builds installés chez tes amis, les mises à jour **purement JS/UI** (la grande majorité des évolutions de features à ce stade) peuvent être poussées instantanément via `eas update`, sans reconstruire ni renvoyer de nouveau lien d'installation.

⚠️ Limite : tout changement touchant au natif (nouvelle lib avec code natif, nouvelle permission, changement d'icône, montée de version Expo SDK...) nécessite un nouveau build EAS complet, redistribué comme au premier build. Sur iOS, un nouveau build tous les ~90 jours sera de toute façon nécessaire pour éviter l'expiration TestFlight — l'occasion d'embarquer les changements natifs accumulés en une fois.

## Coûts récapitulatifs (phase cercle privé)

| Poste | Coût |
|---|---|
| Compte Expo / EAS | Gratuit (plan Free — à surveiller si builds très fréquents) |
| Apple Developer Program | **99$/an**, obligatoire dès qu'un ami est sur iPhone |
| Google Play Developer | Non nécessaire à ce stade (uniquement si publication Play Store plus tard) |
| Supabase | Gratuit (plan Free suffisant pour une poignée d'utilisateurs) |

## Chemin vers la publication publique (plus tard, si ça plaît)

Pas de refonte technique — juste un changement de configuration :

1. Basculer le profil EAS de `preview` vers `production`, `eas submit` vers App Store et Play Store
2. Prérequis supplémentaires à ce moment-là :
   - **Politique de confidentialité publiée** (déjà identifiée comme point ouvert dans `rgpd-securite.md`)
   - Compte **Google Play Developer** (25$ à vie, en plus de l'Apple Developer déjà payé pour la phase privée)
   - Icônes et captures d'écran de store, fiche store (description, mots-clés)
   - Passage en revue par les deux stores (délai variable : quelques heures pour Google, souvent 1 à 3 jours pour Apple)
   - Repenser l'environnement : séparer un projet Supabase "production" du projet "cercle privé" pour ne pas mélanger les données des premiers testeurs avec de vrais utilisateurs
