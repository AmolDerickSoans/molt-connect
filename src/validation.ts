/**
 * Molt Connect v2 - Security Validation Utilities
 * 
 * Input validation and DoS prevention
 */

// ============= CONSTANTS =============

export const MAX_ADDRESS_LENGTH = 50;
export const MAX_MESSAGE_SIZE = 1024 * 1024; // 1MB
export const MAX_MESSAGES_PER_SECOND = 10;
export const RATE_LIMIT_WINDOW_MS = 1000;

// Blocked internal URL patterns
const INTERNAL_URL_PATTERNS = [
  /^https?:\/\/127\./i,
  /^https?:\/\/10\./i,
  /^https?:\/\/192\.168\./i,
  /^https?:\/\/169\.254\./i,
  /^https?:\/\/localhost/i,
  /^https?:\/\/0\.0\.0\./i,
  /^https?:\/\/\[::1\]/i,           // IPv6 localhost
  /^https?:\/\/\[fc/i,              // IPv6 unique local
  /^https?:\/\/\[fd/i,              // IPv6 unique local
  /^https?:\/\/0\.0\.0\.0/i,
];

// XSS patterns to sanitize
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<script[^>]*>/gi,
  /<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,                     // onclick=, onload=, etc.
  /<iframe\b[^>]*>/gi,
  /<\/iframe>/gi,
  /<object\b[^>]*>/gi,
  /<\/object>/gi,
  /<embed\b[^>]*>/gi,
  /<svg\b[^>]*on\w+/gi,              // SVG with event handlers
  /expression\s*\(/gi,               // CSS expression
  /vbscript:/gi,
];

// ============= VALIDATION FUNCTIONS =============

/**
 * Validate three-word address format
 * Format: word-word-word (lowercase letters only)
 * Max length: 50 characters
 */
export function validateAddress(address: string): { valid: boolean; error?: string } {
  if (!address || typeof address !== 'string') {
    return { valid: false, error: 'Address is required' };
  }
  
  if (address.length > MAX_ADDRESS_LENGTH) {
    return { valid: false, error: `Address exceeds maximum length of ${MAX_ADDRESS_LENGTH} characters` };
  }
  
  const parts = address.split('-');
  if (parts.length !== 3) {
    return { valid: false, error: 'Address must be in word-word-word format' };
  }
  
  // Each word must be lowercase letters only
  for (const part of parts) {
    if (!part || part.length === 0) {
      return { valid: false, error: 'Address words cannot be empty' };
    }
    if (!/^[a-z]+$/.test(part)) {
      return { valid: false, error: 'Address words must contain only lowercase letters (a-z)' };
    }
  }
  
  return { valid: true };
}

/**
 * Check if URL points to internal/blocked address
 * Returns true if URL is internal (should be blocked)
 */
export function isInternalUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  try {
    const parsed = new URL(url);
    
    // Check against patterns
    for (const pattern of INTERNAL_URL_PATTERNS) {
      if (pattern.test(url)) {
        return true;
      }
    }
    
    // Additional hostname checks
    const hostname = parsed.hostname.toLowerCase();
    
    // Localhost variants
    if (hostname === 'localhost' || hostname === 'localhost.localdomain') {
      return true;
    }
    
    // IP address checks
    if (/^127\.\d+\.\d+\.\d+$/.test(hostname)) return true;
    if (/^10\.\d+\.\d+\.\d+$/.test(hostname)) return true;
    if (/^192\.168\.\d+\.\d+$/.test(hostname)) return true;
    if (/^169\.254\.\d+\.\d+$/.test(hostname)) return true;
    if (/^0\.0\.0\.\d+$/.test(hostname)) return true;
    
    // IPv6 localhost
    if (hostname === '::1' || hostname === '[::1]') return true;
    
    // IPv6 unique local addresses (fc00::/7)
    if (/^\[?f[cd]/i.test(hostname)) return true;
    
    return false;
  } catch {
    // Invalid URL format
    return false;
  }
}

/**
 * Validate URL - must not be internal
 */
export function validateUrl(url: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }
  
  try {
    new URL(url); // Validate URL format
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
  
  if (isInternalUrl(url)) {
    return { valid: false, error: 'Internal URLs are not allowed' };
  }
  
  return { valid: true };
}

/**
 * Validate message size
 * Max: 1MB
 */
export function validateMessageSize(message: string): { valid: boolean; error?: string } {
  if (!message || typeof message !== 'string') {
    return { valid: true }; // Empty messages are allowed
  }
  
  const size = Buffer.byteLength(message, 'utf-8');
  if (size > MAX_MESSAGE_SIZE) {
    return { valid: false, error: `Message size (${size} bytes) exceeds maximum of ${MAX_MESSAGE_SIZE} bytes (1MB)` };
  }
  
  return { valid: true };
}

/**
 * Sanitize input to prevent XSS attacks
 * Removes/escapes dangerous HTML/JS content
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return input;
  }
  
  let sanitized = input;
  
  // Remove XSS patterns
  for (const pattern of XSS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }
  
  // Escape remaining dangerous characters
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
 * Sanitize output (lighter sanitization for display)
 */
export function sanitizeForDisplay(input: string): string {
  if (!input || typeof input !== 'string') {
    return input;
  }
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ============= RATE LIMITER =============

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private entries: Map<string, RateLimitEntry> = new Map();
  private maxMessages: number;
  private windowMs: number;
  
  constructor(maxMessages: number = MAX_MESSAGES_PER_SECOND, windowMs: number = RATE_LIMIT_WINDOW_MS) {
    this.maxMessages = maxMessages;
    this.windowMs = windowMs;
  }
  
  /**
   * Check if identifier is rate limited
   * Returns true if allowed, false if rate limited
   */
  check(identifier: string): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const entry = this.entries.get(identifier);
    
    if (!entry || now > entry.resetAt) {
      // New window
      this.entries.set(identifier, {
        count: 1,
        resetAt: now + this.windowMs
      });
      return { allowed: true, remaining: this.maxMessages - 1, resetIn: this.windowMs };
    }
    
    if (entry.count >= this.maxMessages) {
      // Rate limited
      return { allowed: false, remaining: 0, resetIn: entry.resetAt - now };
    }
    
    // Increment count
    entry.count++;
    return { allowed: true, remaining: this.maxMessages - entry.count, resetIn: entry.resetAt - now };
  }
  
  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.entries.forEach((entry, key) => {
      if (now > entry.resetAt) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.entries.delete(key));
  }
  
  /**
   * Reset rate limit for identifier
   */
  reset(identifier: string): void {
    this.entries.delete(identifier);
  }
  
  /**
   * Get current count for identifier
   */
  getCount(identifier: string): number {
    const entry = this.entries.get(identifier);
    if (!entry || Date.now() > entry.resetAt) {
      return 0;
    }
    return entry.count;
  }
}

// Global rate limiter instance
export const globalRateLimiter = new RateLimiter();

// Cleanup interval (every minute)
if (typeof setInterval !== 'undefined') {
  setInterval(() => globalRateLimiter.cleanup(), 60000);
}

// ============= COMBINED VALIDATION =============

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a complete peer registration
 */
export function validatePeerRegistration(
  address: string,
  url: string
): ValidationResult {
  const errors: string[] = [];
  
  const addressResult = validateAddress(address);
  if (!addressResult.valid) {
    errors.push(`Address: ${addressResult.error}`);
  }
  
  const urlResult = validateUrl(url);
  if (!urlResult.valid) {
    errors.push(`URL: ${urlResult.error}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate incoming message
 */
export function validateIncomingMessage(
  from: string,
  message: string
): ValidationResult {
  const errors: string[] = [];
  
  const addressResult = validateAddress(from);
  if (!addressResult.valid) {
    errors.push(`From address: ${addressResult.error}`);
  }
  
  const sizeResult = validateMessageSize(message);
  if (!sizeResult.valid) {
    errors.push(sizeResult.error!);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate outgoing message
 */
export function validateOutgoingMessage(
  to: string,
  message: string
): ValidationResult {
  const errors: string[] = [];
  
  const addressResult = validateAddress(to);
  if (!addressResult.valid) {
    errors.push(`To address: ${addressResult.error}`);
  }
  
  const sizeResult = validateMessageSize(message);
  if (!sizeResult.valid) {
    errors.push(sizeResult.error!);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export default {
  validateAddress,
  validateUrl,
  isInternalUrl,
  validateMessageSize,
  sanitizeInput,
  sanitizeForDisplay,
  validatePeerRegistration,
  validateIncomingMessage,
  validateOutgoingMessage,
  RateLimiter,
  globalRateLimiter,
  MAX_ADDRESS_LENGTH,
  MAX_MESSAGE_SIZE,
  MAX_MESSAGES_PER_SECOND,
};
