const express = require('express');
const { createBareServer } = require('@tomphttp/bare-server-node');
const { uvPath } = require('@titaniumnetwork-dev/ultraviolet');
const http = require('node:http');
const path = require('node:path');

const app = express();
const server = http.createServer();
const bareServer = createBareServer('/bare/');

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Serve Ultraviolet assets
app.use('/uv/', express.static(uvPath));

// Route HTTP requests to Bare Server
server.on('request', (req, res) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeRequest(req, res);
  } else {
    app(req, res);
  }
});

// Route WebSocket upgrades to Bare Server
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
