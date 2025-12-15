// todo-backend.js (New file)

const http = require('http');

// Hardcoded todos (in-memory storage for now)
const TODOS = [
  'Learn Kubernetes basics',
  'Build a Docker image',
  'Deploy app to k3d',
];

const PORT = process.env.PORT || 3001; 

const server = http.createServer((req, res) => {
  // Set CORS headers (not strictly needed since the proxy is used, but good practice)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // GET /todos endpoint
  if (req.method === 'GET' && req.url === '/todos') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(TODOS));
    return;
  }

  // POST /todos endpoint
  if (req.method === 'POST' && req.url === '/todos') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const newTodo = JSON.parse(body);
        
        if (newTodo && newTodo.text && newTodo.text.length > 0) {
          const todoText = newTodo.text.substring(0, 140); 
          TODOS.push(todoText);
          
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'success', todo: todoText }));
          console.log(`New todo added: ${todoText}`);
          return;
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid todo format' }));
          return;
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`Todo Backend server running on port ${PORT}`);
});