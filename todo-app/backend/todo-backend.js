const http = require('http');
const { Pool } = require('pg');

const PORT = process.env.PORT || 3001;

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

// Init DB
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      text VARCHAR(140) NOT NULL
    );
  `);
  console.log('Database ready');
}

initDb().catch(console.error);

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (req.method === 'GET' && req.url === '/todos') {
    const result = await pool.query('SELECT text FROM todos ORDER BY id');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(result.rows.map(r => r.text)));
  }

  if (req.method === 'POST' && req.url === '/todos') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      const { text } = JSON.parse(body);
      await pool.query('INSERT INTO todos(text) VALUES($1)', [text]);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
    });
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
