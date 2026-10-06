#!/bin/bash
# Aktualizuje PoliceOS z GitHuba: strona (nginx :8082) + API (policeos-api).
set -e
cd ~/PoliceOS
git pull --ff-only
npm ci --no-audit --no-fund
npm run build
sudo rsync -a --delete dist/ /var/www/policeos/
sudo mariadb policeos < server/schema.sql
(cd server && npm install --omit=dev --no-audit --no-fund)
sudo systemctl restart policeos-api
echo "PoliceOS zaktualizowany: $(git log --oneline -1)"
