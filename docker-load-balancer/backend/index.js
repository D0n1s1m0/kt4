const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const SERVER_ID = process.env.SERVER_ID || 'unknown';

app.get('/', (req, res) => {
  res.json({
    server: SERVER_ID,
    timestamp: new Date().toISOString(),
    message: `Response from ${SERVER_ID}`
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: SERVER_ID });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server ${SERVER_ID} running on port ${PORT}`);
});
