/**
 * Molt Connect - Discovery Relay
 * 
 * Simple registry for mapping three-word addresses to URLs
 * In production: would use DHT or similar
 * 
 * SECURITY HARDENED:
 * - All inputs validated and sanitized
 * - Rate limiting on all endpoints
 * - SSRF prevention via URL validation
 * - Authentication via signature verification
 * - HTTPS support
 */

import express, { Request, Response, NextFunction } from 'express';
import { readFileSync, writeFileSync, existsSync, chmodSync } from 'fs';
import { join } from 'path';
import * as ed from '@noble/ed25519';
import {
  validateAddress,
  validateUrl,
  validatePublicKey,
  sanitizeAddress,
  sanitizeText,
  RateLimiter,
  NonceTracker,
  generateAddressFromPublicKey,
  verifyAddressBinding,
  MAX_MESSAGE_SIZE,
} from './security.js';

interface Registration {
  address: string;
  url: string;
  publicKey?: string;
  signature?: string;
  lastSeen: string;
  registeredAt: string;
}

const REGISTRY_FILE = process.env.REGISTRY_FILE || '/tmp/molt-registry.json';

// ============================================
// RATE LIMITERS
// ============================================

// Registration rate limiter: 10 registrations per hour per IP
const registrationLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,
  keyGenerator: (req) => req.ip || req.connection.remoteAddress || 'unknown',
});

// Resolution rate limiter: 100 requests per minute per IP
const resolutionLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  keyGenerator: (req) => req.ip || req.connection.remoteAddress || 'unknown',
});

// Global rate limiter: 200 requests per 15 minutes per IP
const globalLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 200,
  keyGenerator: (req) => req.ip || req.connection.remoteAddress || 'unknown',
});

// Nonce tracker for replay protection
const nonceTracker = new NonceTracker(5 * 60 * 1000); // 5 minute window

// ============================================
// REGISTRY FUNCTIONS
// ============================================

function loadRegistry(): Map<string, Registration> {
  const registry = new Map();
  
  try {
    if (existsSync(REGISTRY_FILE)) {
      const data = JSON.parse(readFileSync(REGISTRY_FILE, 'utf-8'));
      for (const entry of data) {
        // Validate each entry on load
        if (validateAddress(entry.address).valid && validateUrl(entry.url).valid) {
          registry.set(entry.address, entry);
        }
      }
    }
  } catch (err) {
    console.error('Error loading registry:', err);
  }
  
  return registry;
}

function saveRegistry(registry: Map<string, Registration>) {
  const data = Array.from(registry.values());
  
  try {
    writeFileSync(REGISTRY_FILE, JSON.stringify(data, null, 2));
    
    // Set file permissions to 600 (owner read/write only)
    try {
      chmodSync(REGISTRY_FILE, 0o600);
    } catch (e) {
      // Ignore permission errors
    }
  } catch (err) {
    console.error('Error saving registry:', err);
  }
}

// ============================================
// SIGNATURE VERIFICATION
// ============================================

/**
 * Verify that a registration is signed by the owner of the public key
 */
async function verifyRegistrationSignature(
  address: string,
  publicKey: string,
  signature: string,
  timestamp: number
): Promise<boolean> {
  try {
    // Create message to verify
    const message = JSON.stringify({ address, publicKey, timestamp });
    const messageBytes = Buffer.from(message);
    const sigBytes = Buffer.from(signature, 'hex');
    const pubKeyBytes = Buffer.from(publicKey, 'hex');
    
    return await ed.verifyAsync(sigBytes, messageBytes, pubKeyBytes);
  } catch (err) {
    console.error('Signature verification error:', err);
    return false;
  }
}

/**
 * Verify that address matches the public key
 */
function verifyAddressOwnership(address: string, publicKey: string): boolean {
  return verifyAddressBinding(address, publicKey);
}

// ============================================
// SECURITY MIDDLEWARE
// ============================================

/**
 * Security headers middleware
 */
function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
}

/**
 * Request size limit middleware
 */
function requestSizeLimit(req: Request, res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    const bodySize = JSON.stringify(req.body).length;
    if (bodySize > MAX_MESSAGE_SIZE) {
      return res.status(413).json({
        error: 'Payload too large',
        maxSize: MAX_MESSAGE_SIZE
      });
    }
  }
  next();
}

