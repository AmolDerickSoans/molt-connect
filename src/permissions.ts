/**
 * Molt Connect v2 - Permission Manager
 * 
 * Handles connection permission prompts for OpenClaw TUI
 * 
 * SECURITY: All inputs are validated and sanitized
 * 
 * Permission Types:
 * 1. CONNECTION_REQUEST - Another agent wants to connect
 * 2. FIRST_MESSAGE - User sends first message to a new agent
 * 3. ELEVATED_PERMISSION - Agent requests special access
 */

import PeerRegistry, { Peer } from './registry.js';
import {
  validateAddress,
  validateUrl,
  validatePublicKey,
  validateMessage,
  sanitizeText,
  sanitizeAddress,
} from './security.js';

/**
 * Types of permission requests
 */
export type PermissionType = 
  | 'connection-request'
  | 'first-message'
  | 'elevated-permission';

/**
 * Permission request from another agent
 */
export interface PermissionRequest {
  type: PermissionType;  // Type of permission being requested
  from: string;          // Three-word address
  message: string;       // Optional message from requester
  publicKey?: string;    // Their public key
  url?: string;          // Their agent URL
  nonce?: string;        // For replay protection
  timestamp?: number;    // For timing validation
  capability?: string;   // For elevated permissions: what capability is requested
  reason?: string;       // For elevated permissions: why it's needed
}

/**
 * User's decision on a permission request
 */
export interface PermissionDecision {
  action: 'accept' | 'deny' | 'block' | 'trust';
  remember: boolean;
}

/**
 * Result of validating a permission request
 */
export interface PermissionValidationResult {
  valid: boolean;
  errors: string[];
  sanitized?: PermissionRequest;
}

/**
 * TUI-formatted permission prompt for OpenClaw
 */
export interface TUIPermissionPrompt {
  type: PermissionType;
  title: string;
  message: string;
  details: Record<string, string>;
  options: Array<{
    key: string;
    label: string;
    description: string;
    default?: boolean;
  }>;
  urgency: 'low' | 'medium' | 'high';
  timeout?: number;  // Auto-deny after this many milliseconds
}

/**
 * Handler for permission prompts
 */
export type PermissionPromptHandler = (
  request: PermissionRequest
) => Promise<PermissionDecision>;

// Max time difference allowed (5 minutes)
const MAX_TIMESTAMP_SKEW_MS = 5 * 60 * 1000;

export class PermissionManager {
  private registry: PeerRegistry;
  private promptHandler: PermissionPromptHandler | null = null;
  private ownAddress: string | null = null;
  private pendingRequests: Map<string, PermissionRequest> = new Map();
  
  constructor(registry: PeerRegistry) {
    this.registry = registry;
  }
  
  /**
   * Set own address for self-protection checks
   */
  setOwnAddress(address: string) {
    this.ownAddress = address;
    this.registry.setOwnAddress(address);
  }
  
  /**
   * Set the prompt handler (called when user needs to decide)
   */
  setPromptHandler(handler: PermissionPromptHandler) {
    this.promptHandler = handler;
  }
  
