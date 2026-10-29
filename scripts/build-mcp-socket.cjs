'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const outputDirectory = path.join(root, 'dist');

fs.mkdirSync(outputDirectory, { recursive: true });
fs.copyFileSync(
  path.join(root, 'src', 'mcpSocketServer.cjs'),
  path.join(outputDirectory, 'socket.js')
);

console.log('Prepared dist/socket.js for the MCP Figma extension.');
