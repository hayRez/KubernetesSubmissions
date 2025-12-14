const express = require('express');
const app = express();
const port = 3000;

// In-memory counter
let requestCount = 0;

// Endpoint for log-output to call
app.get('/pingpong', (req, res) => {
  requestCount++;
  res.send(`pong ${requestCount}`);
});

app.listen(port, () => {
  console.log(`Ping-pong application listening at http://localhost:${port}`);
});
