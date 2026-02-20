// Simple dev server: serves static files + proxies /api/* -> api.zeroeval.com
const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const url   = require('url');

const PORT    = 7799;
const API_BASE = 'https://api.zeroeval.com';

const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
};

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url);

  // ── proxy /api/* ──────────────────────────────────────────────────────────
  if (parsed.pathname.startsWith('/api/')) {
    const upstream = API_BASE + parsed.pathname.slice(4) + (parsed.search || '');
    const upUrl    = new URL(upstream);

    const options = {
      hostname: upUrl.hostname,
      path:     upUrl.pathname + (upUrl.search || ''),
      method:   req.method,
      headers:  { 'Accept': 'application/json', 'User-Agent': 'llm-compare-dev/1.0' },
    };

    const proxy = https.request(options, upRes => {
      res.writeHead(upRes.statusCode, {
        'Content-Type':                'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      upRes.pipe(res);
    });

    proxy.on('error', err => {
      res.writeHead(502);
      res.end(JSON.stringify({ error: err.message }));
    });

    req.pipe(proxy);
    return;
  }

  // ── static files ──────────────────────────────────────────────────────────
  let filePath = path.join(__dirname, parsed.pathname === '/' ? 'index.html' : parsed.pathname);
  const ext    = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`llm-compare running at http://localhost:${PORT}`);
  console.log('  Static files served from current directory');
  console.log('  /api/* proxied to api.zeroeval.com');
});
