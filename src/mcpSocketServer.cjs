'use strict';

const http = require('node:http');
const { WebSocket, WebSocketServer } = require('ws');

const port = Number(process.env.PORT || 3055);
const host = process.env.HOST || 'localhost';
const channels = new Map();
const joinedChannels = new WeakMap();

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid WebSocket port: ${process.env.PORT}`);
}

function send(socket, payload) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
}

function sendError(socket, message) {
  send(socket, { type: 'error', message });
}

function leaveAllChannels(socket) {
  for (const channelName of joinedChannels.get(socket) || []) {
    const clients = channels.get(channelName);
    if (!clients) continue;

    clients.delete(socket);
    for (const client of clients) {
      send(client, {
        type: 'system',
        message: 'A user has left the channel',
        channel: channelName
      });
    }

    if (clients.size === 0) channels.delete(channelName);
  }
  joinedChannels.delete(socket);
}

function handleMessage(socket, rawMessage) {
  let data;
  try {
    data = JSON.parse(rawMessage.toString());
  } catch {
    sendError(socket, 'Message must contain valid JSON');
    return;
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    sendError(socket, 'Message must be a JSON object');
    return;
  }

  if (data.type === 'join') {
    if (typeof data.channel !== 'string' || !data.channel.trim()) {
      sendError(socket, 'Channel name is required');
      return;
    }

    const channelName = data.channel;
    let clients = channels.get(channelName);
    if (!clients) {
      clients = new Set();
      channels.set(channelName, clients);
    }
    clients.add(socket);

    let membership = joinedChannels.get(socket);
    if (!membership) {
      membership = new Set();
      joinedChannels.set(socket, membership);
    }
    membership.add(channelName);

    send(socket, {
      type: 'system',
      message: `Joined channel: ${channelName}`,
      channel: channelName
    });
    if (data.id !== undefined) {
      send(socket, {
        type: 'system',
        message: {
          id: data.id,
          result: `Connected to channel: ${channelName}`
        },
        channel: channelName
      });
    }
    for (const client of clients) {
      if (client !== socket) {
        send(client, {
          type: 'system',
          message: 'A new user has joined the channel',
          channel: channelName
        });
      }
    }
    return;
  }

  if (data.type === 'message') {
    if (typeof data.channel !== 'string' || !data.channel.trim()) {
      sendError(socket, 'Channel name is required');
      return;
    }

    const clients = channels.get(data.channel);
    if (!clients || !clients.has(socket)) {
      sendError(socket, 'You must join the channel first');
      return;
    }

    for (const client of clients) {
      send(client, {
        type: 'broadcast',
        message: data.message,
        sender: client === socket ? 'You' : 'User',
        channel: data.channel
      });
    }
    return;
  }

  sendError(socket, `Unsupported message type: ${String(data.type)}`);
}

const server = http.createServer((request, response) => {
  if (request.method === 'GET' && request.url === '/health') {
    response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('WebSocket server running');
    return;
  }

  response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end('Not found');
});

const webSocketServer = new WebSocketServer({ server });

webSocketServer.on('connection', (socket) => {
  send(socket, {
    type: 'system',
    message: 'Please join a channel to start chatting'
  });
  socket.on('message', (message) => handleMessage(socket, message));
  socket.on('close', () => leaveAllChannels(socket));
  socket.on('error', (error) => {
    console.error('WebSocket client error:', error.message);
  });
});

server.on('error', (error) => {
  console.error('WebSocket server error:', error.message);
  process.exitCode = 1;
});

server.listen(port, host, () => {
  console.log(`WebSocket server listening on port ${port}`);
});

function closeServer() {
  webSocketServer.close();
  server.close(() => process.exit(0));
}

process.on('SIGINT', closeServer);
process.on('SIGTERM', closeServer);
