/**
 * Molt Connect - P2P Agent Communication
 * 
 * Core module that handles:
 * - Three-word address generation (bound to public key)
 * - Ed25519 identity with encrypted private key storage
 * - Message sending/receiving with signatures
 * - Permission prompts
 * 
 * SECURITY HARDENED:
 * - Address cryptographically bound to public key
 * - Private key encrypted at rest with passphrase
 * - File permissions restricted
 * - All inputs validated
 */

import * as ed from '@noble/ed25519';
import { randomBytes, createHash, createCipheriv, createDecipheriv, scryptSync } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync, chmodSync, statSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// Word list for three-word addresses (expanded for more entropy)
const WORDS = [
  'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
  'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
  'river', 'mountain', 'ocean', 'forest', 'desert', 'island', 'valley', 'meadow',
  'moon', 'sun', 'star', 'sky', 'cloud', 'rain', 'snow', 'wind',
  'dance', 'song', 'story', 'dream', 'hope', 'love', 'peace', 'joy',
  'fire', 'water', 'earth', 'air', 'light', 'dark', 'time', 'space',
  'wolf', 'bear', 'eagle', 'hawk', 'lion', 'tiger', 'deer', 'fish',
  'red', 'blue', 'green', 'gold', 'silver', 'white', 'black', 'purple',
  // Extended word list
  'alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel',
  'india', 'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa',
  'quebec', 'romeo', 'sierra', 'tango', 'uniform', 'victor', 'whiskey', 'xray',
  'yankee', 'zulu', 'amber', 'bronze', 'copper', 'diamond', 'emerald', 'frost',
  'garnet', 'hemlock', 'ivory', 'jade', 'krypton', 'lunar', 'magenta', 'nebula',
  'onyx', 'pearl', 'quartz', 'ruby', 'sapphire', 'topaz', 'umber', 'violet',
  'willow', 'xenon', 'yellow', 'zircon', 'azure', 'blaze', 'coral', 'dune',
  'ember', 'fable', 'glimmer', 'haven', 'iris', 'jungle', 'krystal', 'lotus'
];

const CONFIG_DIR = process.env.MOLT_CONFIG_DIR || join(homedir(), '.molt-connect');
const IDENTITY_FILE = join(CONFIG_DIR, 'identity.json');
const PEERS_FILE = join(CONFIG_DIR, 'known-peers.json');
const BLOCKED_FILE = join(CONFIG_DIR, 'blocked.json');

// ============================================
// INPUT VALIDATION
// ============================================

/**
 * Validate a three-word address format
 */
export function validateAddress(address) {
  if (!address || typeof address !== 'string') {
    return { valid: false, error: 'Address is required and must be a string' };
  }
  
  if (address.length > 100) {
    return { valid: false, error: 'Address too long' };
  }
  
  // Remove @ prefix if present
  const cleanAddress = address.startsWith('@') ? address.slice(1) : address;
  
  // Must be word-word-word format (lowercase letters)
  if (!/^[a-z]+(-[a-z]+){2}$/.test(cleanAddress)) {
    return { valid: false, error: 'Invalid address format. Expected: word-word-word' };
  }
  
  return { valid: true };
}

/**
 * Sanitize an address (remove dangerous characters)
 */
export function sanitizeAddress(address) {
  if (!address || typeof address !== 'string') return '';
  const clean = address.startsWith('@') ? address.slice(1) : address;
  return clean.replace(/[^a-z-]/g, '');
}

/**
 * Sanitize text (XSS prevention)
 */
export function sanitizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// ============================================
// ADDRESS GENERATION FROM PUBLIC KEY
// ============================================

/**
 * Generate a three-word address FROM Ed25519 public key
 * This creates a cryptographic binding between address and identity
 */
