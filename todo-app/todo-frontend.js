// todo-frontend.js (Replaces your original index.js)

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
// Internal Kubernetes Service Name for the backend
const TODO_BACKEND_URL = 'http://todo-backend-service:3001'; 

// Image cache (PV-mounted)
const IMAGE_DIR = '/app/data';
const IMAGE_PATH = path.join(IMAGE_DIR, 'image.jpg');
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Ensure image directory exists
if (!fs.existsSync(IMAGE_DIR)) {
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
}

// Download image safely (handles redirects)
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(downloadImage(res.headers.location));
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }

      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        if (buffer.length === 0) {
          return reject(new Error('Empty image'));
        }
        fs.writeFileSync(IMAGE_PATH, buffer);
        console.log(`Downloaded image: ${buffer.length} bytes`);
        resolve();
      });
    }).on('error', reject);
  });
}

async function getImage() {
  if (fs.existsSync(IMAGE_PATH)) {
    const stat = fs.statSync(IMAGE_PATH);
    if (stat.size > 0 && Date.now() - stat.mtimeMs < CACHE_DURATION) {
      return IMAGE_PATH;
    }
  }
  await downloadImage('https://picsum.photos/600');
  return IMAGE_PATH;
}

// Function to fetch todos from the backend service (used by the server)
function fetchTodos() {
  return new Promise((resolve, reject) => {
    http.get(`${TODO_BACKEND_URL}/todos`, (res) => {
      if (res.statusCode !== 200) {
        console.error(`Backend error: ${res.statusCode}`);
        return resolve(['Error fetching todos']);
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const todos = JSON.parse(data);
          resolve(todos);
        } catch (e) {
          console.error('Failed to parse todos:', e);
          resolve(['Error parsing todos']);
        }
      });
    }).on('error', (err) => {
      console.error('Connection error to todo-backend:', err.message);
      resolve(['Error: Todo backend connection failed. Check todo-backend-service.']); 
    });
  });
}

// HTTP server
const server = http.createServer(async (req, res) => {
  
  // 1. Image Route
  if (req.url === '/image') {
    try {
      const imgPath = await getImage();
      const stat = fs.statSync(imgPath);

      res.writeHead(200, {
        'Content-Type': 'image/jpeg',
        'Content-Length': stat.size,
      });

      fs.createReadStream(imgPath).pipe(res);
    } catch (err) {
      res.writeHead(500);
      res.end('Image error');
    }
    return;
  }
  
  // 2. NEW: Todo POST Proxy Route
  // This intercepts the browser's POST and forwards it internally to the todo-backend-service
  if (req.method === 'POST' && req.url === '/api/todos') {
    const backendReq = http.request(
      `${TODO_BACKEND_URL}/todos`,
      {
        method: 'POST',
        headers: req.headers, // Forward headers like Content-Type
      },
      (backendRes) => {
        // Pipe the backend's response back to the browser
        res.writeHead(backendRes.statusCode, backendRes.headers);
        backendRes.pipe(res);
      }
    );
    
    backendReq.on('error', (err) => {
      console.error('Error forwarding to backend:', err.message);
      res.writeHead(503);
      res.end(JSON.stringify({ error: 'Backend service unavailable.' }));
    });

    // Pipe the browser's request body to the backend
    req.pipe(backendReq);

    return;
  }
  
  // 3. Main Page Route (GET /)
  if (req.url === '/') {
    const todos = await fetchTodos(); // Fetch todos from the backend
    
    res.writeHead(200, { 'Content-Type': 'text/html' });

    res.end(`
<!DOCTYPE html>
<html>
<head>
  <title>Todo App</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f9fafb; display: flex; justify-content: center; margin-top: 40px; }
    .container { width: 420px; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    img { width: 100%; border-radius: 8px; margin-bottom: 12px; }
    h2 { text-align: center; }
    .caption { text-align: center; font-weight: bold; margin-bottom: 20px; }
    input { width: 100%; padding: 10px; margin-bottom: 8px; box-sizing: border-box; }
    button { width: 100%; padding: 10px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; }
    button:hover { background: #1d4ed8; }
    ul { margin-top: 16px; padding-left: 20px; }
    li { margin-bottom: 6px; }
    .hint { font-size: 12px; color: #555; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <img src="/image" />
    <div class="caption">DevOps with Kubernetes 2025</div>

    <h2>Todo List</h2>

    <input
      id="todo-input" 
      type="text"
      maxlength="140"
      placeholder="Enter a todo (max 140 characters)"
    />
    <div class="hint">Max 140 characters</div>
    <button onclick="addTodo()">Add Todo</button> 

    <ul id="todo-list">
      ${todos.map(todo => `<li>${todo}</li>`).join('')} 
    </ul>
  </div>
  
  <script>
    async function addTodo() {
      const inputElement = document.getElementById('todo-input');
      const todoText = inputElement.value.trim();
      
      if (todoText.length === 0) {
        alert('Please enter a todo item.');
        return;
      }
      
      const todoPayload = { text: todoText };
      
      try {
        // Browser now posts to the frontend's new proxy route (/api/todos)
        const response = await fetch('/api/todos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(todoPayload),
        });
        
        if (response.status === 201) {
          inputElement.value = '';
          window.location.reload(); 
        } else {
          const errorData = await response.json();
          alert('Failed to add todo: ' + (errorData.error || response.statusText));
        }
      } catch (error) {
        console.error('Network error during todo creation:', error);
        alert('Could not connect to the Todo service proxy.');
      }
    }
  </script>
</body>
</html>
    `);
    return;
  }
  
  // 4. 404 handler
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');

});

server.listen(PORT, () => {
  console.log(`Frontend Server running on port ${PORT}`);
});