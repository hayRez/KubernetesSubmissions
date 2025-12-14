const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// Image storage (PV-mounted path)
const IMAGE_DIR = '/app/data';
const IMAGE_PATH = path.join(IMAGE_DIR, 'image.jpg');

// Cache duration: 10 minutes
const CACHE_DURATION = 10 * 60 * 1000;

// Ensure image directory exists
if (!fs.existsSync(IMAGE_DIR)) {
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
}

// Download image safely (handles redirects + avoids 0-byte bug)
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(downloadImage(res.headers.location));
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }

      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);

        if (buffer.length === 0) {
          return reject(new Error('Downloaded image is empty'));
        }

        fs.writeFileSync(IMAGE_PATH, buffer);
        console.log(`Downloaded image: ${buffer.length} bytes`);
        resolve();
      });
    }).on('error', reject);
  });
}

// Get cached image or download a new one
async function getImage() {
  if (fs.existsSync(IMAGE_PATH)) {
    const stat = fs.statSync(IMAGE_PATH);
    if (stat.size > 0 && Date.now() - stat.mtimeMs < CACHE_DURATION) {
      return IMAGE_PATH;
    }
  }

  // Smaller image (600px wide)
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
        'Cache-Control': 'no-store',
      });

      fs.createReadStream(imgPath).pipe(res);
    } catch (err) {
      console.error(err);
      res.writeHead(500);
      res.end('Failed to load image');
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
              text-align: center;
              margin-top: 40px;
              background: #f9fafb;
            }
            img {
              max-width: 350px;
              width: 100%;
              height: auto;
              border-radius: 10px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            .caption {
              margin-top: 14px;
              font-size: 20px;
              font-weight: bold;
              color: #1f2937;
            }
          </style>
        </head>
        <body>
          <img src="/image" />
          <div class="caption">DevOps with Kubernetes 2025</div>
        </body>
      </html>
    `);
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
