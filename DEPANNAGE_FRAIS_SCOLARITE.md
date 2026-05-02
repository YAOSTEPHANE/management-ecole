# Dépannage - Erreur 500 lors de la création de frais de scolarité

## 🔍 Diagnostic de l'erreur

Si vous recevez une erreur `500 (Internal Server Error)` lors de la création d'un frais de scolarité, suivez ces étapes :

### Étape 1 : Vérifier les logs du serveur

1. Ouvrez le terminal où le serveur Node.js est en cours d'exécution
2. Regardez les messages d'erreur affichés
3. Les logs devraient maintenant afficher :
   - Les données reçues
   - L'erreur exacte
   - La stack trace (en mode développement)

### Étape 2 : Vérifier les données envoyées

Dans la console du navigateur (F12), vérifiez :
1. L'onglet **Network**
2. La requête `POST /api/admin/tuition-fees`
3. L'onglet **Payload** ou **Request** pour voir les données envoyées

### Étape 3 : Vérifications courantes

#### ✅ Vérifier que tous les champs sont remplis
- **Élève** : Doit être sélectionné
- **Année scolaire** : Format `2024-2025`
- **Période** : Doit être sélectionnée
- **Montant** : Doit être un nombre positif (ex: `100000`)
- **Date d'échéance** : Doit être une date valide

#### ✅ Vérifier l'authentification
- Vous devez être connecté en tant qu'**Administrateur**
- Le token JWT doit être valide
- Vérifiez dans la console : `localStorage.getItem('token')`

#### ✅ Vérifier la base de données
- Le serveur doit être connecté à MongoDB
- Vérifiez que la collection `tuition_fees` existe
- Vérifiez que l'élève existe dans la base de données

## 🛠️ Solutions courantes

### Solution 1 : Redémarrer le serveur

```powershell
# Arrêter le serveur (Ctrl+C)
# Puis redémarrer
cd server
npm run dev
```

### Solution 2 : Vérifier la connexion MongoDB

1. Vérifiez que MongoDB est en cours d'exécution
2. Vérifiez la variable d'environnement `DATABASE_URL` dans `.env`
3. Testez la connexion avec Prisma Studio :
```powershell
cd server
npm run prisma:studio
```

### Solution 3 : Vérifier le format des données

Assurez-vous que :
- Le `studentId` est un ObjectId MongoDB valide
- Le `amount` est un nombre (pas une chaîne)
- La `dueDate` est au format ISO (YYYY-MM-DD)

### Solution 4 : Vérifier les migrations Prisma

```powershell
cd server
npm run prisma:generate
npm run prisma:push
```

### Solution 5 : Vérifier les logs détaillés

Les logs améliorés devraient maintenant afficher :
- Les données reçues
- L'erreur exacte avec code Prisma
- La stack trace complète

## 📋 Messages d'erreur courants

### "Élève non trouvé"
- **Cause** : L'ID de l'élève n'existe pas dans la base de données
- **Solution** : Vérifiez que l'élève existe et est actif

### "Un frais de scolarité existe déjà"
- **Cause** : Un frais existe déjà pour cet élève, cette période et cette année
- **Solution** : Modifiez le frais existant ou choisissez une autre période/année

### "Le montant doit être un nombre positif"
- **Cause** : Le montant n'est pas un nombre valide
- **Solution** : Entrez un nombre positif (ex: `100000` au lieu de `"100000"`)

### "La date d'échéance est invalide"
- **Cause** : La date n'est pas au bon format
- **Solution** : Utilisez le format ISO (YYYY-MM-DD)

### Erreur Prisma (P2002, P2003, etc.)
- **Cause** : Erreur de validation Prisma
- **Solution** : Consultez les logs pour voir le code d'erreur exact

## 🔧 Test manuel via la console

Pour tester manuellement la création d'un frais :

```javascript
// Dans la console du navigateur (F12)
fetch('http://localhost:5000/api/admin/tuition-fees', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  },
  body: JSON.stringify({
    studentId: 'VOTRE_STUDENT_ID',
    academicYear: '2024-2025',
    period: 'Trimestre 1',
    amount: 100000,
    dueDate: '2024-12-31',
    description: 'Test'
  })
})
.then(response => response.json())
.then(data => console.log('Succès:', data))
.catch(error => console.error('Erreur:', error));
```

## 📞 Support

Si le problème persiste :
1. Copiez les logs du serveur
2. Copiez les détails de l'erreur dans la console du navigateur
3. Vérifiez que toutes les dépendances sont installées
4. Vérifiez que MongoDB est accessible

## ✅ Checklist de vérification

- [ ] Le serveur Node.js est démarré
- [ ] MongoDB est en cours d'exécution
- [ ] La variable `DATABASE_URL` est correcte
- [ ] Vous êtes connecté en tant qu'administrateur
- [ ] Le token JWT est valide
- [ ] Tous les champs du formulaire sont remplis
- [ ] Le format des données est correct
- [ ] Les migrations Prisma sont à jour



