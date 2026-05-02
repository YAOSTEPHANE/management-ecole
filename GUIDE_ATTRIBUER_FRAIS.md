# Guide - Attribuer des Frais de Scolarité aux Élèves

Ce guide explique comment attribuer des frais de scolarité aux élèves dans l'application.

## 📋 Table des matières

1. [Accéder à la gestion des frais](#accéder-à-la-gestion-des-frais)
2. [Attribuer un frais à un élève](#attribuer-un-frais-à-un-élève)
3. [Attribuer des frais à une classe entière](#attribuer-des-frais-à-une-classe-entière)
4. [Modifier un frais](#modifier-un-frais)
5. [Supprimer un frais](#supprimer-un-frais)
6. [Créer des frais de test](#créer-des-frais-de-test)

---

## 🚀 Accéder à la gestion des frais

1. Connectez-vous en tant qu'**Administrateur**
2. Dans le menu de navigation, cliquez sur **"Frais de Scolarité"**
3. Vous verrez :
   - Les statistiques (Total, Payés, En attente, En retard)
   - La liste de tous les frais de scolarité
   - Les filtres de recherche

---

## 👤 Attribuer un frais à un élève

### Étape 1 : Ouvrir le formulaire

1. Cliquez sur le bouton **"Ajouter un frais"** en haut à droite
2. Un modal s'ouvrira avec le formulaire

### Étape 2 : Remplir le formulaire

1. **Élève** (obligatoire) : Sélectionnez l'élève dans la liste déroulante
2. **Année scolaire** (obligatoire) : Entrez l'année scolaire (ex: `2024-2025`)
3. **Période** (obligatoire) : Sélectionnez la période :
   - Trimestre 1
   - Trimestre 2
   - Trimestre 3
   - Semestre 1
   - Semestre 2
   - Frais d'inscription
   - Frais de scolarité annuelle
4. **Montant** (obligatoire) : Entrez le montant en FCFA (ex: `100000`)
5. **Date d'échéance** (obligatoire) : Sélectionnez la date d'échéance
6. **Description** (optionnel) : Ajoutez une description si nécessaire

### Étape 3 : Créer le frais

1. Cliquez sur **"Créer"**
2. Le frais sera créé et visible dans la liste
3. L'élève pourra le voir dans sa section "Paiements"

---

## 👥 Attribuer des frais à une classe entière

### Étape 1 : Ouvrir le formulaire en masse

1. Cliquez sur le bouton **"Attribuer à une classe"** en haut à droite
2. Un modal s'ouvrira avec le formulaire

### Étape 2 : Remplir le formulaire

1. **Classe** (obligatoire) : Sélectionnez la classe dans la liste déroulante
2. **Année scolaire** (obligatoire) : Entrez l'année scolaire (ex: `2024-2025`)
3. **Période** (obligatoire) : Sélectionnez la période
4. **Montant** (obligatoire) : Entrez le montant en FCFA
5. **Date d'échéance** (obligatoire) : Sélectionnez la date d'échéance
6. **Description** (optionnel) : Ajoutez une description si nécessaire

### Étape 3 : Créer les frais

1. Cliquez sur **"Attribuer à la classe"**
2. Les frais seront créés pour **tous les élèves actifs** de la classe
3. Un message de confirmation affichera le nombre de frais créés
4. Les frais existants pour la même période et année seront ignorés

---

## ✏️ Modifier un frais

1. Dans la liste des frais, trouvez le frais à modifier
2. Cliquez sur l'icône **✏️ Modifier** (crayon) dans la colonne "Actions"
3. Un modal s'ouvrira avec les informations actuelles
4. Modifiez les champs souhaités :
   - Année scolaire
   - Période
   - Montant
   - Date d'échéance
   - Description
5. Cliquez sur **"Mettre à jour"**

**Note** : Vous ne pouvez pas modifier l'élève associé. Pour changer l'élève, supprimez le frais et créez-en un nouveau.

---

## 🗑️ Supprimer un frais

1. Dans la liste des frais, trouvez le frais à supprimer
2. Cliquez sur l'icône **🗑️ Supprimer** (poubelle) dans la colonne "Actions"
3. Confirmez la suppression dans la boîte de dialogue
4. Le frais et tous les paiements associés seront supprimés

**⚠️ Attention** : Cette action est irréversible !

---

## 🧪 Créer des frais de test

Pour tester rapidement le système de paiement :

1. Cliquez sur le bouton **"Créer des frais de test"** en haut à droite
2. Le système créera automatiquement :
   - 2-4 frais par élève actif
   - Différents statuts (30% payés, 50% en attente, 20% en retard)
   - Différentes périodes et montants
3. Un message de confirmation affichera le résumé

**Note** : Les frais existants ne seront pas dupliqués.

---

## 🔍 Recherche et filtres

### Recherche

Utilisez la barre de recherche pour filtrer par :
- Nom de l'élève
- Période
- Année scolaire

### Filtres

1. **Par classe** : Filtrez les frais par classe
2. **Par statut** :
   - Tous les statuts
   - Payés
   - En attente
   - En retard
3. **Par période** : Filtrez par période spécifique

---

## 📊 Statistiques

En haut de la page, vous verrez 4 cartes de statistiques :

1. **Total** : Nombre total de frais et montant total
2. **Payés** : Nombre de frais payés et montant payé
3. **En attente** : Nombre de frais en attente de paiement
4. **En retard** : Nombre de frais dont l'échéance est dépassée

---

## 💡 Conseils

1. **Attribuer par classe** : Utilisez "Attribuer à une classe" pour gagner du temps
2. **Vérifier les doublons** : Le système empêche la création de frais dupliqués (même élève, période et année)
3. **Année scolaire** : Utilisez le format `2024-2025` pour l'année scolaire
4. **Dates d'échéance** : Planifiez les dates d'échéance en fonction du calendrier scolaire
5. **Montants** : Entrez les montants en FCFA (sans espaces ni virgules)

---

## ⚠️ Notes importantes

1. **Élèves actifs uniquement** : Seuls les élèves avec `isActive: true` peuvent recevoir des frais
2. **Pas de doublons** : Un frais ne peut pas être créé deux fois pour le même élève, période et année
3. **Suppression en cascade** : Supprimer un frais supprime aussi tous les paiements associés
4. **Modification limitée** : Une fois créé, l'élève associé ne peut pas être modifié

---

## 🆘 Dépannage

### Erreur : "Un frais de scolarité existe déjà"
- **Solution** : Un frais existe déjà pour cet élève, cette période et cette année
- **Action** : Modifiez le frais existant ou choisissez une autre période/année

### Erreur : "Aucun élève trouvé"
- **Solution** : La classe sélectionnée n'a pas d'élèves actifs
- **Action** : Vérifiez que la classe a des élèves et qu'ils sont actifs

### Les frais ne s'affichent pas
- **Solution** : Vérifiez les filtres actifs
- **Action** : Réinitialisez les filtres ou actualisez la page (F5)

---

## 📝 Exemple d'utilisation

### Scénario : Attribuer les frais du Trimestre 1 à la classe 6ème A

1. Cliquez sur **"Attribuer à une classe"**
2. Sélectionnez **"6ème A"**
3. Année scolaire : **"2024-2025"**
4. Période : **"Trimestre 1"**
5. Montant : **"150000"** (150 000 FCFA)
6. Date d'échéance : **"2024-12-31"**
7. Description : **"Frais de scolarité - Trimestre 1 - 2024-2025"**
8. Cliquez sur **"Attribuer à la classe"**

Tous les élèves actifs de la 6ème A recevront ce frais et pourront le payer depuis leur compte.

---

**Note** : Les frais de scolarité sont visibles immédiatement par les élèves et les parents dans leurs sections respectives.



