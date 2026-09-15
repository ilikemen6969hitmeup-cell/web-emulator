import express from 'express';
import { createBareServer } from '@tomphttp/bare-server-node';
import { uvPath } from '@titaniumnetwork-dev/ultraviolet';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer();
const bareServer = createBareServer('/bare/');

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uv/', express.static(uvPath));

// Fallback route for single-page routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/uv/') || req.path.startsWith('/bare/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle HTTP requests via Bare Server
server.on('request', (req, res) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeRequest(req, res);
  } else {
    app(req, res);
  }
});

// Handle WebSocket upgrades
server.on('upgrade', (req, socket, head) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeUpgrade(req, socket, head);
  } else {
    socket.end();
  }
});

const PORT = process.env.PORT || 3000;
server.listen({ port: PORT }, () => {
  console.log(`Joe Proxy running at http://localhost:${PORT}`);
});
