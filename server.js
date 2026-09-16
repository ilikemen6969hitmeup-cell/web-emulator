const express = require('express');
const http = require('node:http');
const path = require('node:path');
const { createBareServer } = require('@tomphttp/bare-server-node');
const { uvPath } = require('@titaniumnetwork-dev/ultraviolet');

const app = express();
const server = http.createServer();
const bareServer = createBareServer('/bare/');

// Serve static Ultraviolet core library
app.use('/uv/', express.static(uvPath));

// Ensure __uv$config is always injected correctly
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

// Serve frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// Intercept Bare server routing
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
  console.log(`Server live on http://localhost:${PORT}`);
});
