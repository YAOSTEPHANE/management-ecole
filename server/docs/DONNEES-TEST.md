# Données de test (développement)

## Prérequis

1. MongoDB accessible (`DATABASE_URL` dans `server/.env`).
2. Schéma à jour : `cd server && npm run prisma:push`
3. **Attention** : le seed de dev **efface toutes les données** de la base ciblée.

## Lancer le jeu de données

Depuis la racine du projet :

```bash
npm run db:seed:dev
```

Ou depuis `server/` :

```bash
npm run prisma:seed:dev
```

## Mot de passe commun

Tous les comptes de démonstration utilisent :

```
Test@1234
```

(majuscule, minuscule, chiffre, caractère spécial — conforme à la politique mot de passe.)

## Établissement

| Champ | Valeur |
|--------|--------|
| Nom | Collège Les Palmiers (démo) |
| Slug | `ecole-test-dev` |

## Comptes principaux

| Rôle | E-mail |
|------|--------|
| Super admin | `superadmin@tranlefet.ci` |
| Admin | `admin@school.com` |
| Enseignant | `teacher1@school.com` … `teacher3@school.com` |
| Élève | `student1@school.com` … `student9@school.com` |
| Parent | `parent1@school.com`, `parent2@school.com` |
| Éducateur | `educator1@school.com`, `educator2@school.com` |
| Secrétaire | `secretary@school.com` |
| Économe | `bursar@school.com` |
| Études | `studies@school.com` |
| Infirmier(ère) | `nurse@school.com` |
| Bibliothécaire | `librarian@school.com` |
| Comptable | `accountant@school.com` |

## Contenu généré (aperçu)

- 2 classes (6ème A, 5ème B), cours, notes, absences, emplois du temps
- Frais de scolarité, paiements, admissions
- Santé, bibliothèque, e-learning, activités parascolaires
- Annonces, rendez-vous parents–enseignants, personnel STAFF

## Bootstrap production (sans effacer la base)

Pour un premier déploiement avec uniquement l’admin et l’école par défaut :

```bash
cd server
# Définir BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD, etc. dans .env
npm run bootstrap:production
```
