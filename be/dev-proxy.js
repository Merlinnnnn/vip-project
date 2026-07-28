const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = process.env.PORT ?? 9999;

app.use(cors());

// ─── Unified Swagger UI ─────────────────────────────────────────────
// Serve a single Swagger UI page with dropdown to switch between services.
// Each service exposes its own /api-docs.json spec; this page aggregates them.
// Access: http://localhost:9999/api-docs
// ─────────────────────────────────────────────────────────────────────
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(null, {
    explorer: true,
    swaggerOptions: {
      urls: [
        { url: 'http://localhost:3000/api-docs.json', name: '🔐 Auth Service' },
        { url: 'http://localhost:3001/api-docs.json', name: '📋 Task Service' },
      ],
      'urls.primaryName': '📋 Task Service',
    },
    customSiteTitle: 'VIP Project — API Docs',
    customCss: `
      .swagger-ui .topbar { background: #1a1a2e; }
      .swagger-ui .topbar .download-url-wrapper .select-label select {
        border: 1px solid #6c63ff;
        font-weight: bold;
      }
    `,
  })
);

// ─── Proxy routes ───────────────────────────────────────────────────
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

app.use(
  '/skills',
  createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true,
    pathRewrite: { '^/skills': '/api/skills' }
  })
);

app.use(
  '/work-sessions',
  createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true,
    pathRewrite: { '^/work-sessions': '/api/work-sessions' }
  })
);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Dev proxy listening on http://localhost:${PORT}`);
  console.log(`Swagger UI:          http://localhost:${PORT}/api-docs`);
});
