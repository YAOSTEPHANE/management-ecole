# Guide - Créer des Frais de Scolarité de Test

Ce guide explique comment créer des frais de scolarité de test pour tester le système de paiement.

## 📋 Méthodes disponibles

Il existe **2 méthodes** pour créer des frais de scolarité de test :

1. **Via l'API (Recommandé)** - Depuis l'interface admin
2. **Via le script PowerShell** - En ligne de commande

---

## 🚀 Méthode 1 : Via l'API (Recommandé)

### Étape 1 : Accéder à l'interface Admin

1. Connectez-vous en tant qu'**Administrateur**
2. Ouvrez la console du navigateur (F12)
3. Allez dans l'onglet **Console**

### Étape 2 : Exécuter la requête API

Copiez et collez ce code dans la console :

```javascript
fetch('http://localhost:5000/api/admin/tuition-fees/create-test', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(response => response.json())
.then(data => {
  console.log('✅ Succès:', data);
  alert(`Frais créés avec succès!\nTotal: ${data.summary.totalCreated}\nPayés: ${data.summary.paid}\nEn attente: ${data.summary.pending}\nEn retard: ${data.summary.overdue}`);
})
.catch(error => {
  console.error('❌ Erreur:', error);
  alert('Erreur lors de la création des frais');
});
```

### Étape 3 : Vérifier les résultats

- Vous verrez un message de confirmation avec le nombre de frais créés
- Les frais seront visibles dans la section "Paiements" pour chaque étudiant

---

## 💻 Méthode 2 : Via le script PowerShell

### Étape 1 : Ouvrir PowerShell

1. Ouvrez PowerShell dans le répertoire du projet
2. Assurez-vous d'être à la racine du projet

### Étape 2 : Exécuter le script

```powershell
.\creer-frais-scolarite-test.ps1
```

### Étape 3 : Vérifier les résultats

Le script affichera :
- Le nombre d'étudiants trouvés
- Le nombre de frais créés
- Le statut de chaque frais (Payé, En attente, En retard)

---

## 📊 Caractéristiques des frais de test

### Distribution des statuts
- **30%** des frais sont **payés** (avec paiement associé)
- **50%** des frais sont **en attente**
- **20%** des frais sont **en retard**

### Périodes générées
- Trimestre 1
- Trimestre 2
- Trimestre 3
- Semestre 1
- Semestre 2
- Frais d'inscription
- Frais de scolarité annuelle

### Montants générés
- 50 000 FCFA
- 75 000 FCFA
- 100 000 FCFA
- 125 000 FCFA
- 150 000 FCFA
- 200 000 FCFA
- 250 000 FCFA

### Dates d'échéance
- Entre **-30 jours** (déjà passées) et **+60 jours** (futures)
- Les frais en retard ont des dates d'échéance passées
- Les frais en attente ont des dates d'échéance futures

### Paiements associés
Pour les frais payés, un paiement est créé avec :
- Méthode de paiement aléatoire (Carte, Mobile Money, Virement, Espèces)
- Statut : **COMPLETED**
- Référence de paiement unique
- ID de transaction unique

---

## ⚠️ Notes importantes

1. **Les frais existants ne sont pas dupliqués**
   - Le script vérifie si un frais similaire existe déjà
   - Seuls les nouveaux frais sont créés

2. **Année scolaire automatique**
   - L'année scolaire est calculée automatiquement
   - Format : `2024-2025` (selon la date actuelle)

3. **Nombre de frais par étudiant**
   - Chaque étudiant reçoit **2 à 4 frais** aléatoirement

4. **Étudiants actifs uniquement**
   - Seuls les étudiants avec `isActive: true` reçoivent des frais

---

## 🔍 Vérification

Après avoir créé les frais de test :

1. **Pour les étudiants** :
   - Connectez-vous en tant qu'étudiant
   - Allez dans la section "Paiements"
   - Vous devriez voir les frais créés

2. **Pour les parents** :
   - Connectez-vous en tant que parent
   - Sélectionnez un enfant
   - Allez dans la section "Paiements"
   - Vous devriez voir les frais de l'enfant

3. **Pour les administrateurs** :
   - Vous pouvez voir tous les frais dans la gestion administrative

---

## 🛠️ Dépannage

### Erreur : "Aucun étudiant actif trouvé"
- **Solution** : Créez d'abord des étudiants dans l'application
- Vérifiez que les étudiants ont `isActive: true`

### Erreur : "Token invalide" (API)
- **Solution** : Reconnectez-vous en tant qu'administrateur
- Vérifiez que le token est bien dans `localStorage`

### Erreur : "tsx n'est pas reconnu" (Script)
- **Solution** : Installez tsx avec `npm install --save-dev tsx`
- Ou utilisez la méthode API à la place

### Les frais ne s'affichent pas
- **Solution** : Actualisez la page (F5)
- Vérifiez que vous êtes connecté avec le bon compte
- Vérifiez la console du navigateur pour les erreurs

---

## 📝 Exemple de résultat

```
🚀 Début de la création des frais de scolarité de test...

📚 15 étudiant(s) trouvé(s)

✓ 🟡 En attente - Jean Dupont: Trimestre 1 - 100 000 FCFA
✓ ✅ Payé - Marie Martin: Semestre 1 - 150 000 FCFA
✓ 🔴 En retard - Pierre Durand: Trimestre 2 - 75 000 FCFA
...

📊 Résumé:
   Total créé: 45 frais
   ✅ Payés: 13
   🟡 En attente: 23
   🔴 En retard: 9

✨ Création des frais de scolarité terminée avec succès !
```

---

## 🎯 Prochaines étapes

Après avoir créé les frais de test :

1. **Tester les paiements** :
   - Connectez-vous en tant qu'étudiant
   - Essayez de payer un frais en attente
   - Testez différentes méthodes de paiement

2. **Vérifier les statistiques** :
   - Consultez les statistiques de paiement
   - Vérifiez les graphiques et rapports

3. **Tester les notifications** :
   - Vérifiez que les notifications de paiement fonctionnent
   - Testez les alertes pour les frais en retard

---

**Note** : Ces frais sont uniquement à des fins de test. En production, utilisez l'interface d'administration pour créer les vrais frais de scolarité.



