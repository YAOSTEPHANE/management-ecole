# Connexion MongoDB Atlas (Windows)

## Comprendre votre `nslookup`

Avec **1.1.1.1**, c’est normal de voir :

```
Nom : cluster0.hdvrssw.mongodb.net
```

**sans adresse IP** en dessous : ce nom n’a pas d’enregistrement A direct. Atlas utilise des enregistrements **SRV** :

```powershell
nslookup -type=SRV _mongodb._tcp.cluster0.hdvrssw.mongodb.net 1.1.1.1
```

Vous devez obtenir 3 hôtes `ac-7argox9-shard-00-0x.hdvrssw.mongodb.net`.

Le port **27017** vers ces serveurs est joignable (test TCP OK). Le blocage restant concerne surtout la **résolution DNS utilisée par Prisma** (moteur Rust), pas votre code.

---

## Solution 1 — Chaîne « Standard » (recommandée)

1. [MongoDB Atlas](https://cloud.mongodb.com) → votre cluster → **Connect** → **Drivers**
2. Choisir **Standard connection string** (pas `mongodb+srv://`)
3. Remplacer `DATABASE_URL` dans `server/.env` par cette URI (avec utilisateur / mot de passe)
4. **Network Access** : ajouter votre IP publique
5. :

```powershell
cd server
npm run prisma:push
```

Format typique :

```
mongodb://USER:PASSWORD@ac-7argox9-shard-00-00.hdvrssw.mongodb.net:27017,ac-7argox9-shard-00-01.hdvrssw.mongodb.net:27017,ac-7argox9-shard-00-02.hdvrssw.mongodb.net:27017/gestion_ecole?ssl=true&authSource=admin&replicaSet=XXXX-shard-0
```

(`replicaSet` est indiqué dans la chaîne copiée depuis Atlas — ex. `atlas-xtpuft-shard-0`, pas le préfixe des hôtes `ac-…`.)

Pour retrouver le nom exact sans Atlas :

```powershell
npx mongosh "mongodb://USER:PASS@ac-7argox9-shard-00-00.hdvrssw.mongodb.net:27017/gestion_ecole?ssl=true&authSource=admin&directConnection=true" --eval "db.hello().setName"
```

---

## Solution 2 — Fichier `hosts` (si Prisma échoue encore)

En **PowerShell administrateur**, après avoir vérifié les IP avec :

```powershell
nslookup ac-7argox9-shard-00-00.hdvrssw.mongodb.net 1.1.1.1
```

Ajouter (IP à jour si Atlas les change) :

```
65.62.18.172  ac-7argox9-shard-00-00.hdvrssw.mongodb.net
65.62.18.156  ac-7argox9-shard-00-01.hdvrssw.mongodb.net
65.62.18.145  ac-7argox9-shard-00-02.hdvrssw.mongodb.net
```

Fichier : `C:\Windows\System32\drivers\etc\hosts`

Puis fermer **tous** les terminaux, rouvrir, et relancer `npm run prisma:push`.

---

## Solution 3 — MongoDB local (dev hors ligne)

Dans `server/.env` :

```
DATABASE_URL="mongodb://localhost:27017/gestion_ecole"
```

Docker :

```powershell
docker run -d --name mongo-dev -p 27017:27017 mongo:7
```

---

## Vérifications rapides

| Test | Commande | Attendu |
|------|----------|---------|
| SRV | `nslookup -type=SRV _mongodb._tcp.cluster0.hdvrssw.mongodb.net 1.1.1.1` | 3 lignes `svr hostname` |
| Port | `Test-NetConnection 65.62.18.172 -Port 27017` | `TcpTestSucceeded : True` |
| DNS Windows | `Get-DnsClientServerAddress -AddressFamily IPv4` | `1.1.1.1` ou `8.8.8.8` sur l’interface active |

Après correction : `npm run prisma:push` puis `npm run db:seed:dev` (depuis la racine du repo).
