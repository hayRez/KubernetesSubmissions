// todo-backend.js

const http = require('http');
const { Pool } = require('pg');

const PORT = process.env.PORT || 3001;

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT || 5432,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

// Initialize DB with "done" field
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      text VARCHAR(140) NOT NULL,
      done BOOLEAN DEFAULT false
    );
  `);
  console.log('Database ready');
}

initDb().catch(err => console.error('DB init error:', err));

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // Readiness endpoint
  if (req.method === 'GET' && req.url === '/ready') {
    try {
      await pool.query('SELECT 1');
      res.writeHead(200);
      return res.end('OK');
    } catch (err) {
      res.writeHead(503);
      return res.end('DB not ready');
    }
  }

  // GET /todos
  if (req.method === 'GET' && req.url === '/todos') {
    try {
      const result = await pool.query('SELECT id, text, done FROM todos ORDER BY id');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(result.rows));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Failed to fetch todos' }));
    }
  }

  // POST /todos
  if (req.method === 'POST' && req.url === '/todos') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { text } = JSON.parse(body);
        await pool.query('INSERT INTO todos(text) VALUES($1)', [text]);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to add todo' }));
      }
    });
    return;
  }

  // PUT /todos/:id
  if (req.method === 'PUT' && req.url.startsWith('/todos/')) {
    const id = req.url.split('/')[2];
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { done } = JSON.parse(body);
        await pool.query('UPDATE todos SET done = $1 WHERE id = $2', [done, id]);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'updated' }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to update todo' }));
      }
    });
    return;
  }

  // 404 fallback
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
