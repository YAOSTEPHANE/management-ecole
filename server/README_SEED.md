# Guide d'utilisation du Seed - Base de données de test

## 🎯 Objectif

Ce script permet de remplir la base de données avec des données de test pour faciliter le développement et les tests.

## 📋 Données créées

### Utilisateurs
- **1 Administrateur**
  - Email: `admin@school.com`
  - Mot de passe: `password123`

- **3 Enseignants**
  - `teacher1@school.com` (Mathématiques)
  - `teacher2@school.com` (Français)
  - `teacher3@school.com` (Histoire-Géographie)
  - Mot de passe: `password123`

- **3 Élèves**
  - `student1@school.com` (Lucas Moreau)
  - `student2@school.com` (Emma Lefebvre)
  - `student3@school.com` (Thomas Garcia)
  - Mot de passe: `password123`

- **2 Parents**
  - `parent1@school.com` (Claire Moreau - mère de Lucas)
  - `parent2@school.com` (Marc Lefebvre - père d'Emma)
  - Mot de passe: `password123`

### Données académiques
- **2 Classes** : 6ème A et 5ème B
- **3 Cours** : Mathématiques, Français, Histoire-Géographie
- **6 Notes** : Réparties entre les élèves
- **2 Absences** : Une absence justifiée et un retard
- **2 Devoirs** : Un devoir de mathématiques et une rédaction
- **6 Entrées d'emploi du temps** : Réparties sur la semaine

## 🚀 Utilisation

### Exécuter le seed

```bash
cd server
npm run prisma:seed
```

### Réinitialiser et remplir la base de données

Si vous voulez réinitialiser complètement la base de données et la remplir avec les données de test :

```bash
cd server

# Option 1 : Réinitialiser et seed
npm run prisma:push -- --force-reset
npm run prisma:seed

# Option 2 : Utiliser Prisma Migrate (si vous utilisez des migrations)
npm run prisma:migrate reset
npm run prisma:seed
```

## ⚠️ Attention

- Le script **supprime toutes les données existantes** avant d'ajouter les données de test
- Utilisez uniquement en environnement de développement
- Ne jamais exécuter en production !

## 🔐 Identifiants de test

Tous les comptes utilisent le mot de passe : **`password123`**

### Comptes recommandés pour tester

1. **Administrateur** : `admin@school.com`
   - Accès complet à toutes les fonctionnalités

2. **Enseignant** : `teacher1@school.com`
   - Peut gérer les notes, absences et devoirs

3. **Élève** : `student1@school.com`
   - Peut voir ses notes, emploi du temps et devoirs

4. **Parent** : `parent1@school.com`
   - Peut suivre les résultats de son enfant (Lucas)

## 📝 Personnalisation

Pour modifier les données de test, éditez le fichier `server/prisma/seed.ts`.






