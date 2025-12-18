const express = require('express');
const { Pool } = require('pg');
const app = express();

const PORT = process.env.PORT || 3000;
const POSTGRES_HOST = process.env.POSTGRES_HOST || 'localhost';
const POSTGRES_DB = process.env.POSTGRES_DB || 'pingpongdb';
const POSTGRES_USER = process.env.POSTGRES_USER || 'pingponguser';
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || 'pingpongpassword';

const pool = new Pool({
  host: POSTGRES_HOST,
  database: POSTGRES_DB,
  user: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  port: 5432,
});

(async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS counter (
        id SERIAL PRIMARY KEY,
        pong_count INT NOT NULL,
        ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const res = await client.query('SELECT pong_count FROM counter ORDER BY id DESC LIMIT 1');
    global.requestCount = res.rows.length > 0 ? res.rows[0].pong_count : 0;
  } finally {
    client.release();
  }
})();

global.requestCount = global.requestCount || 0;

app.get('/pingpong', async (req, res) => {
  global.requestCount++;
  const client = await pool.connect();
  try {
    await client.query('INSERT INTO counter (pong_count) VALUES ($1)', [global.requestCount]);
  } catch (err) {
    console.error('Error saving counter to DB:', err);
  } finally {
    client.release();
  }
  res.send(`pong ${global.requestCount}`);
});

app.listen(PORT, () => {
  console.log(`Ping-pong application listening at http://0.0.0.0:${PORT}`);
});