#!/usr/bin/env bash
# Configuration initiale d'un VPS Ubuntu (Hostinger) pour School Manager.
# Exécuter en root ou avec sudo : bash deploy/setup-vps.sh
set -euo pipefail

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "Relancez avec sudo : sudo bash deploy/setup-vps.sh"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y curl git build-essential nginx certbot python3-certbot-nginx ufw

# Node.js 20 LTS
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

# PM2 global
if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

# MongoDB Database Tools (sauvegardes npm run backup:mongodb)
if ! command -v mongodump >/dev/null 2>&1; then
  CODENAME="$(. /etc/os-release && echo "${VERSION_CODENAME:-jammy}")"
  curl -fsSL "https://www.mongodb.org/static/pgp/server-7.0.asc" \
    | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
  echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu ${CODENAME}/mongodb-org/7.0 multiverse" \
    > /etc/apt/sources.list.d/mongodb-org-7.0.list
  apt-get update
  apt-get install -y mongodb-database-tools || true
fi

# Pare-feu de base
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo ""
echo "Dépendances système installées."
echo "Prochaines étapes :"
echo "  1. Cloner le dépôt dans /var/www/school-manager (ou autre chemin)"
echo "  2. Configurer server/.env et web/.env.production"
echo "  3. npm run install:all && npm run build"
echo "  4. cd server && npm run prisma:push"
echo "  5. Copier deploy/nginx-school-manager.conf vers /etc/nginx/sites-available/"
echo "  6. pm2 start deploy/ecosystem.config.cjs && pm2 save && pm2 startup"
