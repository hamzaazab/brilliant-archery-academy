const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { requireAdmin } = require('./middleware/auth');
const {
  initializeDatabase,
  getRankings,
  getTournaments,
  getContent,
  replaceRankings,
  replaceTournaments,
  getAdminByUsername,
  listAdmins,
  createAdminUser
} = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN?.split(',') || ['http://localhost:4200'],
    methods: ['GET', 'POST', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
app.use(express.json({ limit: '1mb' }));

function validateRankings(rankings) {
  return Array.isArray(rankings) && rankings.every((entry) => typeof entry.rank === 'number');
}

function validateTournaments(tournaments) {
  return Array.isArray(tournaments) && tournaments.every((entry) => !!entry.title && !!entry.date);
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const adminAccount = await getAdminByUsername(username);

  let passwordMatch = false;
  let resolvedUsername = username;

  if (adminAccount) {
    resolvedUsername = adminAccount.username;
    passwordMatch = adminAccount.passwordHash.startsWith('$2')
      ? await bcrypt.compare(password, adminAccount.passwordHash)
      : password === adminAccount.passwordHash;
  } else if (username === ADMIN_USERNAME) {
    passwordMatch = ADMIN_PASSWORD.startsWith('$2')
      ? await bcrypt.compare(password, ADMIN_PASSWORD)
      : password === ADMIN_PASSWORD;
  }

  if (!passwordMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ username: resolvedUsername, role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
  return res.json({ token, username: resolvedUsername });
});

app.get('/api/admin/admins', requireAdmin, async (_req, res) => {
  const admins = await listAdmins();
  return res.json({ admins });
});

app.post('/api/admin/admins', requireAdmin, async (req, res) => {
  const { username, password } = req.body || {};
  const normalizedUsername = String(username || '').trim();
  const normalizedPassword = String(password || '').trim();

  if (!normalizedUsername || !normalizedPassword) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  if (normalizedPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  try {
    const admin = await createAdminUser(normalizedUsername, normalizedPassword);
    return res.status(201).json({ message: 'Admin created', admin });
  } catch (error) {
    if (error.code === 'DUPLICATE_ADMIN') {
      return res.status(409).json({ message: 'Admin username already exists' });
    }

    throw error;
  }
});

app.get('/api/rankings', async (_req, res) => {
  const rankings = await getRankings();
  return res.json(rankings);
});

app.get('/api/tournaments', async (_req, res) => {
  const tournaments = await getTournaments();
  return res.json(tournaments);
});

app.get('/api/content', async (_req, res) => {
  const data = await getContent();
  return res.json(data);
});

app.put('/api/admin/rankings', requireAdmin, async (req, res) => {
  const { rankings } = req.body || {};
  if (!validateRankings(rankings)) {
    return res.status(400).json({ message: 'Invalid rankings payload' });
  }

  const normalized = [...rankings].sort((a, b) => a.rank - b.rank);
  const updated = await replaceRankings(normalized);
  return res.json({ message: 'Rankings updated', rankings: updated });
});

app.put('/api/admin/tournaments', requireAdmin, async (req, res) => {
  const { tournaments } = req.body || {};
  if (!validateTournaments(tournaments)) {
    return res.status(400).json({ message: 'Invalid tournaments payload' });
  }

  const normalized = tournaments.map((entry, index) => ({
    ...entry,
    id: Number(entry.id) || index + 1,
    images: Array.isArray(entry.images) ? entry.images : []
  }));

  const updated = await replaceTournaments(normalized);
  return res.json({ message: 'Tournaments updated', tournaments: updated });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'Internal server error' });
});

async function startServer() {
  try {
    await initializeDatabase({
      defaultAdminUsername: ADMIN_USERNAME,
      defaultAdminPassword: ADMIN_PASSWORD
    });
    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize PostgreSQL connection', error);
    process.exit(1);
  }
}

startServer();
