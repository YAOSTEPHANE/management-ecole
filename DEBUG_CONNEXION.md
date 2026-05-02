# Guide de Débogage - Problème de Connexion

Ce guide vous aide à diagnostiquer et résoudre les problèmes de connexion.

## 🔍 Étapes de Diagnostic

### 1. Vérifier que le serveur backend est démarré

Ouvrez un terminal et vérifiez que le serveur tourne :

```powershell
# Dans le dossier server
cd server
npm run dev
```

Vous devriez voir :
```
🚀 Server running on port 5000
```

### 2. Vérifier que MongoDB est connecté

Assurez-vous que MongoDB est démarré et accessible. Vérifiez le fichier `server/.env` :

```env
DATABASE_URL="mongodb://localhost:27017/school_manager"
```

### 3. Tester l'API directement

Ouvrez PowerShell et testez l'API :

```powershell
# Test du health check
Invoke-RestMethod -Uri "http://localhost:5000/api/health"

# Test de connexion
$body = @{
    email = "admin@school.com"
    password = "admin123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### 4. Vérifier la console du navigateur

1. Ouvrez votre navigateur (F12)
2. Allez dans l'onglet **Console**
3. Tapez : `testConnection()`
4. Regardez les messages affichés

### 5. Vérifier l'onglet Network

1. Ouvrez l'onglet **Network** (Réseau) dans les outils de développement
2. Tentez de vous connecter
3. Cherchez la requête vers `/api/auth/login`
4. Vérifiez :
   - Le statut (200 = OK, 401 = non autorisé, 500 = erreur serveur)
   - La réponse du serveur
   - Les headers

## 🛠️ Solutions aux Problèmes Courants

### Problème : "Le serveur backend n'est pas accessible"

**Solutions :**
1. Vérifiez que le serveur est démarré : `cd server && npm run dev`
2. Vérifiez le port : Le serveur doit tourner sur le port 5000
3. Vérifiez les variables d'environnement dans `server/.env`

### Problème : "Identifiants invalides"

**Solutions :**
1. Vérifiez que vous avez créé un compte :
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" `
     -Method POST `
     -ContentType "application/json" `
     -Body '{
       "email": "admin@school.com",
       "password": "admin123",
       "firstName": "Admin",
       "lastName": "User",
       "role": "ADMIN"
     }'
   ```

2. Vérifiez l'email et le mot de passe (attention aux majuscules/minuscules)
3. Vérifiez que l'utilisateur est actif dans la base de données

### Problème : "Erreur réseau" ou "Network Error"

**Solutions :**
1. Vérifiez que le serveur backend est démarré
2. Vérifiez l'URL de l'API dans `web/.env.local` ou `web/next.config.ts`
3. Vérifiez les paramètres CORS dans `server/src/index.ts`
4. Vérifiez votre pare-feu

### Problème : "Erreur CORS"

**Solutions :**
1. Vérifiez la configuration CORS dans `server/src/index.ts`
2. Assurez-vous que `FRONTEND_URL` est correctement configuré
3. Redémarrez le serveur après modification

### Problème : "Token invalide" ou "Non autorisé"

**Solutions :**
1. Videz le localStorage : Dans la console du navigateur, tapez `localStorage.clear()`
2. Reconnectez-vous
3. Vérifiez que `JWT_SECRET` est défini dans `server/.env`

## 📋 Checklist Complète

- [ ] Serveur backend démarré sur le port 5000
- [ ] MongoDB connecté et accessible
- [ ] Variables d'environnement configurées (`server/.env`)
- [ ] Compte utilisateur créé
- [ ] Frontend accessible sur le port 3000
- [ ] Pas d'erreurs dans la console du navigateur
- [ ] Pas d'erreurs dans les logs du serveur
- [ ] CORS correctement configuré

## 🔧 Commandes Utiles

### Vérifier les processus en cours
```powershell
# Vérifier si le port 5000 est utilisé
netstat -ano | findstr :5000

# Vérifier si le port 3000 est utilisé
netstat -ano | findstr :3000
```

### Nettoyer et redémarrer
```powershell
# Arrêter tous les processus Node
taskkill /F /IM node.exe

# Redémarrer le serveur
cd server
npm run dev

# Dans un autre terminal, redémarrer le frontend
cd web
npm run dev
```

### Vérifier les logs
```powershell
# Les logs du serveur s'affichent dans le terminal où vous avez lancé `npm run dev`
# Cherchez les messages d'erreur en rouge
```

## 💡 Test Rapide

Exécutez cette commande PowerShell pour tester rapidement :

```powershell
# Test complet
Write-Host "1. Test du health check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/api/health"
    Write-Host "✅ Serveur accessible: $($health.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ Serveur non accessible: $_" -ForegroundColor Red
    exit
}

Write-Host "`n2. Test de connexion..." -ForegroundColor Yellow
$body = @{
    email = "admin@school.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $login = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body
    Write-Host "✅ Connexion réussie!" -ForegroundColor Green
    Write-Host "   Token: $($login.token.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host "   Utilisateur: $($login.user.email)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erreur de connexion: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Détails: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}
```

## 📞 Si le problème persiste

1. Vérifiez les logs du serveur backend
2. Vérifiez la console du navigateur (F12)
3. Vérifiez l'onglet Network pour voir les requêtes
4. Vérifiez que tous les packages sont installés : `npm install` dans `server` et `web`






