/**
 * Molt Connect v2 - Peer Registry
 * 
 * Maps three-word addresses to agent URLs
 * For now: local file storage
 * Future: DHT for decentralized discovery
 * 
 * SECURITY: All inputs are validated and sanitized
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, chmodSync, statSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import {
  validateAddress,
  validateUrl,
  validateName,
  validatePublicKey,
  sanitizeText,
  sanitizeAddress,
  MAX_ADDRESS_LENGTH,
  MAX_URL_LENGTH,
} from './security.js';

export interface Peer {
  address: string;      // three-word address
  url: string;          // A2A agent URL
  publicKey?: string;   // Ed25519 public key
  name?: string;        // User-friendly name
  trusted: boolean;     // Auto-accept connections
  blocked: boolean;     // Block all connections
  addedAt: string;      // ISO timestamp
  lastSeen?: string;    // ISO timestamp
}

export interface RegistryError {
  field: string;
  message: string;
}

export class PeerRegistry {
  private peersFile: string;
  private peers: Map<string, Peer> = new Map();
  private ownAddress: string | null = null;
  
  constructor(configDir?: string) {
    const dir = configDir || join(homedir(), '.molt-connect');
    
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      // Set directory permissions to 700 (owner only)
      try {
        chmodSync(dir, 0o700);
      } catch (e) {
        // Ignore permission errors on some systems
      }
    }
    
    this.peersFile = join(dir, 'peers.json');
    this.load();
  }
  
  /**
   * Set own address to prevent self-blocking
   */
  setOwnAddress(address: string) {
    this.ownAddress = address;
  }
  
  /**
   * Validate peer data before registration
   */
  private validatePeer(peer: Partial<Peer>): RegistryError[] {
    const errors: RegistryError[] = [];
    
    // Validate address
    if (peer.address) {
      const addrResult = validateAddress(peer.address);
      if (!addrResult.valid) {
        errors.push({ field: 'address', message: addrResult.error || 'Invalid address' });
      }
    } else {
      errors.push({ field: 'address', message: 'Address is required' });
    }
    
    // Validate URL
    if (peer.url) {
      const urlResult = validateUrl(peer.url);
      if (!urlResult.valid) {
        errors.push({ field: 'url', message: urlResult.error || 'Invalid URL' });
      }
    } else {
      errors.push({ field: 'url', message: 'URL is required' });
    }
    
    // Validate public key if provided
    if (peer.publicKey) {
      const keyResult = validatePublicKey(peer.publicKey);
      if (!keyResult.valid) {
        errors.push({ field: 'publicKey', message: keyResult.error || 'Invalid public key' });
      }
    }
    
    // Validate name if provided
    if (peer.name) {
      const nameResult = validateName(peer.name);
      if (!nameResult.valid) {
        errors.push({ field: 'name', message: nameResult.error || 'Invalid name' });
      }
    }
    
    return errors;
  }
  
  /**
   * Sanitize peer data
   */
  private sanitizePeer(peer: Partial<Peer>): Partial<Peer> {
    return {
      ...peer,
      address: peer.address ? sanitizeAddress(peer.address) : peer.address,
      url: peer.url ? validateUrl(peer.url).sanitized : peer.url,
      name: peer.name ? sanitizeText(peer.name) : peer.name,
    };
  }
  
  private load() {
    try {
      if (existsSync(this.peersFile)) {
        const data = JSON.parse(readFileSync(this.peersFile, 'utf-8'));
        
        if (!Array.isArray(data)) {
          console.error('Invalid peers.json format, starting fresh');
          return;
        }
        
        for (const peer of data) {
          // Validate each peer on load
          const errors = this.validatePeer(peer);
          if (errors.length === 0) {
            const sanitized = this.sanitizePeer(peer);
            this.peers.set(sanitized.address!, {
              ...sanitized,
              trusted: !!peer.trusted,
              blocked: !!peer.blocked,
            } as Peer);
          } else {
            console.warn(`Skipping invalid peer: ${errors.map(e => e.message).join(', ')}`);
          }
        }
      }
    } catch (err) {
      console.error('Error loading peers file:', err);
      // Continue with empty peers
    }
  }
  
  private save() {
    const data = Array.from(this.peers.values());
    
    try {
      writeFileSync(this.peersFile, JSON.stringify(data, null, 2));
      
      // Set file permissions to 600 (owner read/write only)
      try {
        chmodSync(this.peersFile, 0o600);
      } catch (e) {
        // Ignore permission errors on some systems
      }
    } catch (err) {
      console.error('Error saving peers file:', err);
      throw new Error('Failed to save peer registry');
    }
  }
  
  /**
   * Register a new peer or update existing
   * @throws Error if validation fails
   */
  register(peer: Omit<Peer, 'addedAt'>): { success: boolean; errors?: RegistryError[] } {
    // Validate input
    const errors = this.validatePeer(peer);
    if (errors.length > 0) {
      return { success: false, errors };
    }
    
    // Sanitize input
    const sanitized = this.sanitizePeer(peer) as Omit<Peer, 'addedAt'>;
    
    const existing = this.peers.get(sanitized.address);
    
    if (existing) {
      // Update existing
      this.peers.set(sanitized.address, {
        ...existing,
        ...sanitized,
        lastSeen: new Date().toISOString()
      });
    } else {
      // Add new
      this.peers.set(sanitized.address, {
        ...sanitized,
        addedAt: new Date().toISOString()
      });
    }
    
    this.save();
    return { success: true };
  }
  
  /**
   * Resolve an address to a peer
   */
  resolve(address: string): Peer | undefined {
    const cleanAddress = sanitizeAddress(address);
    return this.peers.get(cleanAddress);
  }
  
  /**
   * Get URL for an address
   */
  getUrl(address: string): string | null {
    const peer = this.resolve(address);
    return peer?.url || null;
  }
  
  /**
   * Check if address is trusted
   */
  isTrusted(address: string): boolean {
    const peer = this.resolve(address);
    return peer?.trusted || false;
  }
  
  /**
   * Check if address is blocked
   */
  isBlocked(address: string): boolean {
    const peer = this.resolve(address);
    return peer?.blocked || false;
  }
  
  /**
   * Trust an address
   */
  trust(address: string): { success: boolean; error?: string } {
    const cleanAddress = sanitizeAddress(address);
    
    const addrResult = validateAddress(cleanAddress);
    if (!addrResult.valid) {
      return { success: false, error: addrResult.error };
    }
    
    // Prevent self-trust (would be confusing UX)
    if (this.ownAddress && cleanAddress === this.ownAddress) {
      return { success: false, error: 'Cannot trust your own address' };
    }
    
    const peer = this.peers.get(cleanAddress);
    if (peer) {
      peer.trusted = true;
      peer.blocked = false;
      this.save();
      return { success: true };
    }
    
    return { success: false, error: 'Peer not found. Add them to contacts first.' };
  }
  
  /**
   * Block an address
   */
  block(address: string): { success: boolean; error?: string } {
    const cleanAddress = sanitizeAddress(address);
    
    const addrResult = validateAddress(cleanAddress);
    if (!addrResult.valid) {
      return { success: false, error: addrResult.error };
    }
    
    // Prevent self-block (would prevent receiving messages)
    if (this.ownAddress && cleanAddress === this.ownAddress) {
      return { success: false, error: 'Cannot block your own address' };
    }
    
    const peer = this.peers.get(cleanAddress);
    if (peer) {
      peer.blocked = true;
      peer.trusted = false;
      this.save();
      return { success: true };
    }
    
    return { success: false, error: 'Peer not found. Add them to contacts first.' };
  }
  
  /**
   * Remove a peer
   */
  remove(address: string): boolean {
    const cleanAddress = sanitizeAddress(address);
    if (this.peers.has(cleanAddress)) {
      this.peers.delete(cleanAddress);
      this.save();
      return true;
    }
    return false;
  }
  
  /**
   * List all peers
   */
  list(): Peer[] {
    return Array.from(this.peers.values());
  }
  
  /**
   * Get stats about the registry
   */
  stats(): { total: number; trusted: number; blocked: number } {
    const peers = Array.from(this.peers.values());
    return {
      total: peers.length,
      trusted: peers.filter(p => p.trusted).length,
      blocked: peers.filter(p => p.blocked).length,
    };
  }
}

export default PeerRegistry;
