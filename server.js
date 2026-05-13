const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Create table on startup
db.query(`
  CREATE TABLE IF NOT EXISTS roomsplit (
    key TEXT PRIMARY KEY,
    data JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )
`).then(() => console.log('DB table ready'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api/roomsplit', async (req, res) => {
  try {
    const r = await db.query(
      'SELECT data FROM roomsplit WHERE key=$1',
      [req.query.key]
    );
    res.json({ data: r.rows[0]?.data || null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/roomsplit', async (req, res) => {
  try {
    await db.query(
      `INSERT INTO roomsplit(key, data)
       VALUES($1, $2)
       ON CONFLICT(key)
       DO UPDATE SET data=$2, updated_at=NOW()`,
      [req.body.key, req.body.data]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`RoomSplit API running on port ${PORT}`));