#!/bin/bash

set -e

echo "📁 Erstelle Basisverzeichnisse..."
INSTALL_DIR="/var/www/diashow"
SERVER_DIR="/opt/diashow-server"

mkdir -p "$INSTALL_DIR"
mkdir -p "$SERVER_DIR"

echo "📦 Installiere benötigte Pakete..."
apt update
apt install -y nginx nodejs npm pm2 zip

echo "🧰 Kopiere HTML-Dateien und Einstellungen..."
# Diese Dateien sollten im gleichen Ordner wie das Skript liegen
cp spa*.html "$INSTALL_DIR/"
cp settings.json "$INSTALL_DIR/"

for i in {1..5}; do
  mkdir -p "$INSTALL_DIR/spa$i/bilder"
done

echo "🔐 Setze Dateiberechtigungen..."
chown -R www-data:www-data "$INSTALL_DIR"
find "$INSTALL_DIR" -type d -exec chmod 755 {} \;
find "$INSTALL_DIR" -type f -exec chmod 644 {} \;

echo "📝 Installiere Node-Abhängigkeiten..."
cp server.js "$SERVER_DIR/"
cd "$SERVER_DIR"
npm init -y
npm install express multer cors

echo "🚀 Starte Node.js-App mit pm2..."
pm2 start server.js --name diashow
pm2 save
pm2 startup systemd -u $USER --hp $HOME

echo "🌐 Konfiguriere nginx..."
cat > /etc/nginx/sites-available/diashow <<EOF
server {
    listen 80;
    server_name _;

    root /var/www/diashow;
    index index.html;

    location ~ ^/(spa[1-5](|_einstellungen)\\.html)$ {
        try_files \$uri =404;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/diashow /etc/nginx/sites-enabled/diashow
nginx -t && systemctl reload nginx

echo "✅ Installation abgeschlossen. Diashow ist erreichbar unter http://<SERVER-IP>/spa1.html usw."