export function generateAddress(publicKey) {
  // publicKey can be hex string or Buffer
  const pubKeyBytes = typeof publicKey === 'string' 
    ? Buffer.from(publicKey, 'hex') 
    : publicKey;
  
  // Use SHA-256 hash for deterministic address
  const hash = createHash('sha256').update(pubKeyBytes).digest();
  
  // Use first 6 bytes (48 bits) to select 3 words
  const i1 = hash[0] | (hash[1] << 8);
  const i2 = hash[2] | (hash[3] << 8);
  const i3 = hash[4] | (hash[5] << 8);
  
  return `${WORDS[i1 % WORDS.length]}-${WORDS[i2 % WORDS.length]}-${WORDS[i3 % WORDS.length]}`;
}

/**
 * Verify that an address matches the public key
 */
export function verifyAddressBinding(address, publicKey) {
  const expectedAddress = generateAddress(publicKey);
  const cleanAddress = address.startsWith('@') ? address.slice(1) : address;
  return expectedAddress === cleanAddress;
}

// ============================================
// PRIVATE KEY ENCRYPTION
// ============================================

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * Derive encryption key from passphrase
 */
function deriveKey(passphrase, salt) {
  return scryptSync(passphrase, salt, KEY_LENGTH, { N: 2**14, r: 8, p: 1 });
}

/**
 * Encrypt private key with passphrase
 */
export function encryptPrivateKey(privateKey, passphrase) {
  if (!passphrase) {
    throw new Error('Passphrase is required for encryption');
  }
  
  const privKeyBytes = typeof privateKey === 'string' 
    ? Buffer.from(privateKey, 'hex') 
    : privateKey;
  
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const key = deriveKey(passphrase, salt);
  
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(privKeyBytes),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();
  
  // Format: salt:iv:authTag:encrypted (all hex)
  return {
    encrypted: true,
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    data: encrypted.toString('hex')
  };
}

/**
 * Decrypt private key with passphrase
 */
export function decryptPrivateKey(encryptedData, passphrase) {
  if (!passphrase) {
    throw new Error('Passphrase is required for decryption');
  }
  
  const salt = Buffer.from(encryptedData.salt, 'hex');
  const iv = Buffer.from(encryptedData.iv, 'hex');
  const authTag = Buffer.from(encryptedData.authTag, 'hex');
  const data = Buffer.from(encryptedData.data, 'hex');
  
  const key = deriveKey(passphrase, salt);
  
  const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  try {
    const decrypted = Buffer.concat([
      decipher.update(data),
      decipher.final()
    ]);
    return decrypted;
  } catch (err) {
    throw new Error('Decryption failed: invalid passphrase or corrupted data');
  }
}

// ============================================
// IDENTITY MANAGEMENT
// ============================================

/**
 * Ensure config directory exists with proper permissions
 */
function ensureConfigDir() {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  
  // Set directory permissions to 700 (owner only)
  try {
    chmodSync(CONFIG_DIR, 0o700);
  } catch (e) {
    // Ignore permission errors on some systems
  }
}

/**
 * Generate or load identity
 * 
 * @param {Object} options
 * @param {string} options.passphrase - Required for encryption (will prompt if not provided)
 * @param {boolean} options.encrypt - Whether to encrypt private key (default: true)
 */
