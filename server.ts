import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

// Express Setup
const app = express();
const PORT = 3000;

app.use(express.json());

// Enable CORS for external client sync (e.g., Vercel deployment)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'koperasi_db.json');

// Default Seed Data loaded from seed_data.json
const SEED_FILE = path.join(DB_DIR, 'seed_data.json');
const DEFAULT_DATA = JSON.parse(fs.readFileSync(SEED_FILE, 'utf-8'));

// Helper to load database
function readDatabase() {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DATA, null, 2), 'utf-8');
      return DEFAULT_DATA;
    }
    
    const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Error reading database:', error);
    return DEFAULT_DATA;
  }
}

// Helper to write database
function writeDatabase(data: typeof DEFAULT_DATA) {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing database:', error);
    return false;
  }
}

// --- API ENDPOINTS ---

// Get all data
app.get('/api/koperasi', (req, res) => {
  const db = readDatabase();
  res.json(db);
});

// Sync / Update entire state at once
app.post('/api/koperasi/sync', (req, res) => {
  const incomingData = req.body;
  if (!incomingData || typeof incomingData !== 'object') {
    return res.status(400).json({ error: 'Format data tidak valid' });
  }

  // Basic validation structure
  if (!Array.isArray(incomingData.anggota) || 
      !Array.isArray(incomingData.simpanan) || 
      !Array.isArray(incomingData.labaUsaha) || 
      !incomingData.pengaturanSHU) {
    return res.status(400).json({ error: 'Struktur data koperasi tidak lengkap' });
  }

  const success = writeDatabase(incomingData);
  if (success) {
    res.json({ message: 'Data berhasil disinkronkan', data: incomingData });
  } else {
    res.status(500).json({ error: 'Gagal menulis data ke server' });
  }
});

// Reset database to seed default
app.post('/api/koperasi/reset', (req, res) => {
  const success = writeDatabase(DEFAULT_DATA);
  if (success) {
    res.json({ message: 'Database berhasil di-reset ke data bawaan', data: DEFAULT_DATA });
  } else {
    res.status(500).json({ error: 'Gagal me-reset database' });
  }
});

// Integrate Vite
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Koperasi Server] Running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer();
