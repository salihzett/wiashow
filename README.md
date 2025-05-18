# 📷 Diashow-Server mit Mehrbereich-Unterstützung

Dieses Projekt ist ein vollständiger **Diashow-Server** auf Basis von Node.js und nginx, der bis zu 5 unabhängige Bereiche verwalten kann:  
**`spa1`**, **`spa2`**, **`spa3`**, **`spa4`**, **`spa5`**

Jeder Bereich bietet:
- eine eigene Slideshow-Ansicht (`spa1.html`, …)
- eigene Upload- und Einstellungsseite (`spa1_einstellungen.html`, …)
- individuelle Bildverzeichnisse (`/spa1/bilder/`, …)
- individuellen Anzeigedelay

## 📁 Struktur

```
/var/www/diashow/
├── spa1/
│   └── bilder/
├── spa2/
│   └── bilder/
├── ...
├── spa1.html
├── spa1_einstellungen.html
├── ...
├── settings.json
```

## ⚙️ Installation

### Voraussetzungen

```bash
sudo apt update
sudo apt install -y nginx nodejs npm pm2 zip
```

### Setup (manuell oder per Skript)

1. Kopiere alle Dateien (`server.js`, `.html`, `settings.json`) in:
   - `/var/www/diashow/` für HTML & Einstellungen
   - `/opt/diashow-server/` für den Node.js-Code

2. Installiere Abhängigkeiten im Serververzeichnis:

```bash
cd /opt/diashow-server
npm install express multer cors
```

3. Starte den Server:

```bash
pm2 start server.js --name diashow
pm2 save
pm2 startup
```

## 🌐 nginx-Konfiguration

Datei: `/etc/nginx/sites-available/diashow`

```nginx
server {
    listen 80;
    server_name _;

    root /var/www/diashow;
    index index.html;

    location ~ ^/(spa[1-5](|_einstellungen)\.html)$ {
        try_files $uri =404;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Aktivieren:

```bash
ln -s /etc/nginx/sites-available/diashow /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

## 🔍 Nutzung im Browser

| Bereich | Slideshow                    | Einstellungen                      |
|--------:|------------------------------|------------------------------------|
| `spa1`  | http://<server>/spa1.html    | http://<server>/spa1_einstellungen.html |
| `spa2`  | http://<server>/spa2.html    | http://<server>/spa2_einstellungen.html |
| …       | …                            | …                                  |

## 🧼 Weitere Hinweise

- Bildformate: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- Bilder lassen sich direkt per Drag & Drop hochladen
- Delay kann pro Bereich individuell gesetzt werden
- Die `settings.json` wird automatisch aktualisiert
