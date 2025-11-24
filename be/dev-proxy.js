const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT ?? 9999;

app.use(cors());

app.use(
  '/auth',
  createProxyMiddleware({
    target: 'http://localhost:3000',
    changeOrigin: true,
    pathRewrite: { '^/auth': '/api/auth' }
  })
);

app.use(
  '/tasks',
  createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true,
    pathRewrite: { '^/tasks': '/api/tasks' }
  })
);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Dev proxy listening on http://localhost:${PORT}`);
});
