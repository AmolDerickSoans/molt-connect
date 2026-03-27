/**
 * Molt Connect Relay Server
 * 
 * Simple WebSocket relay for:
 * - Peer discovery
 * - Message relay (when direct P2P fails)
 * 
 * Run: node relay/index.js
 */

import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import express from 'express';

const PORT = process.env.PORT || 8080;

// In-memory storage (would use Redis in production)
const peers = new Map(); // address -> { ws, publicKey, port, lastSeen }
const pendingMessages = new Map(); // address -> message[]

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    peers: peers.size,
    uptime: process.uptime()
  });
});

// List online peers
app.get('/peers', (req, res) => {
  const list = Array.from(peers.entries()).map(([address, data]) => ({
    address,
    publicKey: data.publicKey,
    online: Date.now() - data.lastSeen < 60000 // 1 min timeout
  }));
  res.json(list);
});

wss.on('connection', (ws, req) => {
  let peerAddress = null;
  
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      
      switch (msg.type) {
        case 'register':
          // Peer registering itself
          peerAddress = msg.address;
          peers.set(peerAddress, {
            ws,
            publicKey: msg.publicKey,
            port: msg.port,
            lastSeen: Date.now()
          });
          
          console.log(`✅ Peer registered: ${peerAddress}`);
          
          // Send any pending messages
          const pending = pendingMessages.get(peerAddress);
          if (pending && pending.length > 0) {
            pending.forEach(m => ws.send(JSON.stringify(m)));
            pendingMessages.delete(peerAddress);
          }
          break;
          
        case 'discover':
          // Looking for a peer
          const targetPeer = peers.get(msg.address);
          if (targetPeer && targetPeer.ws.readyState === 1) {
            // Found peer - send their info
            ws.send(JSON.stringify({
              type: 'peer-address',
              address: msg.address,
              publicKey: targetPeer.publicKey,
              port: targetPeer.port
            }));
          } else {
            // Peer not found
            ws.send(JSON.stringify({
              type: 'peer-not-found',
              address: msg.address
            }));
          }
          break;
          
        case 'send':
          // Relay message to peer
          const target = peers.get(msg.to);
          if (target && target.ws.readyState === 1) {
            target.ws.send(JSON.stringify(msg.message));
          } else {
            // Store for later
            if (!pendingMessages.has(msg.to)) {
              pendingMessages.set(msg.to, []);
            }
            pendingMessages.get(msg.to).push(msg.message);
          }
          break;
          
        case 'ping':
          // Keepalive
          if (peerAddress) {
            const peer = peers.get(peerAddress);
            if (peer) {
              peer.lastSeen = Date.now();
            }
          }
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
      }
    } catch (err) {
      console.error('Failed to handle message:', err);
    }
  });
  
  ws.on('close', () => {
    if (peerAddress) {
      peers.delete(peerAddress);
      console.log(`❌ Peer disconnected: ${peerAddress}`);
    }
  });
  
  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});

// Cleanup stale peers every minute
setInterval(() => {
  const now = Date.now();
  peers.forEach((peer, address) => {
    if (now - peer.lastSeen > 120000) { // 2 min timeout
      peers.delete(address);
      console.log(`🧹 Cleaned up stale peer: ${address}`);
    }
  });
}, 60000);

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════╗
║     MOLT CONNECT RELAY SERVER        ║
╠══════════════════════════════════════╣
║  WebSocket: ws://localhost:${PORT}      ║
║  Health:    http://localhost:${PORT}/health ║
║  Peers:     http://localhost:${PORT}/peers   ║
╚══════════════════════════════════════╝
  `);
});

export default server;
