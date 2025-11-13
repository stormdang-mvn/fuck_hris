import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// API Proxy - forward /api requests to backend
app.use('/api', createProxyMiddleware({
  target: 'https://hris.marusysvina.com:8080',
  changeOrigin: true,
  secure: false,
  pathRewrite: {
    '^/api': '/v1'
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Proxy] ${req.method} ${req.path} -> ${proxyReq.path}`);
  },
  onError: (err, req, res) => {
    console.error('[Proxy Error]', err.message);
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
}));

// Serve static files from dist
app.use(express.static(join(__dirname, '../dist')));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ HRIS Server running on port ${PORT}`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`🔄 API Proxy: /api -> https://hris.marusysvina.com:8080/v1`);
});
