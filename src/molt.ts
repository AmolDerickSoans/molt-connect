/**
 * Molt Connect v2 - Complete Integration
 * 
 * A2A Protocol + Three-word addresses + Permissions + Ed25519 Authentication
 * 
 * Security Model:
 * - Address is cryptographically bound to Ed25519 public key
 * - All messages are signed
 * - Sender verification prevents address spoofing
 * - Input validation and DoS prevention
 */

import { 
  createMoltConnectServer, 
  sendMoltMessage,
  toThreeWord,
  getOrCreateIdentity,
  signMessage,
  verifySignature,
  MoltIdentity,
  cleanup
} from './molt-a2a.js';
import {
  validateAddress,
  validateUrl,
  validateMessage,
  sanitizeText,
  sanitizeAddress,
  RateLimiter,
  MAX_MESSAGE_SIZE,
  generateAddressFromPublicKey,
  verifyAddressBinding
} from './security.js';
import PeerRegistry from './registry.js';
import PermissionManager, { PermissionRequest } from './permissions.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// Re-export MoltIdentity for convenience
export type { MoltIdentity };

export interface MoltConnectConfig {
  configDir?: string;
  port?: number;
  onPermissionPrompt?: (req: PermissionRequest) => Promise<'accept' | 'deny' | 'trust' | 'block'>;
  onMessage?: (from: string, message: string) => Promise<string>;
}

// Global rate limiter for incoming messages
const messageRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30
});

export class MoltConnect {
  private configDir: string;
  private registry: PeerRegistry;
  private permissions: PermissionManager;
  private identity: MoltIdentity | null = null;
  private port: number = 4000;
  private server: any = null;
  private onMessage: (from: string, message: string) => Promise<string>;
  
  constructor(config: MoltConnectConfig = {}) {
    this.configDir = config.configDir || join(homedir(), '.molt-connect');
    this.port = config.port || 4000;
    
    if (!existsSync(this.configDir)) {
      mkdirSync(this.configDir, { recursive: true });
    }
    
    this.registry = new PeerRegistry(this.configDir);
    this.permissions = new PermissionManager(this.registry);
    
    if (config.onPermissionPrompt) {
      this.permissions.setPromptHandler(async (req) => {
        const action = await config.onPermissionPrompt!(req);
        return { action, remember: action === 'trust' || action === 'block' };
      });
    }
    
    this.onMessage = config.onMessage || (async (from, msg) => {
      return `Received: ${msg}`;
    });
  }
  
  /**
   * Initialize and start the agent
   * Identity is cryptographically generated with Ed25519 key pair
   */
  async start(): Promise<{ address: string; port: number }> {
    // Load or create cryptographic identity
    this.identity = await getOrCreateIdentity();
    
    // Set own address in permissions to prevent self-block
    this.permissions.setOwnAddress(this.identity.address);
    
    // Start A2A server with identity
    const result = await createMoltConnectServer({
      port: this.port,
      identity: this.identity,
      onMessage: async (from, message) => {
        // SECURITY: Validate incoming message
        const addrValidation = validateAddress(from);
        if (!addrValidation.valid) {
          console.error('Invalid sender address:', addrValidation.error);
          return 'Invalid sender';
        }
        
        // SECURITY: Rate limiting check
        const rateCheck = messageRateLimiter.check(from);
        if (!rateCheck.allowed) {
          console.warn(`Rate limit exceeded for ${from}`);
          return 'Rate limit exceeded. Please slow down.';
        }
        
        // SECURITY: Sanitize message content
        const sanitizedMessage = sanitizeText(message);
        const sanitizedFrom = sanitizeAddress(from);
        
        // Check permission
        if (this.permissions.shouldAutoDeny(sanitizedFrom)) {
          return 'Connection blocked';
        }
        
        // If not trusted, would prompt here
        if (!this.permissions.shouldAutoAccept(sanitizedFrom)) {
          const decision = await this.permissions.requestPermission({
            from: sanitizedFrom,
            message: sanitizedMessage.slice(0, 100),
            url: '',
            type: 'connection-request'
          });
          
          if (decision.action === 'deny' || decision.action === 'block') {
            return 'Connection denied';
          }
        }
        
        return this.onMessage(sanitizedFrom, sanitizedMessage);
      }
    }) as { server: any; address: string; agentCard: any; identity: MoltIdentity };
    
    this.server = result.server;
    
    return {
      address: this.identity.address,
      port: this.port
    };
  }
  