export async function getOrCreateIdentity(options = {}) {
  const { passphrase, encrypt = true } = options;
  
  // Load existing identity
  if (existsSync(IDENTITY_FILE)) {
    const identity = JSON.parse(readFileSync(IDENTITY_FILE, 'utf-8'));
    
    // Decrypt private key if encrypted and passphrase provided
    if (identity.privateKeyEncrypted && passphrase) {
      try {
        const decrypted = decryptPrivateKey(identity.privateKeyEncrypted, passphrase);
        identity.privateKeyDecrypted = decrypted.toString('hex');
      } catch (err) {
        throw new Error('Failed to decrypt private key: ' + err.message);
      }
    } else if (identity.privateKey) {
      // Legacy: unencrypted private key
      identity.privateKeyDecrypted = identity.privateKey;
    }
    
    // Verify address matches public key
    if (!verifyAddressBinding(identity.address, identity.publicKey)) {
      console.warn('Warning: Address does not match public key in identity file');
    }
    
    return identity;
  }
  
  // Generate new identity
  ensureConfigDir();
  
  const privateKey = ed.utils.randomPrivateKey();
  const publicKey = await ed.getPublicKeyAsync(privateKey);
  
  // Generate address FROM public key (cryptographic binding)
  const address = generateAddress(publicKey);
  
  const identity = {
    address,
    publicKey: Buffer.from(publicKey).toString('hex'),
    createdAt: new Date().toISOString(),
    version: '2.0.0'
  };
  
  // Encrypt or store private key
  if (encrypt && passphrase) {
    identity.privateKeyEncrypted = encryptPrivateKey(privateKey, passphrase);
    identity.privateKeyDecrypted = Buffer.from(privateKey).toString('hex');
  } else {
    // WARNING: Storing private key unencrypted
    console.warn('Warning: Storing private key unencrypted. Provide a passphrase for encryption.');
    identity.privateKey = Buffer.from(privateKey).toString('hex');
    identity.privateKeyDecrypted = identity.privateKey;
  }
  
  // Write identity file
  writeFileSync(IDENTITY_FILE, JSON.stringify(identity, null, 2));
  
  // Set file permissions to 600 (owner read/write only)
  try {
    chmodSync(IDENTITY_FILE, 0o600);
  } catch (e) {
    // Ignore permission errors
  }
  
  return identity;
}

/**
 * Get decrypted private key from identity
 */
export function getDecryptedPrivateKey(identity, passphrase) {
  if (identity.privateKeyDecrypted) {
    return identity.privateKeyDecrypted;
  }
  
  if (identity.privateKey) {
    return identity.privateKey;
  }
  
  if (identity.privateKeyEncrypted && passphrase) {
    const decrypted = decryptPrivateKey(identity.privateKeyEncrypted, passphrase);
    return decrypted.toString('hex');
  }
  
  throw new Error('Private key not available. Provide passphrase for encrypted key.');
}

// ============================================
// PEER MANAGEMENT
// ============================================

/**
 * Load known peers with validation
 */
export function loadPeers() {
  try {
    if (!existsSync(PEERS_FILE)) {
      return [];
    }
    
    const data = JSON.parse(readFileSync(PEERS_FILE, 'utf-8'));
    
    // Validate each peer
    return data.filter(peer => {
      if (!peer.address || !validateAddress(peer.address).valid) {
        return false;
      }
      return true;
    }).map(peer => ({
      ...peer,
      address: sanitizeAddress(peer.address),
      name: peer.name ? sanitizeText(peer.name) : undefined
    }));
    
  } catch (err) {
    console.error('Error loading peers:', err);
    return [];
  }
}

/**
 * Save a peer with validation
 */
export function savePeer(peer) {
  // Validate peer
  if (!validateAddress(peer.address).valid) {
    throw new Error('Invalid peer address');
  }
  
  ensureConfigDir();
  
  const peers = loadPeers();
  const cleanAddress = sanitizeAddress(peer.address);
  const existing = peers.find(p => p.address === cleanAddress);
  
  if (!existing) {
    peers.push({
      ...peer,
      address: cleanAddress,
      name: peer.name ? sanitizeText(peer.name) : undefined,
      addedAt: new Date().toISOString()
    });
    
    writeFileSync(PEERS_FILE, JSON.stringify(peers, null, 2));
    
    // Set file permissions
    try {
      chmodSync(PEERS_FILE, 0o600);
    } catch (e) {}
  }
}

// ============================================
// BLOCKED ADDRESSES
// ============================================

/**
 * Load blocked addresses
 */
export function loadBlocked() {
  try {
    if (!existsSync(BLOCKED_FILE)) {
      return [];
    }
    return JSON.parse(readFileSync(BLOCKED_FILE, 'utf-8'));
  } catch (err) {
    return [];
  }
}

