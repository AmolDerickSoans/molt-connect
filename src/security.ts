/**
 * Molt Connect v2 - Security Utilities
 * 
 * Provides security hardening for:
 * - Input validation
 * - XSS prevention
 * - Rate limiting
 * - Address validation
 * - URL validation
 * - Message sanitization
 */

import { createHash, createHmac } from 'crypto';
import { Request, Response, NextFunction } from 'express';

// ============================================
// CONSTANTS
// ============================================

export const MAX_MESSAGE_SIZE = 1024 * 1024; // 1MB
export const MAX_ADDRESS_LENGTH = 100;
export const MAX_URL_LENGTH = 2048;
export const MAX_NAME_LENGTH = 200;
export const MIN_ADDRESS_WORDS = 3;
export const MAX_PORT = 65535;
export const MIN_PORT = 1;

// Valid characters for three-word addresses (lowercase letters and hyphens)
export const ADDRESS_REGEX = /^[a-z]+(-[a-z]+){2}$/;

// Allowed URL schemes
export const ALLOWED_URL_SCHEMES = ['http:', 'https:'];

/**
 * Check if we're in development mode (allows localhost for testing)
 * Computed at runtime to allow environment variable changes
 */
function isDevMode(): boolean {
  return process.env.MOLT_DEV_MODE === 'true' || process.env.NODE_ENV === 'development';
}

/**
 * Get blocked URL patterns (SSRF prevention)
 * In development mode, we allow localhost for testing
 */
function getBlockedUrlPatterns(): RegExp[] {
  if (isDevMode()) {
    return [
      /^file:\/\//i,                                          // File protocol
      /^javascript:/i,                                        // JavaScript protocol
      /^data:/i,                                              // Data protocol
      /^vbscript:/i,                                          // VBScript protocol
    ];
  }
  return [
    /^https?:\/\/(localhost|127\.\d+\.\d+\.\d+)(:|\/|$)/i,  // Localhost
    /^https?:\/\/(10\.\d+\.\d+\.\d+)(:|\/|$)/i,            // Private 10.x.x.x
    /^https?:\/\/(172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:|\/|$)/i, // Private 172.16-31.x.x
    /^https?:\/\/(192\.168\.\d+\.\d+)(:|\/|$)/i,           // Private 192.168.x.x
    /^https?:\/\/(169\.254\.\d+\.\d+)(:|\/|$)/i,           // Link-local
    /^https?:\/\/(0\.0\.0\.0)(:|\/|$)/i,                    // All interfaces
    /^https?:\/\/(\[::1?\])(:|\/|$)/i,                      // IPv6 localhost
    /^https?:\/\/(\[fc|fd)/i,                               // IPv6 private
    /^file:\/\//i,                                          // File protocol
    /^javascript:/i,                                        // JavaScript protocol
    /^data:/i,                                              // Data protocol
    /^vbscript:/i,                                          // VBScript protocol
  ];
}

// XSS dangerous patterns
export const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,  // Event handlers like onclick=
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /<form/gi,
  /expression\(/gi,
  /vbscript:/gi,
  /data:/gi,
];

// Control characters to strip (newlines, null bytes, etc.)
export const CONTROL_CHAR_REGEX = /[\x00-\x1F\x7F]/g;

// ============================================
// INPUT VALIDATION
// ============================================

/**
 * Validate a three-word address format
 */
export function validateAddress(address: string): { valid: boolean; error?: string } {
  if (!address || typeof address !== 'string') {
    return { valid: false, error: 'Address is required and must be a string' };
  }
  
  if (address.length > MAX_ADDRESS_LENGTH) {
    return { valid: false, error: `Address too long (max ${MAX_ADDRESS_LENGTH} chars)` };
  }
  
  // Remove @ prefix if present
  const cleanAddress = address.startsWith('@') ? address.slice(1) : address;
  
  if (!ADDRESS_REGEX.test(cleanAddress)) {
    return { valid: false, error: 'Invalid address format. Expected: word-word-word (lowercase letters only)' };
  }
  
  return { valid: true };
}

/**
 * Validate and sanitize a URL
 */
export function validateUrl(url: string): { valid: boolean; error?: string; sanitized?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required and must be a string' };
  }
  
  if (url.length > MAX_URL_LENGTH) {
    return { valid: false, error: `URL too long (max ${MAX_URL_LENGTH} chars)` };
  }
  
  // Trim whitespace
  const trimmedUrl = url.trim();
  
  // Parse URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmedUrl);
  } catch (e) {
    return { valid: false, error: 'Invalid URL format' };
  }
  
  // Check scheme
  if (!ALLOWED_URL_SCHEMES.includes(parsedUrl.protocol)) {
    return { valid: false, error: `URL scheme not allowed. Use: ${ALLOWED_URL_SCHEMES.join(', ')}` };
  }
  
  // Check for blocked patterns (SSRF prevention) - now computed at runtime
  const blockedPatterns = getBlockedUrlPatterns();
  for (const pattern of blockedPatterns) {
    if (pattern.test(trimmedUrl)) {
      return { valid: false, error: 'URL points to restricted network location' };
    }
  }
  
  // Validate port
  const port = parsedUrl.port ? parseInt(parsedUrl.port, 10) : (parsedUrl.protocol === 'https:' ? 443 : 80);
  if (port < MIN_PORT || port > MAX_PORT) {
    return { valid: false, error: `Port must be between ${MIN_PORT} and ${MAX_PORT}` };
  }
  
  return { valid: true, sanitized: parsedUrl.toString() };
}

