const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const uploadRoot = '/var/www/diashow';
const settingsPath = path.join(uploadRoot, 'settings.json');

app.use(cors());
app.use(express.static(uploadRoot));

function getSettings() {
  if (!fs.existsSync(settingsPath)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(settingsPath));
}
function saveSettings(settings) {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const bereich = req.params.bereich;
    const dir = path.join(uploadRoot, bereich, 'bilder');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

app.post('/upload/:bereich', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Keine Datei hochgeladen' });
  res.json({ success: true, filename: req.file.originalname });
});

app.get('/images/:bereich', (req, res) => {
  const dir = path.join(uploadRoot, req.params.bereich, 'bilder');
  fs.readdir(dir, (err, files) => {
    if (err) return res.json([]);
    const images = files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
    res.json(images);
  });
});

app.delete('/delete/:bereich/:filename', (req, res) => {
  const filePath = path.join(uploadRoot, req.params.bereich, 'bilder', req.params.filename);
  fs.unlink(filePath, err => {
    if (err) return res.status(500).json({ error: 'Löschen fehlgeschlagen' });
    res.json({ success: true });
  });
});

app.get('/api/settings/:bereich', (req, res) => {
  const settings = getSettings();
  const bereich = req.params.bereich;
  res.json(settings[bereich] || { delay: 5 });
});

app.post('/api/settings/:bereich', express.json(), (req, res) => {
  const settings = getSettings();
  const bereich = req.params.bereich;
  const delay = req.body.delay;
  if (typeof delay === 'number') {
    settings[bereich] = { delay };
    saveSettings(settings);
    return res.json({ success: true });
  }
  res.status(400).json({ error: 'Ungültige Einstellung' });
});

app.use('/bilder', (req, res) => {
  const parts = req.path.split('/').filter(Boolean);
  if (parts.length < 2) return res.status(400).send('Ungültiger Pfad');
  const bereich = parts[0];
  const dateiname = parts.slice(1).join('/');
  const filePath = path.join(uploadRoot, bereich, 'bilder', dateiname);
  res.sendFile(filePath, err => {
    if (err) {
      console.error(`❌ Datei nicht gefunden: ${filePath}`);
      res.status(404).send('Bild nicht gefunden');
    }
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
