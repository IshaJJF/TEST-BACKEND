import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { pool } from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

const SELECT_COLS = 'id, title, completed, created_at, updated_at';

function toTask(row) {
  return { ...row, completed: Boolean(row.completed) };
}

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      title       VARCHAR(255) NOT NULL,
      completed   TINYINT(1) NOT NULL DEFAULT 0,
      created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

app.get('/tasks', async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT ${SELECT_COLS} FROM tasks ORDER BY id DESC`
    );
    res.json(rows.map(toTask));
  } catch (e) { next(e); }
});

app.post('/tasks', async (req, res, next) => {
  try {
    const title = (req.body?.title ?? '').trim();
    if (!title) return res.status(400).json({ error: 'title is required' });

    const [result] = await pool.query(
      'INSERT INTO tasks (title) VALUES (?)',
      [title]
    );
    const [rows] = await pool.query(
      `SELECT ${SELECT_COLS} FROM tasks WHERE id = ?`,
      [result.insertId]
    );
    res.status(201).json(toTask(rows[0]));
  } catch (e) { next(e); }
});

app.put('/tasks/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'invalid id' });
    }

    const fields = [];
    const params = [];

    if (Object.prototype.hasOwnProperty.call(req.body, 'title')) {
      const title = String(req.body.title).trim();
      if (!title) return res.status(400).json({ error: 'title cannot be empty' });
      fields.push('title = ?');
      params.push(title);
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'completed')) {
      fields.push('completed = ?');
      params.push(req.body.completed ? 1 : 0);
    }
    if (!fields.length) {
      return res.status(400).json({ error: 'nothing to update' });
    }

    params.push(id);
    await pool.query(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, params);

    const [rows] = await pool.query(
      `SELECT ${SELECT_COLS} FROM tasks WHERE id = ?`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'task not found' });
    res.json(toTask(rows[0]));
  } catch (e) { next(e); }
});

app.delete('/tasks/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'invalid id' });
    }
    const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'task not found' });
    }
    res.json({ deleted: id });
  } catch (e) { next(e); }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

const port = Number(process.env.PORT) || 3000;
ensureSchema()
  .then(() => {
    app.listen(port, () => {
      console.log(`Todo API listening on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database schema:', err);
    process.exit(1);
  });