  /**
   * Validate a permission request
   */
  validateRequest(request: PermissionRequest): PermissionValidationResult {
    const errors: string[] = [];
    const sanitized: Partial<PermissionRequest> = {};
    
    // Validate permission type
    if (!request.type) {
      errors.push('Permission type is required');
    } else if (!['connection-request', 'first-message', 'elevated-permission'].includes(request.type)) {
      errors.push(`Invalid permission type: ${request.type}`);
    } else {
      sanitized.type = request.type;
    }
    
    // Validate 'from' address
    const fromResult = validateAddress(request.from);
    if (!fromResult.valid) {
      errors.push(`Invalid 'from' address: ${fromResult.error}`);
    } else {
      sanitized.from = sanitizeAddress(request.from);
    }
    
    // Validate message
    if (request.message) {
      const msgResult = validateMessage(request.message);
      if (!msgResult.valid) {
        errors.push(`Invalid message: ${msgResult.error}`);
      } else {
        sanitized.message = msgResult.sanitized;
      }
    } else {
      sanitized.message = '';
    }
    
    // Validate public key if provided
    if (request.publicKey) {
      const keyResult = validatePublicKey(request.publicKey);
      if (!keyResult.valid) {
        errors.push(`Invalid public key: ${keyResult.error}`);
      } else {
        sanitized.publicKey = request.publicKey.toLowerCase();
      }
    }
    
    // Validate URL if provided
    if (request.url) {
      const urlResult = validateUrl(request.url);
      if (!urlResult.valid) {
        errors.push(`Invalid URL: ${urlResult.error}`);
      } else {
        sanitized.url = urlResult.sanitized;
      }
    }
    
    // Validate timestamp if provided
    if (request.timestamp) {
      const now = Date.now();
      const diff = Math.abs(now - request.timestamp);
      if (diff > MAX_TIMESTAMP_SKEW_MS) {
        errors.push('Timestamp skew too large (possible replay attack)');
      }
      sanitized.timestamp = request.timestamp;
    }
    
    // Copy nonce if present
    if (request.nonce) {
      // Nonce should be a valid hex string or UUID
      if (/^[a-fA-F0-9-]+$/.test(request.nonce)) {
        sanitized.nonce = request.nonce;
      } else {
        errors.push('Invalid nonce format');
      }
    }
    
    // Validate capability for elevated permissions
    if (request.type === 'elevated-permission' && request.capability) {
      sanitized.capability = sanitizeText(request.capability);
    }
    
    // Validate reason for elevated permissions
    if (request.type === 'elevated-permission' && request.reason) {
      sanitized.reason = sanitizeText(request.reason);
    }
    
    if (errors.length > 0) {
      return { valid: false, errors };
    }
    
    return { valid: true, errors: [], sanitized: sanitized as PermissionRequest };
  }
  
