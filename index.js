const express = require('express');
const path = require('path');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === Database Setup ===
const db = new sqlite3.Database('./apikeys.db', (err) => {
  if (err) console.error(err.message);
  console.log('✅ Connected to SQLite database');
});

// Buat tabel jika belum ada
db.run(`
  CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// === ROUTES ===

// Halaman utama
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Generate API key baru
app.post('/create', (req, res) => {
  const apiKey = crypto.randomBytes(32).toString('hex');

  db.run('INSERT INTO api_keys (key) VALUES (?)', [apiKey], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Gagal menyimpan API key.' });
    }
    res.json({ apiKey });
  });
});

// Cek validitas API key
app.post('/cekapi', (req, res) => {
  const { apiKey } = req.body;

  if (!apiKey) {
    return res.status(400).json({ valid: false, message: 'API Key tidak dikirim.' });
  }

  db.get('SELECT * FROM api_keys WHERE key = ?', [apiKey], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ valid: false, message: 'Terjadi kesalahan server.' });
    }

    if (row) {
      res.json({ valid: true, message: 'API Key valid ✅' });
    } else {
      res.json({ valid: false, message: 'API Key tidak valid ❌' });
    }
  });
});

// Menampilkan semua API key yang valid
app.get('/list', (req, res) => {
  db.all('SELECT id, key, created_at FROM api_keys', [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Gagal mengambil data.' });
    }
    res.json({ count: rows.length, apiKeys: rows });
  });
});

app.listen(port, () => {
  console.log(`🚀 Server berjalan di http://localhost:${port}`);
});