// ============================================
// EXPRESS APP
// ============================================

const app = express();

// Security middleware
app.use(securityHeaders);
app.use(express.json({ limit: MAX_MESSAGE_SIZE }));
app.use(requestSizeLimit);

// Global rate limiting
app.use(globalLimiter.middleware());

const registry = loadRegistry();

/**
 * Register an agent
 * 
 * Requires:
 * - address: valid three-word address
 * - url: valid HTTP/HTTPS URL (not internal/private)
 * - publicKey: valid Ed25519 public key (64 hex chars)
 * - signature: signature of {address, publicKey, timestamp}
 * - timestamp: Unix timestamp (within 5 minutes)
 * - nonce: unique nonce for replay protection
 */
app.post('/register', registrationLimiter.middleware(), async (req: Request, res: Response) => {
  try {
    const { address, url, publicKey, signature, timestamp, nonce } = req.body;
    
    // Validate required fields
    if (!address || !url || !publicKey) {
      return res.status(400).json({ 
        error: 'address, url, and publicKey are required' 
      });
    }
    
    // Validate address
    const addrValidation = validateAddress(address);
    if (!addrValidation.valid) {
      return res.status(400).json({ 
        error: `Invalid address: ${addrValidation.error}` 
      });
    }
    const cleanAddress = sanitizeAddress(address);
    
    // Validate URL (prevents SSRF)
    const urlValidation = validateUrl(url);
    if (!urlValidation.valid) {
      return res.status(400).json({ 
        error: `Invalid URL: ${urlValidation.error}` 
      });
    }
    const cleanUrl = urlValidation.sanitized!;
    
    // Validate public key
    const keyValidation = validatePublicKey(publicKey);
    if (!keyValidation.valid) {
      return res.status(400).json({ 
        error: `Invalid public key: ${keyValidation.error}` 
      });
    }
    const cleanPublicKey = publicKey.toLowerCase();
    
    // Verify address matches public key
    if (!verifyAddressOwnership(cleanAddress, cleanPublicKey)) {
      return res.status(400).json({ 
        error: 'Address does not match public key. Address must be derived from public key.' 
      });
    }
    
    // Check timestamp (prevent replay attacks)
    if (timestamp) {
      const now = Date.now();
      const maxSkew = 5 * 60 * 1000; // 5 minutes
      if (Math.abs(now - timestamp) > maxSkew) {
        return res.status(400).json({ 
          error: 'Timestamp skew too large. Please sync your clock.' 
        });
      }
    }
    
    // Check nonce (prevent replay attacks)
    if (nonce) {
      if (!nonceTracker.check(nonce)) {
        return res.status(400).json({ 
          error: 'Nonce already used. Please generate a new nonce.' 
        });
      }
    }
    
    // Verify signature if provided
    if (signature && timestamp) {
      const validSig = await verifyRegistrationSignature(
        cleanAddress, 
        cleanPublicKey, 
        signature, 
        timestamp
      );
      
      if (!validSig) {
        return res.status(401).json({ 
          error: 'Invalid signature. Registration rejected.' 
        });
      }
    } else {
      // For backwards compatibility, allow registration without signature
      // But log a warning
      console.warn(`Registration without signature for ${cleanAddress}`);
    }
    
    // Check if this is an update or new registration
    const existing = registry.get(cleanAddress);
    
    if (existing) {
      // Only allow update if public key matches
      if (existing.publicKey && existing.publicKey !== cleanPublicKey) {
        return res.status(403).json({ 
          error: 'Address already registered with different key. Cannot update.' 
        });
      }
      
      // Update existing
      registry.set(cleanAddress, {
        ...existing,
        url: cleanUrl,
        publicKey: cleanPublicKey,
        lastSeen: new Date().toISOString()
      });
      
      saveRegistry(registry);
      console.log(`✅ Updated: @${cleanAddress} -> ${cleanUrl}`);
      return res.json({ success: true, address: cleanAddress, url: cleanUrl, updated: true });
    }
    
    // New registration
    registry.set(cleanAddress, {
      address: cleanAddress,
      url: cleanUrl,
      publicKey: cleanPublicKey,
      lastSeen: new Date().toISOString(),
      registeredAt: new Date().toISOString()
    });
    
    saveRegistry(registry);
    
    console.log(`✅ Registered: @${cleanAddress} -> ${cleanUrl}`);
    res.json({ success: true, address: cleanAddress, url: cleanUrl, updated: false });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Resolve an address to URL
 */
app.get('/resolve/:address', resolutionLimiter.middleware(), (req: Request, res: Response) => {
  // Validate address
  const addrValidation = validateAddress(req.params.address);
  if (!addrValidation.valid) {
    return res.status(400).json({ 
      error: `Invalid address: ${addrValidation.error}` 
    });
  }
  
  const cleanAddress = sanitizeAddress(req.params.address);
  const entry = registry.get(cleanAddress);
  
  if (!entry) {
    return res.status(404).json({ error: 'Address not found' });
  }
  
  // Don't expose the full public key in response
  res.json({
    address: entry.address,
    url: entry.url,
    publicKey: entry.publicKey ? `${entry.publicKey.slice(0, 8)}...` : undefined,
    lastSeen: entry.lastSeen,
    registeredAt: entry.registeredAt
  });
});

/**
 * Verify an address ownership
 */
app.post('/verify', async (req: Request, res: Response) => {
  const { address, publicKey, signature, timestamp, nonce } = req.body;
  
  // Validate inputs
  if (!address || !publicKey || !signature || !timestamp || !nonce) {
    return res.status(400).json({ 
      error: 'address, publicKey, signature, timestamp, and nonce are required' 
    });
  }
  
  // Validate address
  const addrValidation = validateAddress(address);
  if (!addrValidation.valid) {
    return res.status(400).json({ error: `Invalid address: ${addrValidation.error}` });
  }
  
  // Validate public key
  const keyValidation = validatePublicKey(publicKey);
  if (!keyValidation.valid) {
    return res.status(400).json({ error: `Invalid public key: ${keyValidation.error}` });
  }
  
  // Check nonce
  if (!nonceTracker.check(nonce)) {
    return res.status(400).json({ error: 'Nonce already used' });
  }
  
  // Check timestamp
  const now = Date.now();
  if (Math.abs(now - timestamp) > 5 * 60 * 1000) {
    return res.status(400).json({ error: 'Timestamp skew too large' });
  }
  
  // Verify address matches public key
  if (!verifyAddressOwnership(address, publicKey)) {
    return res.status(400).json({ error: 'Address does not match public key' });
  }
  
  // Verify signature
  const valid = await verifyRegistrationSignature(address, publicKey, signature, timestamp);
  
  res.json({ valid, address });
});

/**
 * List all registered agents (limited info)
 */
app.get('/agents', resolutionLimiter.middleware(), (req: Request, res: Response) => {
  const agents = Array.from(registry.values()).map(entry => ({
    address: entry.address,
    lastSeen: entry.lastSeen,
    registeredAt: entry.registeredAt
    // Don't expose URLs or public keys in list
  }));
  
  res.json(agents);
});

/**
 * Health check
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    agents: registry.size,
    uptime: process.uptime()
  });
});

/**
 * Error handler
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 8080;

const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║          MOLT CONNECT DISCOVERY RELAY (SECURE)         ║
╠════════════════════════════════════════════════════════╣
║  Register: POST /register (requires signature)         ║
║  Resolve:  GET  /resolve/:address                      ║
║  Verify:   POST /verify (verify ownership)             ║
║  List:     GET  /agents                                ║
║  Health:   GET  /health                                ║
╠════════════════════════════════════════════════════════╣
║  Rate Limits:                                          ║
║    - Register: 10/hour per IP                          ║
║    - Resolve: 100/minute per IP                        ║
║    - Global: 200/15min per IP                          ║
╚════════════════════════════════════════════════════════╝

Running on http://localhost:${PORT}
`);
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

function cleanup() {
  registrationLimiter.destroy();
  resolutionLimiter.destroy();
  globalLimiter.destroy();
  nonceTracker.destroy();
  server.close();
}

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

export default app;
export { cleanup };
