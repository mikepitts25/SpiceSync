// tools/kink-studio/server.js
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json({ limit: '10mb' }));

// Resolve data dir relative to this file:
// <repo-root>/apps/mobile/data
const DATA_DIR = path.resolve(__dirname, '../../apps/mobile/data');
const FILES = {
  en: path.join(DATA_DIR, 'kinks.en.json'),
  es: path.join(DATA_DIR, 'kinks.es.json'),
};

function fileForLang(lang) {
  if (!FILES[lang]) throw new Error('Unsupported lang, use en|es');
  return FILES[lang];
}

function load(lang) {
  const file = fileForLang(lang);
  const raw = fs.readFileSync(file, 'utf8');
  return JSON.parse(raw);
}

function save(lang, data) {
  const file = fileForLang(lang);
  const json = JSON.stringify(data, null, 2) + '\n';
  fs.writeFileSync(file, json, 'utf8');
}

app.get('/api/kinks', (req, res) => {
  try {
    const lang = (req.query.lang || 'en').toLowerCase();
    const data = load(lang);
    res.json({ ok: true, lang, count: data.length, data });
  } catch (e) {
    res.status(400).json({ ok: false, error: String(e.message || e) });
  }
});

app.put('/api/kinks', (req, res) => {
  try {
    const lang = (req.query.lang || 'en').toLowerCase();
    const arr = req.body;
    if (!Array.isArray(arr)) throw new Error('Body must be an array of KinkItem');
    // very light shape check:
    for (const k of arr) {
      if (typeof k.id !== 'string') throw new Error('Each item needs string id');
      if (typeof k.slug !== 'string') throw new Error('Each item needs string slug');
      if (typeof k.title !== 'string') throw new Error('Each item needs string title');
    }
    save(lang, arr);
    res.json({ ok: true, lang, saved: arr.length });
  } catch (e) {
    res.status(400).json({ ok: false, error: String(e.message || e) });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 5178;
app.listen(PORT, () => {
  console.log(`Kink Studio running on http://localhost:${PORT}`);
  console.log(`Data dir: ${DATA_DIR}`);
});