  /**
   * Check if connection should be auto-accepted
   */
  shouldAutoAccept(from: string): boolean {
    const cleanFrom = sanitizeAddress(from);
    
    // Check if blocked
    if (this.registry.isBlocked(cleanFrom)) {
      return false;
    }
    
    // Check if trusted
    if (this.registry.isTrusted(cleanFrom)) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if connection should be auto-denied
   */
  shouldAutoDeny(from: string): boolean {
    return this.registry.isBlocked(sanitizeAddress(from));
  }
  
  /**
   * Check if peer is known (in contacts)
   */
  isKnownPeer(address: string): boolean {
    return !!this.registry.resolve(sanitizeAddress(address));
  }
  
  /**
   * Request permission for a connection
   */
  async requestPermission(request: PermissionRequest): Promise<PermissionDecision> {
    // Validate request first
    const validation = this.validateRequest(request);
    if (!validation.valid) {
      console.warn('Invalid permission request:', validation.errors);
      return { action: 'deny', remember: false };
    }
    
    const sanitized = validation.sanitized!;
    
    // Store pending request
    this.pendingRequests.set(sanitized.from, sanitized);
    
    // Check if trying to connect to self
    if (this.ownAddress && sanitized.from === this.ownAddress) {
      console.warn('Self-connection attempt blocked');
      return { action: 'deny', remember: false };
    }
    
    // Auto-deny blocked addresses
    if (this.registry.isBlocked(sanitized.from)) {
      return { action: 'deny', remember: false };
    }
    
    // Auto-accept trusted addresses
    if (this.registry.isTrusted(sanitized.from)) {
      return { action: 'accept', remember: false };
    }
    
    // Prompt user
    if (this.promptHandler) {
      const decision = await this.promptHandler(sanitized);
      
      // Apply decision
      if (decision.action === 'trust') {
        const result = this.registry.register({
          address: sanitized.from,
          url: sanitized.url || '',
          publicKey: sanitized.publicKey,
          trusted: true,
          blocked: false
        });
        
        if (!result.success) {
          console.error('Failed to register trusted peer:', result.errors);
        }
      } else if (decision.action === 'block') {
        // First register if not exists, then block
        this.registry.register({
          address: sanitized.from,
          url: sanitized.url || '',
          publicKey: sanitized.publicKey,
          trusted: false,
          blocked: false
        });
        this.registry.block(sanitized.from);
      } else if (decision.action === 'accept' && decision.remember) {
        this.registry.register({
          address: sanitized.from,
          url: sanitized.url || '',
          publicKey: sanitized.publicKey,
          trusted: false,
          blocked: false
        });
      }
      
      // Remove from pending
      this.pendingRequests.delete(sanitized.from);
      
      return decision;
    }
    
    // No handler - default deny
    return { action: 'deny', remember: false };
  }
  
  /**
   * Get the peer registry
   */
  getRegistry(): PeerRegistry {
    return this.registry;
  }
  
  /**
   * Get pending permission requests
   */
  getPendingRequests(): PermissionRequest[] {
    return Array.from(this.pendingRequests.values());
  }
  
  /**
   * Generate a TUI-formatted permission prompt for OpenClaw
   */
  generateTUIPrompt(request: PermissionRequest): TUIPermissionPrompt {
    const from = sanitizeText(sanitizeAddress(request.from || 'unknown'));
    const message = sanitizeText((request.message || '').slice(0, 100));
    const url = sanitizeText(request.url || 'unknown');
    
    switch (request.type) {
      case 'connection-request':
        return {
          type: 'connection-request',
          title: '📥 Incoming Connection Request',
          message: `Agent @${from} wants to connect to you.`,
          details: {
            'Address': `@${from}`,
            'URL': url,
            'Message': message || '(none)',
            'Public Key': request.publicKey ? `${request.publicKey.slice(0, 16)}...` : 'not provided'
          },
          options: [
            { key: 'a', label: 'Accept', description: 'Accept this connection request', default: false },
            { key: 'd', label: 'Deny', description: 'Deny this request (can ask again later)', default: true },
            { key: 't', label: 'Trust', description: 'Accept and remember for future connections' },
            { key: 'b', label: 'Block', description: 'Block all future requests from this agent' }
          ],
          urgency: 'medium',
          timeout: 60000  // 1 minute
        };
        
      case 'first-message':
        return {
          type: 'first-message',
          title: '📤 New Contact',
          message: `You're sending a message to @${from} for the first time.`,
          details: {
            'Address': `@${from}`,
            'URL': url,
            'Message': message,
            'Status': 'Not in your contacts'
          },
          options: [
            { key: 's', label: 'Send', description: 'Send the message', default: true },
            { key: 'c', label: 'Cancel', description: 'Cancel sending' },
            { key: 'a', label: 'Add Contact', description: 'Add to contacts and send' }
          ],
          urgency: 'low',
          timeout: 30000  // 30 seconds
        };
        
      case 'elevated-permission':
        return {
          type: 'elevated-permission',
          title: '⚠️ Elevated Permission Request',
          message: `Agent @${from} is requesting elevated permissions.`,
          details: {
            'Address': `@${from}`,
            'Capability': request.capability || 'unknown',
            'Reason': request.reason || '(no reason provided)',
            'URL': url
          },
          options: [
            { key: 'a', label: 'Allow', description: 'Grant this permission', default: false },
            { key: 'd', label: 'Deny', description: 'Deny this permission request', default: true },
            { key: 't', label: 'Trust', description: 'Grant and remember for future requests' },
            { key: 'b', label: 'Block', description: 'Block all future permission requests from this agent' }
          ],
          urgency: 'high',
          timeout: 120000  // 2 minutes
        };
        
      default:
        // Fallback for unknown types
        return {
          type: request.type || 'connection-request',
          title: 'Permission Request',
          message: `Request from @${from}`,
          details: {
            'Address': `@${from}`,
            'Message': message || '(none)'
          },
          options: [
            { key: 'a', label: 'Accept', description: 'Accept this request', default: false },
            { key: 'd', label: 'Deny', description: 'Deny this request', default: true }
          ],
          urgency: 'medium',
          timeout: 30000
        };
    }
  }
  
  /**
   * Format a permission prompt for terminal display
   * (sanitized for terminal safety)
   */
  formatPrompt(request: PermissionRequest): string {
    const tuiPrompt = this.generateTUIPrompt(request);
    
    let output = `
╔══════════════════════════════════════════════╗
║  ${tuiPrompt.title.padEnd(42)}║
╠══════════════════════════════════════════════╣
║  ${tuiPrompt.message.slice(0, 42).padEnd(42)}║
╠══════════════════════════════════════════════╣`;
    
    for (const [key, value] of Object.entries(tuiPrompt.details)) {
      const line = `${key}: ${value}`.slice(0, 42);
      output += `\n║  ${line.padEnd(42)}║`;
    }
    
    output += `\n╠══════════════════════════════════════════════╣`;
    
    for (const option of tuiPrompt.options) {
      const line = `[${option.key.toUpperCase()}] ${option.label}${option.default ? ' (default)' : ''}`;
      output += `\n║  ${line.padEnd(42)}║`;
    }
    
    output += `\n╚══════════════════════════════════════════════╝\n`;
    
    return output;
  }
}

export default PermissionManager;