/**
 * Validate a message
 */
export function validateMessage(message: string): { valid: boolean; error?: string; sanitized?: string } {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'Message is required and must be a string' };
  }
  
  if (message.length > MAX_MESSAGE_SIZE) {
    return { valid: false, error: `Message too large (max ${MAX_MESSAGE_SIZE / 1024 / 1024}MB)` };
  }
  
  // Sanitize message
  const sanitized = sanitizeText(message);
  
  return { valid: true, sanitized };
}

/**
 * Validate a peer name
 */
export function validateName(name: string): { valid: boolean; error?: string; sanitized?: string } {
  if (!name) {
    return { valid: true, sanitized: '' }; // Name is optional
  }
  
  if (typeof name !== 'string') {
    return { valid: false, error: 'Name must be a string' };
  }
  
  if (name.length > MAX_NAME_LENGTH) {
    return { valid: false, error: `Name too long (max ${MAX_NAME_LENGTH} chars)` };
  }
  
  return { valid: true, sanitized: sanitizeText(name) };
}

/**
 * Validate a public key (Ed25519 hex string)
 */
export function validatePublicKey(publicKey: string): { valid: boolean; error?: string } {
  if (!publicKey || typeof publicKey !== 'string') {
    return { valid: false, error: 'Public key is required and must be a string' };
  }
  
  // Ed25519 public key is 32 bytes = 64 hex chars
  if (!/^[a-fA-F0-9]{64}$/.test(publicKey)) {
    return { valid: false, error: 'Invalid public key format. Expected 64-character hex string' };
  }
  
  return { valid: true };
}

// ============================================
// XSS PREVENTION
// ============================================

/**
 * Sanitize text to prevent XSS attacks
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  let sanitized = text;
  
  // Remove control characters (except newlines for messages)
  sanitized = sanitized.replace(CONTROL_CHAR_REGEX, (char) => {
    // Allow newlines and tabs
    if (char === '\n' || char === '\t' || char === '\r') {
      return char;
    }
    return '';
  });
  
  // Escape HTML entities
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return sanitized;
}

/**
 * Sanitize an address for display (remove dangerous chars)
 */
export function sanitizeAddress(address: string): string {
  if (!address || typeof address !== 'string') {
    return '';
  }
  
  // Remove @ prefix
  let clean = address.startsWith('@') ? address.slice(1) : address;
  
  // Only allow lowercase letters and hyphens
  return clean.replace(/[^a-z-]/g, '');
}

/**
 * Strip all dangerous patterns from text (for logs, etc.)
 */
export function stripDangerousPatterns(text: string): string {
  let stripped = text;
  
  for (const pattern of XSS_PATTERNS) {
    stripped = stripped.replace(pattern, '');
  }
  
  return stripped;
}

// ============================================
// RATE LIMITING
// ============================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitOptions {
  windowMs: number;     // Time window in milliseconds
  maxRequests: number;  // Max requests per window
  keyGenerator?: (req: Request) => string;
  onLimitReached?: (req: Request, res: Response) => void;
}

/**
 * In-memory rate limiter
 */