  /**
   * Load identity without starting server
   * Address is cryptographically bound to Ed25519 public key
   */
  async loadIdentity(): Promise<{ address: string; port: number; publicKey: string }> {
    if (!this.identity) {
      this.identity = await getOrCreateIdentity();
    }
    
    return {
      address: this.identity.address,
      port: this.port,
      publicKey: this.identity.publicKey
    };
  }
  
  /**
   * Send a message to another agent
   */
  async send(address: string, message: string): Promise<string> {
    // SECURITY: Validate outgoing message
    const addrValidation = validateAddress(address);
    if (!addrValidation.valid) {
      throw new Error(`Invalid address: ${addrValidation.error}`);
    }
    
    const msgValidation = validateMessage(message);
    if (!msgValidation.valid) {
      throw new Error(`Invalid message: ${msgValidation.error}`);
    }
    
    if (!this.identity) {
      await this.loadIdentity();
    }
    
    // Resolve address to URL
    const peer = this.registry.resolve(address);
    
    if (!peer) {
      throw new Error(`Unknown address: @${address}. Add them to your contacts first with: molt add @${address} <url>`);
    }
    
    // Send signed message
    return sendMoltMessage(peer.url, message, this.identity!);
  }
  
  /**
   * Add a peer
   */
  addPeer(address: string, url: string, name?: string, publicKey?: string): { success: boolean; error?: string } {
    // SECURITY: Validate address and URL
    const addressValidation = validateAddress(address);
    if (!addressValidation.valid) {
      return { success: false, error: `Invalid address: ${addressValidation.error}` };
    }
    
    const urlValidation = validateUrl(url);
    if (!urlValidation.valid) {
      return { success: false, error: `Invalid URL: ${urlValidation.error}` };
    }
    
    // SECURITY: Sanitize optional fields
    const sanitizedName = name ? sanitizeText(name) : undefined;
    
    const result = this.registry.register({
      address,
      url: urlValidation.sanitized!,
      name: sanitizedName,
      trusted: false,
      blocked: false,
      publicKey
    });
    
    return result;
  }
  
  /**
   * List peers
   */
  listPeers() {
    return this.registry.list();
  }
  
  /**
   * Trust a peer
   */
  trust(address: string): { success: boolean; error?: string } {
    return this.registry.trust(address);
  }
  
  /**
   * Block a peer
   */
  block(address: string): { success: boolean; error?: string } {
    return this.registry.block(address);
  }
  
  /**
   * Get own address (cryptographically bound to Ed25519 key)
   */
  getAddress(): string {
    return this.identity?.address || '';
  }
  
  /**
   * Get own public key
   */
  getPublicKey(): string {
    return this.identity?.publicKey || '';
  }
  
  /**
   * Get identity (for signing operations)
   */
  getIdentity(): MoltIdentity | null {
    return this.identity;
  }
  
  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
    cleanup();
  }
}

export default MoltConnect;

// Re-export useful bits
export { 
  toThreeWord as generateAddress
} from './molt-a2a.js';
export {
  generateAddressFromPublicKey,
  verifyAddressBinding
} from './security.js';
export { getOrCreateIdentity, signMessage, verifySignature } from './molt-a2a.js';
export { PeerRegistry } from './registry.js';
export { PermissionManager } from './permissions.js';
export {
  validateAddress,
  validateUrl,
  validateMessage,
  sanitizeText,
  sanitizeAddress,
  RateLimiter,
  MAX_MESSAGE_SIZE
} from './security.js';