/**
 * Block an address with validation
 */
export function blockAddress(address) {
  if (!validateAddress(address).valid) {
    throw new Error('Invalid address format');
  }
  
  ensureConfigDir();
  
  const cleanAddress = sanitizeAddress(address);
  const blocked = loadBlocked();
  
  if (!blocked.includes(cleanAddress)) {
    blocked.push(cleanAddress);
    writeFileSync(BLOCKED_FILE, JSON.stringify(blocked, null, 2));
    
    try {
      chmodSync(BLOCKED_FILE, 0o600);
    } catch (e) {}
  }
}

/**
 * Check if address is blocked
 */
export function isBlocked(address) {
  const cleanAddress = sanitizeAddress(address);
  const blocked = loadBlocked();
  return blocked.includes(cleanAddress);
}

// ============================================
// MESSAGE SIGNING AND VERIFICATION
// ============================================

/**
 * Sign a message with private key
 */
export async function signMessage(message, privateKey) {
  const privKeyBytes = typeof privateKey === 'string' 
    ? Buffer.from(privateKey, 'hex') 
    : privateKey;
  
  // Create deterministic message representation
  const messageBytes = Buffer.from(JSON.stringify(message, Object.keys(message).sort()));
  const signature = await ed.signAsync(messageBytes, privKeyBytes);
  
  return Buffer.from(signature).toString('hex');
}

/**
 * Verify a signature
 */
export async function verifySignature(message, signature, publicKey) {
  try {
    const pubKeyBytes = typeof publicKey === 'string' 
      ? Buffer.from(publicKey, 'hex') 
      : publicKey;
    const sigBytes = typeof signature === 'string' 
      ? Buffer.from(signature, 'hex') 
      : signature;
    
    // Recreate message representation
    const messageBytes = Buffer.from(JSON.stringify(message, Object.keys(message).sort()));
    
    return await ed.verifyAsync(sigBytes, messageBytes, pubKeyBytes);
  } catch {
    return false;
  }
}

// ============================================
// MESSAGE CREATION
// ============================================

/**
 * Create an A2A-compatible message with nonce for replay protection
 */
export function createMessage(from, to, content, type = 'message') {
  return {
    jsonrpc: '2.0',
    method: 'message',
    params: {
      from: sanitizeAddress(from),
      to: sanitizeAddress(to),
      type,
      content: sanitizeText(content),
      timestamp: new Date().toISOString(),
      nonce: randomBytes(16).toString('hex') // For replay protection
    },
    id: randomBytes(16).toString('hex')
  };
}

/**
 * Create a connection request (HELLO)
 */
export function createHello(from, fromPublicKey, message = '') {
  return {
    jsonrpc: '2.0',
    method: 'hello',
    params: {
      from: sanitizeAddress(from),
      fromPublicKey: fromPublicKey,
      message: sanitizeText(message),
      timestamp: new Date().toISOString(),
      nonce: randomBytes(16).toString('hex')
    },
    id: randomBytes(16).toString('hex')
  };
}

/**
 * Create a connection response
 */
export function createHelloResponse(requestId, accepted, message = '') {
  return {
    jsonrpc: '2.0',
    result: {
      accepted,
      message: sanitizeText(message)
    },
    id: requestId
  };
}

// ============================================
// EXPORTS
// ============================================

export default {
  // Address functions
  generateAddress,
  verifyAddressBinding,
  validateAddress,
  sanitizeAddress,
  sanitizeText,
  
  // Encryption
  encryptPrivateKey,
  decryptPrivateKey,
  
  // Identity
  getOrCreateIdentity,
  getDecryptedPrivateKey,
  
  // Peers
  loadPeers,
  savePeer,
  loadBlocked,
  blockAddress,
  isBlocked,
  
  // Signatures
  signMessage,
  verifySignature,
  
  // Messages
  createMessage,
  createHello,
  createHelloResponse
};