export class RateLimiter {
  private entries: Map<string, RateLimitEntry> = new Map();
  private options: RateLimitOptions;
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  constructor(options: RateLimitOptions) {
    this.options = options;
    
    // Cleanup old entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }
  
  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.entries.entries()) {
      if (now > entry.resetTime) {
        this.entries.delete(key);
      }
    }
  }
  
  /**
   * Check if request should be rate limited
   */
  check(key: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.entries.get(key);
    
    if (!entry || now > entry.resetTime) {
      // New window
      const resetTime = now + this.options.windowMs;
      this.entries.set(key, { count: 1, resetTime });
      return { allowed: true, remaining: this.options.maxRequests - 1, resetTime };
    }
    
    if (entry.count >= this.options.maxRequests) {
      return { allowed: false, remaining: 0, resetTime: entry.resetTime };
    }
    
    entry.count++;
    return { allowed: true, remaining: this.options.maxRequests - entry.count, resetTime: entry.resetTime };
  }
  
  /**
   * Express middleware
   */
  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const key = this.options.keyGenerator 
        ? this.options.keyGenerator(req) 
        : req.ip || 'unknown';
      
      const result = this.check(key);
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', this.options.maxRequests);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000));
      
      if (!result.allowed) {
        if (this.options.onLimitReached) {
          this.options.onLimitReached(req, res);
        } else {
          res.status(429).json({
            error: 'Too many requests',
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
          });
        }
        return;
      }
      
      next();
    };
  }
  
  /**
   * Stop cleanup interval
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// ============================================
// ADDRESS GENERATION FROM PUBLIC KEY
// ============================================

const WORDS = [
  'able', 'acid', 'aged', 'also', 'area', 'army', 'away', 'baby', 'back', 'ball',
  'bank', 'base', 'bath', 'bear', 'beat', 'been', 'best', 'bill', 'bird', 'blue',
  'boat', 'body', 'bomb', 'bond', 'bone', 'book', 'boom', 'born', 'boss', 'both',
  'dark', 'data', 'date', 'dawn', 'days', 'dead', 'deal', 'dean', 'dear', 'debt',
  'love', 'luck', 'made', 'mail', 'main', 'make', 'male', 'many', 'mark', 'mars',
  'moon', 'more', 'most', 'move', 'much', 'must', 'name', 'navy', 'near', 'need',
  'fire', 'fish', 'five', 'flat', 'flow', 'food', 'foot', 'ford', 'form', 'fort',
  'star', 'stay', 'step', 'stop', 'such', 'suit', 'sure', 'take', 'talk', 'tall',
  'desert', 'forest', 'island', 'meadow', 'mountain', 'ocean', 'river', 'valley',
  'dance', 'dream', 'hope', 'joy', 'love', 'peace', 'song', 'story', 'wind', 'fire',
  // Expanded word list for more entropy
  'alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel',
  'india', 'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa',
  'quebec', 'romeo', 'sierra', 'tango', 'uniform', 'victor', 'whiskey', 'xray',
  'yankee', 'zulu', 'amber', 'bronze', 'copper', 'diamond', 'emerald', 'frost',
  'garnet', 'hemlock', 'ivory', 'jade', 'krypton', 'lunar', 'magenta', 'nebula',
  'onyx', 'pearl', 'quartz', 'ruby', 'sapphire', 'topaz', 'umber', 'violet',
  'willow', 'xenon', 'yellow', 'zircon', 'azure', 'blaze', 'coral', 'dune',
  'ember', 'fable', 'glimmer', 'haven', 'iris', 'jungle', 'krystal', 'lotus'
];

/**
 * Generate three-word address FROM Ed25519 public key
 * This creates a cryptographic binding between address and identity
 */
export function generateAddressFromPublicKey(publicKeyHex: string): string {
  // Use SHA-256 hash of public key for deterministic address
  const hash = createHash('sha256').update(Buffer.from(publicKeyHex, 'hex')).digest();
  
  // Use first 6 bytes (48 bits) to select 3 words
  // This gives us good distribution across the word list
  const i1 = hash[0] | (hash[1] << 8);  // 16 bits
  const i2 = hash[2] | (hash[3] << 8);  // 16 bits
  const i3 = hash[4] | (hash[5] << 8);  // 16 bits
  
  return `${WORDS[i1 % WORDS.length]}-${WORDS[i2 % WORDS.length]}-${WORDS[i3 % WORDS.length]}`;
}

/**
 * Verify that an address matches the public key
 */
export function verifyAddressBinding(address: string, publicKeyHex: string): boolean {
  const expectedAddress = generateAddressFromPublicKey(publicKeyHex);
  const cleanAddress = address.startsWith('@') ? address.slice(1) : address;
  return expectedAddress === cleanAddress;
}

/**
 * Get word list size for entropy calculation
 */
export function getWordListSize(): number {
  return WORDS.length;
}

/**
 * Calculate total address space
 */
export function getAddressSpace(): number {
  return Math.pow(WORDS.length, 3);
}

// ============================================
// NONCE AND REPLAY PROTECTION
// ============================================

interface NonceEntry {
  timestamp: number;
}

/**
 * In-memory nonce tracker for replay protection
 */
export class NonceTracker {
  private nonces: Map<string, NonceEntry> = new Map();
  private maxAge: number; // milliseconds
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  constructor(maxAgeMs: number = 300000) { // Default 5 minutes
    this.maxAge = maxAgeMs;
    
    // Cleanup old nonces every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }
  
  private cleanup() {
    const now = Date.now();
    for (const [nonce, entry] of this.nonces.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        this.nonces.delete(nonce);
      }
    }
  }
  
  /**
   * Check if nonce is new (not replayed)
   */
  check(nonce: string): boolean {
    if (this.nonces.has(nonce)) {
      return false; // Replay detected
    }
    
    this.nonces.set(nonce, { timestamp: Date.now() });
    return true;
  }
  
  /**
   * Stop cleanup interval
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// ============================================
// EXPORTS
// ============================================

export default {
  // Validation
  validateAddress,
  validateUrl,
  validateMessage,
  validateName,
  validatePublicKey,
  
  // Sanitization
  sanitizeText,
  sanitizeAddress,
  stripDangerousPatterns,
  
  // Rate limiting
  RateLimiter,
  
  // Address binding
  generateAddressFromPublicKey,
  verifyAddressBinding,
  getWordListSize,
  getAddressSpace,
  
  // Replay protection
  NonceTracker,
  
  // Constants
  MAX_MESSAGE_SIZE,
  MAX_ADDRESS_LENGTH,
  MAX_URL_LENGTH,
  MAX_NAME_LENGTH,
  ADDRESS_REGEX,
  ALLOWED_URL_SCHEMES,
};
