const express = require('express');
const app = express();
const port = 3000;

// In-memory counter
let requestCount = 0;

// **********************************************
// Change the endpoint from '/' to '/pingpong'
// **********************************************
app.get('/pingpong', (req, res) => {
  // Increment the counter
  requestCount++;

  // Respond with "pong <count>"
  res.send(`pong ${requestCount}`);
});

app.listen(port, () => {
  console.log(`Ping-pong application listening at http://localhost:${port}`);
});