const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const TODO_BACKEND_URL = 'http://todo-backend:3001'; // Internal K8s service

const IMAGE_DIR = '/app/data';
const IMAGE_PATH = path.join(IMAGE_DIR, 'image.jpg');
const CACHE_DURATION = 10 * 60 * 1000;

if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location)
        return resolve(downloadImage(res.headers.location));
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        if (!buffer.length) return reject(new Error('Empty image'));
        fs.writeFileSync(IMAGE_PATH, buffer);
        resolve();
      });
    }).on('error', reject);
  });
}

async function getImage() {
  if (fs.existsSync(IMAGE_PATH)) {
    const stat = fs.statSync(IMAGE_PATH);
    if (stat.size > 0 && Date.now() - stat.mtimeMs < CACHE_DURATION) return IMAGE_PATH;
  }
  await downloadImage('https://picsum.photos/600');
  return IMAGE_PATH;
}

function fetchTodos() {
  return new Promise((resolve) => {
    http.get(`${TODO_BACKEND_URL}/todos`, res => {
      if (res.statusCode !== 200) return resolve([]);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', () => resolve([]));
  });
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/image') {
    try {
      const imgPath = await getImage();
      const stat = fs.statSync(imgPath);
      res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Content-Length': stat.size });
      fs.createReadStream(imgPath).pipe(res);
    } catch { res.writeHead(500); res.end('Image error'); }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/todos') {
    const backendReq = http.request(`${TODO_BACKEND_URL}/todos`, { method: 'POST', headers: req.headers }, backendRes => {
      res.writeHead(backendRes.statusCode, backendRes.headers);
      backendRes.pipe(res);
    });
    req.pipe(backendReq);
    return;
  }

  if (req.method === 'PUT' && req.url.startsWith('/api/todos/')) {
    const backendReq = http.request(`${TODO_BACKEND_URL}${req.url.replace('/api','')}`, { method: 'PUT', headers: req.headers }, backendRes => {
      res.writeHead(backendRes.statusCode, backendRes.headers);
      backendRes.pipe(res);
    });
    req.pipe(backendReq);
    return;
  }

  if (req.url === '/') {
    const todos = await fetchTodos();
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
<!DOCTYPE html>
<html>
<head>
  <title>Todo App</title>
  <style>/* same as before */</style>
</head>
<body>
  <div class="container">
    <img src="/image" />
    <div class="caption">DevOps with Kubernetes 2025</div>
    <h2>Todo List</h2>
    <input id="todo-input" type="text" maxlength="140" placeholder="Enter a todo"/>
    <button onclick="addTodo()">Add Todo</button>
    <ul id="todo-list">
      ${todos.map(todo => `
        <li>
          <input type="checkbox" ${todo.done ? 'checked' : ''} onchange="toggleTodo(${todo.id}, this.checked)"/>
          ${todo.text}
        </li>`).join('')}
    </ul>
  </div>
  <script>
    async function addTodo() {
      const input = document.getElementById('todo-input');
      const text = input.value.trim();
      if(!text) return alert('Enter a todo');
      const res = await fetch('/api/todos', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({text}) });
      if(res.status===201) window.location.reload();
    }
    async function toggleTodo(id, done) {
      await fetch('/api/todos/' + id, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({done}) });
    }
  </script>
</body>
</html>
    `);
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, () => console.log(`Frontend running on port ${PORT}`));
