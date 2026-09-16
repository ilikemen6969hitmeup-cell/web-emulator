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

// Serve static Ultraviolet files from npm package
app.use('/uv/', express.static(uvPath));

// Direct config route so __uv$config is NEVER undefined
app.get('/uv/uv.config.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
    self.__uv$config = {
      prefix: '/uv/service/',
      bare: '/bare/',
      encodeUrl: Ultraviolet.codec.xor.encode,
      decodeUrl: Ultraviolet.codec.xor.decode,
      handler: '/uv/uv.handler.js',
      client: '/uv/uv.client.js',
      bundle: '/uv/uv.bundle.js',
      config: '/uv/uv.config.js',
      sw: '/uv/uv.sw.js',
    };
  `);
});

// Serve frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Route Bare Server traffic
server.on('request', (req, res) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeRequest(req, res);
  } else {
    app(req, res);
  }
});

server.on('upgrade', (req, socket, head) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeUpgrade(req, socket, head);
  } else {
    socket.end();
  }
});

const PORT = process.env.PORT || 3000;
server.listen({ port: PORT }, () => {
  console.log(`Server live on port ${PORT}`);
});
