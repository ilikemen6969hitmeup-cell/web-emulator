import express from 'express';
import { createServer } from 'node:http';
import { createBareServer } from '@tomphttp/bare-server-node';
import ultraviolet from '@titaniumnetwork-dev/ultraviolet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Extract static path safely from CommonJS module
const ultravioletPath = ultraviolet.ultravioletPath || ultraviolet.uvPath;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer();
const bareServer = createBareServer('/bare/');

// Serve static frontend files (index.html, uv.config.js, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Serve official Ultraviolet static assets (uv.bundle.js, uv.sw.js) under /uv/
app.use('/uv/', express.static(ultravioletPath));

// Route HTTP proxy requests through the Bare server
app.use((req, res, next) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeRequest(req, res);
  } else {
    next();
  }
});

// Route WebSocket upgrade requests through the Bare server
server.on('upgrade', (req, socket, head) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeUpgrade(req, socket, head);
  } else {
    socket.end();
  }
});

// Attach Express app to HTTP server
server.on('request', (req, res) => {
  app(req, res);
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Anko proxy running on port ${PORT}`);
});
