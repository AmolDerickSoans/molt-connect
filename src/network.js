/**
 * Molt Connect - Network Layer
 * 
 * Handles:
 * - Discovery via relay server
 * - WebSocket connections
 * - Message routing
 */

import { WebSocketServer, WebSocket } from 'ws';
import express from 'express';
import { createServer } from 'http';
import { randomBytes } from 'crypto';

// Default relay server (can be self-hosted)
const DEFAULT_RELAY = 'wss://molt-relay.fly.dev';

/**
 * Connection states
 */
export const ConnectionState = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error'
};

/**
 * Network Manager
 */
export class NetworkManager {
  constructor(identity, options = {}) {
    this.identity = identity;
    this.relayUrl = options.relayUrl || DEFAULT_RELAY;
    this.port = options.port || 0; // 0 = random available port
    
    this.connections = new Map(); // address -> { ws, state }
    this.pendingHellos = new Map(); // requestId -> { from, message }
    this.messageHandlers = new Map(); // method -> handler[]
    this.permissionHandler = null;
    
    this.server = null;
    this.relaySocket = null;
  }
  
  /**
   * Start listening for connections
   */
  async start() {
    const app = express();
    const server = createServer(app);
    const wss = new WebSocketServer({ server });
    
    // Handle incoming WebSocket connections
    wss.on('connection', (ws, req) => {
      this.handleIncomingConnection(ws, req);
    });
    
    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', address: this.identity.address });
    });
    
    // Agent card endpoint (A2A compatible)
    app.get('/agent-card', (req, res) => {
      res.json({
        address: this.identity.address,
        publicKey: this.identity.publicKey,
        capabilities: ['message', 'context', 'query'],
        version: '1.0.0'
      });
    });
    
    return new Promise((resolve) => {
      server.listen(this.port, () => {
        const addr = server.address();
        this.port = addr.port;
        this.server = server;
        console.log(`Molt Connect listening on port ${this.port}`);
        resolve(this.port);
      });
    });
  }
  
  /**
   * Connect to relay for discovery
   */
  async connectToRelay() {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.relayUrl);
      
      ws.on('open', () => {
        // Register with relay
        ws.send(JSON.stringify({
          type: 'register',
          address: this.identity.address,
          publicKey: this.identity.publicKey,
          port: this.port
        }));
        
        this.relaySocket = ws;
        resolve();
      });
      
      ws.on('message', (data) => {
        this.handleRelayMessage(data);
      });
      
      ws.on('error', (err) => {
        console.error('Relay connection error:', err);
        reject(err);
      });
    });
  }
  
  /**
   * Handle incoming WebSocket connection
   */
  handleIncomingConnection(ws, req) {
    let peerAddress = null;
    
    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        
        if (msg.method === 'hello') {
          // Incoming connection request
          peerAddress = msg.params.from;
          this.handleHello(msg, ws);
        } else if (msg.jsonrpc === '2.0') {
          // Regular message
          this.handleMessage(msg, ws);
        }
      } catch (err) {
        console.error('Failed to parse message:', err);
      }
    });
    
    ws.on('close', () => {
      if (peerAddress) {
        this.connections.delete(peerAddress);
      }
    });
  }
  
  /**
   * Handle HELLO message (connection request)
   */
  async handleHello(msg, ws) {
    const { from, fromPublicKey, message } = msg.params;
    
    // Check if blocked
    const { isBlocked } = await import('./core.js');
    if (isBlocked(from)) {
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        result: { accepted: false, message: 'Blocked' },
        id: msg.id
      }));
      ws.close();
      return;
    }
    
    // Store pending hello
    this.pendingHellos.set(msg.id, { from, fromPublicKey, message, ws });
    
    // Request permission from user
    if (this.permissionHandler) {
      const accepted = await this.permissionHandler(from, message);
      
      const response = {
        jsonrpc: '2.0',
        result: { accepted, message: accepted ? 'Accepted' : 'Denied' },
        id: msg.id
      };
      
      ws.send(JSON.stringify(response));
      
      if (accepted) {
        this.connections.set(from, { ws, state: ConnectionState.CONNECTED });
        
        // Save peer
        const { savePeer } = await import('./core.js');
        savePeer({ address: from, publicKey: fromPublicKey });
      } else {
        ws.close();
      }
    }
  }
  
  /**
   * Handle regular message
   */
  handleMessage(msg, ws) {
    const handlers = this.messageHandlers.get('message') || [];
    handlers.forEach(handler => handler(msg));
  }
  
  /**
   * Handle relay message
   */
  handleRelayMessage(data) {
    try {
      const msg = JSON.parse(data.toString());
      
      if (msg.type === 'peer-address') {
        // Got peer's connection info
        const { address, host, port, publicKey } = msg;
        console.log(`Discovered peer: ${address} at ${host}:${port}`);
      } else if (msg.type === 'message') {
        // Incoming message via relay
        const handlers = this.messageHandlers.get('message') || [];
        handlers.forEach(handler => handler(msg));
      }
    } catch (err) {
      console.error('Failed to parse relay message:', err);
    }
  }
  
  /**
   * Send message to a peer
   */
  async sendMessage(toAddress, content, type = 'message') {
    // Check if we have a direct connection
    const conn = this.connections.get(toAddress);
    
    if (conn && conn.state === ConnectionState.CONNECTED) {
      // Send directly
      const { createMessage, signMessage } = await import('./core.js');
      const msg = createMessage(this.identity.address, toAddress, content, type);
      const signed = {
        ...msg,
        signature: signMessage(msg, this.identity.privateKey)
      };
      conn.ws.send(JSON.stringify(signed));
      return true;
    }
    
    // Try to connect via relay
    if (this.relaySocket) {
      const { createMessage, signMessage } = await import('./core.js');
      const msg = createMessage(this.identity.address, toAddress, content, type);
      const signed = {
        ...msg,
        signature: signMessage(msg, this.identity.privateKey)
      };
      
      this.relaySocket.send(JSON.stringify({
        type: 'send',
        to: toAddress,
        message: signed
      }));
      return true;
    }
    
    return false;
  }
  
  /**
   * Initiate connection to a peer
   */
  async connectToPeer(address, message = '') {
    // First, try to discover peer via relay
    if (this.relaySocket) {
      this.relaySocket.send(JSON.stringify({
        type: 'discover',
        address
      }));
    }
    
    // For now, return a pending state
    // In full implementation, would wait for peer-address response
    return ConnectionState.CONNECTING;
  }
  
  /**
   * Set permission handler
   */
  onPermissionRequest(handler) {
    this.permissionHandler = handler;
  }
  
  /**
   * Register message handler
   */
  onMessage(handler) {
    const handlers = this.messageHandlers.get('message') || [];
    handlers.push(handler);
    this.messageHandlers.set('message', handlers);
  }
  
  /**
   * Stop the network manager
   */
  stop() {
    if (this.server) {
      this.server.close();
    }
    if (this.relaySocket) {
      this.relaySocket.close();
    }
    this.connections.forEach(conn => conn.ws.close());
    this.connections.clear();
  }
}

export default NetworkManager;
