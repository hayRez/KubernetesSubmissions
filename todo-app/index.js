const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// Image cache (PV-mounted)
const IMAGE_DIR = '/app/data';
const IMAGE_PATH = path.join(IMAGE_DIR, 'image.jpg');
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Hardcoded todos (for now)
const TODOS = [
  'Learn Kubernetes basics',
  'Build a Docker image',
  'Deploy app to k3d',
];

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

// HTTP server
const server = http.createServer(async (req, res) => {
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
  } else {
    // Main page
    res.writeHead(200, { 'Content-Type': 'text/html' });

    res.end(`
<!DOCTYPE html>
<html>
<head>
  <title>Todo App</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #f9fafb;
      display: flex;
      justify-content: center;
      margin-top: 40px;
    }
    .container {
      width: 420px;
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    img {
      width: 100%;
      border-radius: 8px;
      margin-bottom: 12px;
    }
    h2 {
      text-align: center;
    }
    .caption {
      text-align: center;
      font-weight: bold;
      margin-bottom: 20px;
    }
    input {
      width: 100%;
      padding: 10px;
      margin-bottom: 8px;
      box-sizing: border-box;
    }
    button {
      width: 100%;
      padding: 10px;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
    button:hover {
      background: #1d4ed8;
    }
    ul {
      margin-top: 16px;
      padding-left: 20px;
    }
    li {
      margin-bottom: 6px;
    }
    .hint {
      font-size: 12px;
      color: #555;
      margin-bottom: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <img src="/image" />
    <div class="caption">DevOps with Kubernetes 2025</div>

    <h2>Todo List</h2>

    <input
      type="text"
      maxlength="140"
      placeholder="Enter a todo (max 140 characters)"
    />
    <div class="hint">Max 140 characters</div>
    <button>Add Todo</button>

    <ul>
      ${TODOS.map(todo => `<li>${todo}</li>`).join('')}
    </ul>
  </div>
</body>
</html>
    `);
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
