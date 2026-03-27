# Molt Connect - Technical Specification

**Version:** 1.0.0  
**Phase:** 2 Design  
**Last Updated:** 2026-03-27

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Component Specifications](#2-component-specifications)
3. [Interfaces](#3-interfaces)
4. [Data Flow](#4-data-flow)
5. [Error Handling](#5-error-handling)
6. [Performance Requirements](#6-performance-requirements)
7. [Security Requirements](#7-security-requirements)
8. [Appendices](#8-appendices)

---

## 1. System Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MOLT CONNECT                                    │
│                        P2P Agent Communication Protocol                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        SKILL INTERFACE LAYER                         │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │   │
│   │  │   Commands   │  │  Permissions │  │    Logging   │               │   │
│   │  │  (CLI/Chat)  │  │   (Prompts)  │  │   (Audit)    │               │   │
│   │  └──────────────┘  └──────────────┘  └──────────────┘               │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                          PROTOCOL LAYER                              │   │
│   │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐     │   │
│   │  │  Message   │  │Compression │  │  Context   │  │   Framing  │     │   │
│   │  │  Types     │  │  (zstd)    │  │   Sync     │  │  (Binary)  │     │   │
│   │  └────────────┘  └────────────┘  └────────────┘  └────────────┘     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                          CORE MODULE LAYER                           │   │
│   │                                                                       │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│   │  │   ADDRESS   │  │   CRYPTO    │  │   NETWORK   │  │  PROTOCOL   │ │   │
│   │  │   MODULE    │  │   MODULE    │  │   MODULE    │  │   ENGINE    │ │   │
│   │  │             │  │             │  │             │  │             │ │   │
│   │  │ • Generator │  │ • KeyMgr    │  │ • Discovery │  │ • Messages  │ │   │
│   │  │ • Validator │  │ • Session   │  │ • NAT       │  │ • Handlers  │ │   │
│   │  │ • Address   │  │ • Signature │  │ • Relay     │  │ • Sync      │ │   │
│   │  │   Book      │  │             │  │ • Connect   │  │             │ │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │   │
│   │         │                │                │                │         │   │
│   │         └────────────────┴────────────────┴────────────────┘         │   │
│   │                              │                                        │   │
│   │                              ▼                                        │   │
│   │  ┌───────────────────────────────────────────────────────────────┐   │   │
│   │  │                     EVENT BUS (Internal)                       │   │   │
│   │  └───────────────────────────────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         PERSISTENCE LAYER                            │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │   │
│   │  │   Identity   │  │   Address    │  │    Logs &    │               │   │
│   │  │   (Keys)     │  │    Book      │  │   Sessions   │               │   │
│   │  └──────────────┘  └──────────────┘  └──────────────┘               │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │        EXTERNAL LAYER         │
                    │  ┌─────────┐  ┌─────────────┐ │
                    │  │  STUN   │  │    TURN     │ │
                    │  │ Servers │  │   Relays    │ │
                    │  └─────────┘  └─────────────┘ │
                    │  ┌─────────┐  ┌─────────────┐ │
                    │  │  mDNS   │  │    Nostr    │ │
                    │  │  (LAN)  │  │  (Internet) │ │
                    │  └─────────┘  └─────────────┘ │
                    └───────────────────────────────┘
```

### 1.2 Component Interaction Flow

```
User Action → Skill Interface → Protocol Layer → Core Modules → Network → Peer
     │              │                │               │             │
     │              │                │               │             │
     ▼              ▼                ▼               ▼             ▼
  "moltmessage   Parse CLI      Create         Encrypt +      WebRTC
   @addr hi"     command        MESSAGE        Sign           DataChannel
                               type            payload
```

**Flow Description:**

1. **User initiates** via CLI command, chat message, or API call
2. **Skill Interface** parses command, checks permissions, validates input
3. **Protocol Layer** creates appropriate message type, applies compression
4. **Crypto Module** signs message, encrypts payload with session key
5. **Network Module** establishes/uses connection to peer
6. **Transport** sends encrypted bytes over WebRTC data channel
7. **Remote Peer** receives, validates, decrypts, processes

### 1.3 Design Principles

| Principle | Description | Implementation |
|-----------|-------------|----------------|
| **Permission-First** | No communication without explicit user approval | Permission prompts for all new connections |
| **E2E Encrypted** | Only sender and receiver can read messages | Noise XK pattern, ChaCha20-Poly1305 |
| **Offline-First** | Works without internet, LAN discovery enabled | mDNS for local, relay optional |
| **Minimal Trust Surface** | No central authority, no accounts | Ed25519 identity, no server-stored keys |
| **Simple Interface** | One command to send, one prompt to accept | `moltmessage @addr msg` pattern |
| **Audit Everything** | All connections and permissions logged | Metadata-only logging, content opt-in |

### 1.4 Key Technical Decisions

| Component | Decision | ADR Reference |
|-----------|----------|---------------|
| Addressing | Three-word mnemonics (BIP39) | ADR-001 |
| Identity Keys | Ed25519 (signing) + X25519 (encryption) | ADR-002 |
| Transport | WebRTC with ICE/TURN | ADR-003 |
| Compression | zstd | ADR-004 |
| Permissions | Always prompt, with blocklist | ADR-005 |
| Architecture | Fully P2P with optional relays | ADR-006 |
| Logging | Metadata only, content opt-in | ADR-007 |

---

## 2. Component Specifications

### 2.1 Address Module

**Purpose:** Generate, validate, store, and resolve three-word addresses.

#### 2.1.1 Address Format

```
word1-word2-word3

Examples:
  molt-river-dance
  quick-fox-jump
  silent-owl-watch
```

**Word Categories:**

| Position | Category | Count | Examples |
|----------|----------|-------|----------|
| word1 | Adjective/Category | 2048 | molt, quick, silent, river |
| word2 | Noun/Entity | 2048 | river, fox, owl, moon |
| word3 | Action/Qualifier | 2048 | dance, jump, watch, glow |

**Total Combinations:** 2048³ ≈ 8.59 billion

#### 2.1.2 Address Generation Algorithm

```typescript
interface AddressGenerator {
  /**
   * Generate a new unique address
   * @param entropy - Optional entropy for deterministic generation
   * @returns Three-word address string
   */
  generate(entropy?: Buffer): string;
  
  /**
   * Generate address from public key fingerprint
   * Used for global uniqueness verification
   */
  fromPublicKey(publicKey: Buffer): string;
  
  /**
   * Check if address is unique in local address book
   */
  isUnique(address: string): boolean;
}
```

**Generation Process:**

```
1. Get 24 bytes of entropy (crypto.randomBytes or derived)
2. Split into 3 x 8-byte chunks
3. Each chunk mod 2048 → word index
4. Lookup word from BIP39 wordlist
5. Combine: word1-word2-word3
6. Check collision against local address book
7. If collision, regenerate with new entropy
```

#### 2.1.3 Address Validation

```typescript
interface AddressValidator {
  /**
   * Validate address format
   * @returns true if valid format
   */
  isValid(address: string): boolean;
  
  /**
   * Parse address into components
   */
  parse(address: string): { word1: string; word2: string; word3: string } | null;
  
  /**
   * Check if address exists in known peers
   */
  isKnown(address: string): boolean;
  
  /**
   * Verify address matches public key fingerprint
   */
  verifyFingerprint(address: string, publicKey: Buffer): boolean;
}
```

**Validation Rules:**

- Must match regex: `^[a-z]{3,}-[a-z]{3,}-[a-z]{3,}$`
- Each word must exist in BIP39 wordlist
- No consecutive identical words (e.g., `word-word-word`)

#### 2.1.4 Address Book Storage

```typescript
interface AddressBookEntry {
  address: string;           // e.g., "river-moon-dance"
  publicKey: string;         // Base64 Ed25519 public key
  nickname?: string;         // User-assigned: "Alice's agent"
  addedAt: number;          // Unix timestamp
  lastSeen?: number;        // Last successful connection
  trustLevel: 'unknown' | 'acquaintance' | 'trusted' | 'blocked';
  metadata?: {
    userAgent?: string;
    version?: string;
  };
}

interface AddressBook {
  /**
   * Add new peer to address book
   */
  add(entry: AddressBookEntry): void;
  
  /**
   * Remove peer from address book
   */
  remove(address: string): boolean;
  
  /**
   * Lookup peer by address
   */
  get(address: string): AddressBookEntry | null;
  
  /**
   * Lookup peer by public key
   */
  getByPublicKey(publicKey: string): AddressBookEntry | null;
  
  /**
   * List all entries
   */
  list(): AddressBookEntry[];
  
  /**
   * Update trust level
   */
  setTrustLevel(address: string, level: AddressBookEntry['trustLevel']): void;
}
```

**Storage Location:**

```
~/.molt-connect/
├── address-book.json       # Known peers
├── blocklist.json          # Blocked addresses
└── pending-requests.json   # Unanswered connection requests
```

---

### 2.2 Crypto Module

**Purpose:** Key management, encryption, decryption, and signing.

#### 2.2.1 Key Management

```typescript
interface KeyManager {
  /**
   * Initialize or load existing identity
   */
  initialize(): Promise<void>;
  
  /**
   * Get identity keypair
   */
  getIdentityKeypair(): { privateKey: Buffer; publicKey: Buffer };
  
  /**
   * Get encryption keypair (derived from identity)
   */
  getEncryptionKeypair(): { privateKey: Buffer; publicKey: Buffer };
  
  /**
   * Export public key for sharing
   */
  exportPublicKey(): string;  // Base64
  
  /**
   * Import peer's public key
   */
  importPeerKey(address: string, publicKey: string): void;
}
```

**Key Types:**

| Key Type | Algorithm | Size | Purpose |
|----------|-----------|------|---------|
| Identity Key | Ed25519 | 32 bytes | Signing, identity verification |
| Encryption Key | X25519 | 32 bytes | ECDH key agreement |
| Session Key | ChaCha20 | 32 bytes | Message encryption (derived) |

**Key Derivation:**

```
Identity Seed (32 bytes)
    │
    ├──▶ Ed25519 Signing Key
    │        │
    │        └──▶ Public Key (fingerprint → address)
    │
    └──▶ X25519 Encryption Key
             │
             └──▶ ECDH(peer_pub) → Shared Secret
                                          │
                                          └──▶ HKDF → Session Key
```

#### 2.2.2 Session Cryptography (Noise XK Pattern)

```typescript
interface SessionCrypto {
  /**
   * Initialize Noise XK handshake as initiator
   */
  initiateHandshake(peerPublicKey: Buffer): Promise<HandshakeState>;
  
  /**
   * Process incoming handshake message
   */
  processHandshake(message: Buffer): Promise<HandshakeResult>;
  
  /**
   * Encrypt message with session key
   */
  encrypt(plaintext: Buffer): Buffer;  // Returns ciphertext + auth tag
  
  /**
   * Decrypt message with session key
   */
  decrypt(ciphertext: Buffer): Buffer;
  
  /**
   * Rotate session key (forward secrecy)
   */
  rotateKey(): void;
}
```

**Noise XK Handshake Sequence:**

```
Initiator (A)                    Responder (B)
     │                                │
     │──── e, es ───────────────────▶│  (Message 1)
     │     [A's ephemeral key]        │  B knows A's static key
     │                                │
     │◀─── e, ee ────────────────────│  (Message 2)
     │     [B's ephemeral key]        │  Both derive shared secret
     │                                │
     │──── s, se ───────────────────▶│  (Message 3)
     │     [A proves identity]        │  B verifies A
     │                                │
     │◀═══ ENCRYPTED CHANNEL ════════▶│
```

**Message Encryption (ChaCha20-Poly1305):**

```
┌──────────────────────────────────────────────────────┐
│                    ENCRYPTED MESSAGE                  │
├──────────┬───────────┬─────────────────┬─────────────┤
│  Nonce   │ Ciphertext│   Auth Tag      │   Signature │
│ 12 bytes │  N bytes  │   16 bytes      │   64 bytes  │
└──────────┴───────────┴─────────────────┴─────────────┘
```

#### 2.2.3 Signature Manager

```typescript
interface SignatureManager {
  /**
   * Sign message with identity key
   */
  sign(message: Buffer): Buffer;
  
  /**
   * Verify signature from peer
   */
  verify(message: Buffer, signature: Buffer, publicKey: Buffer): boolean;
  
  /**
   * Sign and attach to encrypted message
   */
  signEncrypted(encrypted: Buffer, nonce: Buffer): Buffer;
}
```

---

### 2.3 Network Module

**Purpose:** Peer discovery, NAT traversal, connection management.

#### 2.3.1 Discovery Service

```typescript
interface DiscoveryService {
  /**
   * Start discovery services
   */
  start(): Promise<void>;
  
  /**
   * Stop discovery services
   */
  stop(): void;
  
  /**
   * Find peer by address
   * @returns Connection info (IP, port, TURN candidates)
   */
  discover(address: string): Promise<PeerEndpoint | null>;
  
  /**
   * Announce own presence
   */
  announce(): void;
  
  /**
   * Listen for peer discovery events
   */
  onPeerDiscovered(callback: (peer: PeerEndpoint) => void): void;
}

interface PeerEndpoint {
  address: string;
  endpoints: {
    type: 'direct' | 'lan' | 'relay';
    host: string;
    port: number;
  }[];
  publicKey: string;
  lastSeen?: number;
}
```

**Discovery Methods:**

| Method | Scope | Use Case |
|--------|-------|----------|
| mDNS/Bonjour | LAN (local network) | Home/office network discovery |
| Nostr Relays | Internet | Global peer lookup |
| DHT (optional) | Internet | Decentralized address resolution |
| Direct Exchange | Known peers | Reconnect to previous contacts |

#### 2.3.2 NAT Traversal (ICE/STUN/TURN)

```typescript
interface NATPuncher {
  /**
   * Get public endpoint via STUN
   */
  getPublicEndpoint(): Promise<{ ip: string; port: number }>;
  
  /**
   * Gather ICE candidates
   */
  gatherCandidates(): Promise<ICECandidate[]>;
  
  /**
   * Attempt direct connection via hole punching
   */
  attemptDirect(target: PeerEndpoint): Promise<Connection | null>;
  
  /**
   * Connect via TURN relay
   */
  connectViaRelay(target: PeerEndpoint, relay: RelayServer): Promise<Connection>;
}

interface ICECandidate {
  type: 'host' | 'srflx' | 'prflx' | 'relay';
  ip: string;
  port: number;
  protocol: 'udp' | 'tcp';
  relatedAddress?: string;
  relatedPort?: number;
}
```

**NAT Traversal Strategy:**

```
┌─────────────────────────────────────────────────────────────┐
│                    CONNECTION ATTEMPT                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Try Direct Connection                                   │
│     ├── Check address book for last known endpoint          │
│     └── Attempt TCP connection                              │
│             │                                               │
│             ▼                                               │
│         [Success] ──────▶ CONNECTED                         │
│             │                                               │
│          [Fail]                                             │
│             │                                               │
│             ▼                                               │
│  2. ICE Candidate Gathering                                 │
│     ├── Host candidates (local interfaces)                  │
│     ├── Server reflexive (STUN)                             │
│     └── Relay candidates (TURN)                             │
│             │                                               │
│             ▼                                               │
│  3. ICE Connectivity Checks                                 │
│     ├── Try each candidate pair                             │
│     └── Select best working path                            │
│             │                                               │
│             ▼                                               │
│         [P2P Success] ──▶ DIRECT CONNECTION                 │
│             │                                               │
│          [Fail]                                             │
│             │                                               │
│             ▼                                               │
│  4. TURN Relay Fallback                                     │
│     └── Connect via TURN server                             │
│             │                                               │
│             ▼                                               │
│         [Success] ──────▶ RELAYED CONNECTION                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 2.3.3 Connection Manager

```typescript
interface ConnectionManager {
  /**
   * Establish connection to peer
   */
  connect(address: string): Promise<Connection>;
  
  /**
   * Accept incoming connection
   */
  accept(connectionRequest: ConnectionRequest): Promise<Connection>;
  
  /**
   * Close connection
   */
  disconnect(address: string): void;
  
  /**
   * Get active connections
   */
  getActive(): Map<string, Connection>;
  
  /**
   * Handle reconnection on disconnect
   */
  onDisconnect(address: string, callback: () => void): void;
}

interface Connection {
  id: string;
  peerAddress: string;
  peerPublicKey: string;
  state: 'connecting' | 'connected' | 'disconnecting' | 'disconnected';
  transport: 'direct' | 'relayed';
  establishedAt: number;
  bytesReceived: number;
  bytesSent: number;
  
  /**
   * Send data over connection
   */
  send(data: Buffer): Promise<void>;
  
  /**
   * Register data handler
   */
  onMessage(handler: (data: Buffer) => void): void;
  
  /**
   * Close connection
   */
  close(): void;
}
```

#### 2.3.4 Relay Client

```typescript
interface RelayClient {
  /**
   * Connect to relay server
   */
  connect(relayUrl: string): Promise<void>;
  
  /**
   * Register with relay
   */
  register(address: string, publicKey: string): Promise<void>;
  
  /**
   * Request relayed connection to peer
   */
  requestConnection(peerAddress: string): Promise<RelayedConnection>;
  
  /**
   * Listen for incoming relayed connections
   */
  onConnectionRequest(handler: (request: RelayRequest) => void): void;
}

interface RelayServer {
  url: string;
  region: string;
  latency?: number;
  trusted: boolean;
}
```

**Default Relay Configuration:**

```json
{
  "relays": [
    {
      "url": "turn:molt-relay-1.example.com:3478",
      "region": "us-east",
      "trusted": true
    },
    {
      "url": "turn:molt-relay-2.example.com:3478", 
      "region": "eu-west",
      "trusted": true
    }
  ],
  "stunServers": [
    "stun:stun.l.google.com:19302",
    "stun:stun1.l.google.com:19302"
  ]
}
```

---

### 2.4 Protocol Module

**Purpose:** Message types, framing, serialization, context synchronization.

#### 2.4.1 Message Types

```typescript
enum MessageType {
  // Handshake
  HELLO = 0x01,           // Connection request
  HELLO_ACK = 0x02,       // Accept/reject connection
  
  // Key Exchange
  KEY_EXCHANGE = 0x03,    // Noise XK message
  
  // Messaging
  MESSAGE = 0x10,         // Simple text message
  QUERY = 0x11,           // Question without context
  QUERY_RESPONSE = 0x12,  // Response to query
  
  // Context Sync
  CONTEXT_COMPRESSED = 0x20,  // Summary + key facts
  CONTEXT_FULL = 0x21,        // Complete session dump
  CONTEXT_ACK = 0x22,         // Acknowledge context received
  
  // Control
  PING = 0x30,            // Keepalive
  PONG = 0x31,            // Keepalive response
  BYE = 0x32,             // Graceful disconnect
  ERROR = 0x33,           // Error notification
}

interface BaseMessage {
  version: number;        // Protocol version (currently 1)
  type: MessageType;
  timestamp: number;      // Unix milliseconds
  messageId: string;      // UUID v4
}

interface HelloMessage extends BaseMessage {
  type: MessageType.HELLO;
  senderAddress: string;
  senderPublicKey: string;
  intent: 'chat' | 'query' | 'context-sync';
  message?: string;       // Optional greeting/introduction
  metadata?: {
    userAgent: string;
    version: string;
  };
}

interface HelloAckMessage extends BaseMessage {
  type: MessageType.HELLO_ACK;
  accepted: boolean;
  reason?: string;        // If rejected, why
  sessionToken?: string;  // If accepted, for resume
}

interface TextMessage extends BaseMessage {
  type: MessageType.MESSAGE;
  content: string;
  replyTo?: string;       // messageId being replied to
}

interface QueryMessage extends BaseMessage {
  type: MessageType.QUERY;
  query: string;
  context?: 'none' | 'minimal' | 'relevant';
}

interface QueryResponseMessage extends BaseMessage {
  type: MessageType.QUERY_RESPONSE;
  queryId: string;        // Original query's messageId
  response: string;
  confidence?: number;    // 0.0 - 1.0
}

interface ContextCompressedMessage extends BaseMessage {
  type: MessageType.CONTEXT_COMPRESSED;
  summary: string;        // 500-2000 char summary
  entities: {
    type: 'person' | 'project' | 'place' | 'date' | 'topic';
    name: string;
    relevance: number;    // 0.0 - 1.0
  }[];
  keyFacts: string[];     // Bullet list of important items
  compressedData?: string; // Base64 zstd-compressed raw context
}

interface ErrorMessage extends BaseMessage {
  type: MessageType.ERROR;
  code: ErrorCode;
  message: string;
  recoverable: boolean;
  retryAfter?: number;    // Milliseconds
}

enum ErrorCode {
  INVALID_MESSAGE = 1000,
  DECRYPTION_FAILED = 1001,
  SESSION_EXPIRED = 1002,
  RATE_LIMITED = 1003,
  PAYLOAD_TOO_LARGE = 1004,
  UNSUPPORTED_VERSION = 1005,
  INTERNAL_ERROR = 1999,
}
```

#### 2.4.2 Message Framing (Binary Format)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MESSAGE FRAME                                │
├───────────┬───────────┬───────────────┬───────────┬────────────────┤
│  Version  │   Type    │   Timestamp   │Compressed │  Payload Len   │
│  1 byte   │  1 byte   │   8 bytes     │  1 byte   │   4 bytes      │
├───────────┴───────────┴───────────────┴───────────┴────────────────┤
│                                                                      │
│                          PAYLOAD (N bytes)                          │
│                    JSON-serialized message data                     │
│                    (possibly zstd-compressed)                       │
│                                                                      │
├────────────────────────────────────────────────────────────────────┤
│                       SIGNATURE (64 bytes)                          │
│                    Ed25519 signature of frame                       │
└────────────────────────────────────────────────────────────────────┘

Total Header: 15 bytes
Signature: 64 bytes
Overhead: 79 bytes + payload
```

**Frame Structure:**

| Field | Size | Description |
|-------|------|-------------|
| Version | 1 byte | Protocol version (0x01) |
| Type | 1 byte | MessageType enum value |
| Timestamp | 8 bytes | Unix milliseconds (big-endian) |
| Compressed | 1 byte | 0x00 = no, 0x01 = zstd |
| Payload Length | 4 bytes | Length of payload (big-endian) |
| Payload | N bytes | JSON message (possibly compressed) |
| Signature | 64 bytes | Ed25519 signature of header + payload |

#### 2.4.3 Compression

```typescript
interface CompressionEngine {
  /**
   * Compress data with zstd
   * @param data Raw data to compress
   * @param level Compression level (1-22, default 3)
   */
  compress(data: Buffer, level?: number): Buffer;
  
  /**
   * Decompress zstd data
   */
  decompress(data: Buffer): Buffer;
  
  /**
   * Check if compression is beneficial
   * Returns original data if compression ratio < 0.9
   */
  compressIfBeneficial(data: Buffer): Buffer;
}
```

**Compression Thresholds:**

| Payload Size | Action |
|--------------|--------|
| < 500 bytes | No compression (overhead > benefit) |
| 500 bytes - 10 KB | Compression level 1 (fast) |
| 10 KB - 100 KB | Compression level 3 (balanced) |
| > 100 KB | Compression level 9 (maximum) |

#### 2.4.4 Context Synchronization

```typescript
interface ContextSyncEngine {
  /**
   * Prepare compressed context for sharing
   */
  prepareCompressed(context: AgentContext): ContextCompressedMessage;
  
  /**
   * Prepare full context for sharing
   */
  prepareFull(context: AgentContext): ContextFullMessage;
  
  /**
   * Parse received context
   */
  parse(message: ContextCompressedMessage | ContextFullMessage): ParsedContext;
  
  /**
   * Merge received context with local
   */
  merge(local: AgentContext, received: ParsedContext): MergeResult;
}

interface AgentContext {
  // From OpenClaw MEMORY.md format
  memories: string[];
  projects: { name: string; status: string; notes: string }[];
  people: { name: string; relationship: string; notes: string }[];
  preferences: Record<string, string>;
  recentEvents: { date: string; event: string }[];
}

interface ParsedContext {
  summary: string;
  entities: Entity[];
  keyFacts: string[];
  rawContext?: AgentContext;
}

interface MergeResult {
  added: string[];
  updated: string[];
  conflicts: { local: string; received: string }[];
  skipped: string[];
}
```

---

### 2.5 Skill Interface

**Purpose:** User-facing commands, permission management, logging.

#### 2.5.1 Commands

```typescript
interface CommandRegistry {
  /**
   * Register command handler
   */
  register(name: string, handler: CommandHandler): void;
  
  /**
   * Execute command
   */
  execute(input: string): Promise<CommandResult>;
}

type CommandHandler = (args: CommandArgs) => Promise<CommandResult>;

interface CommandArgs {
  command: string;
  args: string[];
  flags: Record<string, string | boolean>;
  raw: string;
}

interface CommandResult {
  success: boolean;
  message: string;
  data?: unknown;
}
```

**Command Specification:**

| Command | Syntax | Description |
|---------|--------|-------------|
| `moltmessage` | `moltmessage @<addr> <message>` | Send text message |
| `moltmessage --context` | `moltmessage --context <compressed\|full> @<addr>` | Share context |
| `moltmessage --query` | `moltmessage --query @<addr> "<question>"` | Send query |
| `moltbook` | `moltbook` | List known peers |
| `moltbook --add` | `moltbook --add @<addr> "<nickname>"` | Add peer |
| `moltbook --remove` | `moltbook --remove @<addr>` | Remove peer |
| `moltbook --block` | `moltbook --block @<addr>` | Block peer |
| `molt-whoami` | `molt-whoami` | Show own address |
| `molt-connections` | `molt-connections` | List active connections |
| `molt-disconnect` | `molt-disconnect @<addr>` | Close connection |
| `molt-logs` | `molt-logs [--full]` | View activity logs |

#### 2.5.2 Permission Manager

```typescript
interface PermissionManager {
  /**
   * Check if peer has permission to connect
   */
  canConnect(address: string): Promise<PermissionDecision>;
  
  /**
   * Request permission for new connection
   */
  requestPermission(request: ConnectionRequest): Promise<PermissionDecision>;
  
  /**
   * Grant persistent permission (auto-accept)
   */
  grantPermission(address: string, level: TrustLevel): void;
  
  /**
   * Revoke permission
   */
  revokePermission(address: string): void;
  
  /**
   * Add to blocklist
   */
  block(address: string, reason?: string): void;
  
  /**
   * Check if blocked
   */
  isBlocked(address: string): boolean;
}

interface ConnectionRequest {
  from: {
    address: string;
    publicKey: string;
    nickname?: string;
  };
  intent: 'chat' | 'query' | 'context-sync';
  message?: string;
  timestamp: number;
}

type PermissionDecision = 
  | { action: 'allow'; trustLevel: TrustLevel }
  | { action: 'deny'; reason: string }
  | { action: 'prompt'; request: ConnectionRequest };

type TrustLevel = 'unknown' | 'acquaintance' | 'trusted' | 'blocked';
```

**Permission Flow:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    INCOMING CONNECTION                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
                  ┌─────────────────┐
                  │  Is blocked?    │
                  └────────┬────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
               YES                   NO
                │                     │
                ▼                     ▼
          Send REJECT        ┌──────────────┐
          Ignore future      │ Is trusted?  │
                             └──────┬───────┘
                                    │
                         ┌──────────┴──────────┐
                         │                     │
                        YES                   NO
                         │                     │
                         ▼                     ▼
                   Auto-accept         ┌──────────────┐
                   Send HELLO_ACK      │ Prompt user  │
                                       └──────┬───────┘
                                              │
                                    ┌─────────┴─────────┐
                                    │                   │
                               Allow                  Deny
                                    │                   │
                                    ▼                   ▼
                            Send HELLO_ACK       Send HELLO_ACK
                            (accepted)           (rejected)
```

**Permission Prompt Format:**

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔔 Connection Request                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Agent "river-moon-dance" wants to connect.                     │
│                                                                 │
│ Intent: chat                                                    │
│ Message: "Hi, I'm Alice's agent. Can we collaborate on the     │
│              project?"                                          │
│                                                                 │
│ Known peer: No (new connection)                                 │
│ Public key: a1b2c3d4e5f6...                                     │
│                                                                 │
│ [Allow] [Deny] [Block]                                          │
└─────────────────────────────────────────────────────────────────┘
```

#### 2.5.3 Logging

```typescript
interface LoggingManager {
  /**
   * Log connection event
   */
  logConnection(event: ConnectionEvent): void;
  
  /**
   * Log message event (metadata only)
   */
  logMessage(event: MessageEvent): void;
  
  /**
   * Log permission decision
   */
  logPermission(event: PermissionEvent): void;
  
  /**
   * Query logs
   */
  query(filter: LogFilter): LogEntry[];
  
  /**
   * Export logs
   */
  export(format: 'json' | 'csv'): string;
}

interface ConnectionEvent {
  timestamp: number;
  peerAddress: string;
  direction: 'incoming' | 'outgoing';
  action: 'attempt' | 'established' | 'closed' | 'failed';
  transport?: 'direct' | 'relayed';
  duration?: number;  // ms, for closed
  error?: string;
}

interface MessageEvent {
  timestamp: number;
  peerAddress: string;
  direction: 'sent' | 'received';
  type: MessageType;
  size: number;  // bytes
  messageId: string;
  // Content NOT logged by default
}

interface PermissionEvent {
  timestamp: number;
  peerAddress: string;
  action: 'prompt' | 'allow' | 'deny' | 'block';
  reason?: string;
}
```

**Log File Structure:**

```
~/.molt-connect/logs/
├── connections.log    # JSON Lines, one event per line
├── messages.log       # JSON Lines, metadata only
├── permissions.log    # JSON Lines, all decisions
└── errors.log         # JSON Lines, errors and exceptions
```

**Log Rotation:**

- Daily rotation at 00:00 UTC
- Keep 30 days of logs
- Compress logs older than 7 days (zstd)
- Max log file size: 10 MB

---

## 3. Interfaces

### 3.1 Module Interfaces

#### 3.1.1 Address Module Interface

```typescript
interface IAddressModule {
  // Generator
  generateAddress(): string;
  addressFromPublicKey(publicKey: Buffer): string;
  
  // Validator
  validateAddress(address: string): boolean;
  parseAddress(address: string): AddressComponents | null;
  
  // Address Book
  getKnownPeers(): AddressBookEntry[];
  getPeer(address: string): AddressBookEntry | null;
  addPeer(entry: AddressBookEntry): void;
  removePeer(address: string): boolean;
  updatePeerTrust(address: string, level: TrustLevel): void;
  
  // Blocklist
  blockAddress(address: string, reason?: string): void;
  unblockAddress(address: string): void;
  isBlocked(address: string): boolean;
}
```

#### 3.1.2 Crypto Module Interface

```typescript
interface ICryptoModule {
  // Identity
  getIdentityPublicKey(): Buffer;
  getEncryptionPublicKey(): Buffer;
  exportPublicKeyBase64(): string;
  
  // Session Management
  createSession(peerPublicKey: Buffer): Promise<Session>;
  getSession(sessionId: string): Session | null;
  closeSession(sessionId: string): void;
  
  // Encryption/Decryption
  encrypt(sessionId: string, plaintext: Buffer): Buffer;
  decrypt(sessionId: string, ciphertext: Buffer): Buffer;
  
  // Signing
  sign(data: Buffer): Buffer;
  verify(data: Buffer, signature: Buffer, publicKey: Buffer): boolean;
}
```

#### 3.1.3 Network Module Interface

```typescript
interface INetworkModule {
  // Discovery
  startDiscovery(): Promise<void>;
  stopDiscovery(): void;
  discoverPeer(address: string): Promise<PeerEndpoint | null>;
  announcePresence(): void;
  
  // Connection
  connect(address: string): Promise<Connection>;
  disconnect(address: string): void;
  getActiveConnections(): Map<string, Connection>;
  
  // Event Handlers
  onConnectionRequest(handler: (request: ConnectionRequest) => void): void;
  onPeerDiscovered(handler: (peer: PeerEndpoint) => void): void;
  onConnectionLost(handler: (address: string) => void): void;
}
```

#### 3.1.4 Protocol Module Interface

```typescript
interface IProtocolModule {
  // Message Creation
  createHelloMessage(address: string, intent: string, message?: string): HelloMessage;
  createTextMessage(content: string, replyTo?: string): TextMessage;
  createQueryMessage(query: string, context?: string): QueryMessage;
  createErrorMessage(code: ErrorCode, message: string): ErrorMessage;
  
  // Serialization
  serialize(message: BaseMessage): Buffer;
  deserialize(data: Buffer): BaseMessage;
  
  // Compression
  compress(data: Buffer): Buffer;
  decompress(data: Buffer): Buffer;
  
  // Context
  prepareContext(context: AgentContext, mode: 'compressed' | 'full'): BaseMessage;
  parseContext(message: BaseMessage): ParsedContext;
  
  // Validation
  validate(message: BaseMessage): boolean;
}
```

#### 3.1.5 Skill Interface

```typescript
interface ISkillInterface {
  // Commands
  registerCommand(name: string, handler: CommandHandler): void;
  executeCommand(input: string): Promise<CommandResult>;
  
  // Permissions
  requestPermission(request: ConnectionRequest): Promise<PermissionDecision>;
  checkPermission(address: string): PermissionDecision;
  
  // UI
  displayPrompt(prompt: PermissionPrompt): Promise<UserResponse>;
  displayMessage(message: string, type: 'info' | 'success' | 'error'): void;
  
  // Logging
  log(event: LogEvent): void;
  getLogs(filter?: LogFilter): LogEntry[];
}
```

### 3.2 Inter-Module Communication

```
┌─────────────────────────────────────────────────────────────────┐
│                        EVENT BUS                                 │
│                   (Internal communication)                       │
└─────────────────────────────────────────────────────────────────┘
          ▲              ▲              ▲              ▲
          │              │              │              │
          │              │              │              │
    ┌─────┴─────┐  ┌─────┴─────┐  ┌─────┴─────┐  ┌─────┴─────┐
    │  Address  │  │   Crypto  │  │  Network  │  │  Protocol │
    │  Module   │  │   Module  │  │   Module  │  │   Module  │
    └───────────┘  └───────────┘  └───────────┘  └───────────┘
```

**Event Types:**

```typescript
enum EventType {
  // Address Events
  PEER_DISCOVERED = 'peer:discovered',
  PEER_ADDED = 'peer:added',
  PEER_REMOVED = 'peer:removed',
  PEER_BLOCKED = 'peer:blocked',
  
  // Crypto Events
  SESSION_CREATED = 'session:created',
  SESSION_CLOSED = 'session:closed',
  KEY_ROTATED = 'key:rotated',
  
  // Network Events
  CONNECTION_REQUEST = 'connection:request',
  CONNECTION_ESTABLISHED = 'connection:established',
  CONNECTION_LOST = 'connection:lost',
  CONNECTION_FAILED = 'connection:failed',
  
  // Protocol Events
  MESSAGE_RECEIVED = 'message:received',
  MESSAGE_SENT = 'message:sent',
  HANDSHAKE_COMPLETE = 'handshake:complete',
  
  // Permission Events
  PERMISSION_REQUESTED = 'permission:requested',
  PERMISSION_GRANTED = 'permission:granted',
  PERMISSION_DENIED = 'permission:denied',
}

interface Event {
  type: EventType;
  timestamp: number;
  data: unknown;
  source: string;  // Module name
}
```

### 3.3 External APIs

#### 3.3.1 Skill API (OpenClaw Integration)

```typescript
/**
 * Molt Connect Skill - OpenClaw Integration
 */
export class MoltConnectSkill implements ISkill {
  name = 'molt-connect';
  version = '1.0.0';
  
  /**
   * Called by OpenClaw when skill is loaded
   */
  async initialize(config: SkillConfig): Promise<void>;
  
  /**
   * Register commands with OpenClaw
   */
  getCommands(): CommandDefinition[];
  
  /**
   * Handle incoming command
   */
  handleCommand(command: string, args: string[]): Promise<string>;
  
  /**
   * Called when OpenClaw is shutting down
   */
  async shutdown(): Promise<void>;
}

interface SkillConfig {
  storagePath: string;      // ~/.molt-connect/
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  permissions: {
    autoAcceptKnownPeers: boolean;
    promptForNewPeers: boolean;
  };
  network: {
    enableDiscovery: boolean;
    relayServers: string[];
    stunServers: string[];
  };
}
```

#### 3.3.2 Programmatic API

```typescript
/**
 * Molt Connect Client API
 * For use by other skills or programmatic consumers
 */
export class MoltConnectClient {
  /**
   * Get own address
   */
  get address(): string;
  
  /**
   * Send a message to a peer
   */
  sendMessage(peerAddress: string, content: string): Promise<MessageResult>;
  
  /**
   * Send a query to a peer
   */
  query(peerAddress: string, query: string): Promise<QueryResult>;
  
  /**
   * Share context with a peer
   */
  shareContext(peerAddress: string, context: AgentContext, mode: 'compressed' | 'full'): Promise<void>;
  
  /**
   * Get active connections
   */
  getConnections(): ConnectionInfo[];
  
  /**
   * Disconnect from a peer
   */
  disconnect(peerAddress: string): void;
  
  /**
   * Event subscription
   */
  on(event: string, handler: EventHandler): void;
  off(event: string, handler: EventHandler): void;
}

// Usage example:
const client = new MoltConnectClient();

await client.sendMessage('river-moon-dance', 'Hello from Molt!');
```

---

## 4. Data Flow

### 4.1 Connection Establishment Sequence

```
Agent A (Initiator)                                    Agent B (Responder)
      │                                                       │
      │                                                       │
      │  ┌─────────────────────────────────┐                │
      │  │ 1. DISCOVER PEER                │                │
      │  │    - Check address book         │                │
      │  │    - Query discovery service    │                │
      │  │    - Get peer endpoint          │                │
      │  └─────────────────────────────────┘                │
      │                                                       │
      │  ┌─────────────────────────────────┐                │
      │  │ 2. INITIATE CONNECTION          │                │
      │  │    - Gather ICE candidates      │                │
      │  │    - Create HELLO message       │                │
      │  │    - Sign HELLO                 │                │
      │  └─────────────────────────────────┘                │
      │                                                       │
      │──────────── HELLO (encrypted) ─────────────────────▶│
      │                                                       │
      │                                       ┌──────────────┴──────────────┐
      │                                       │ 3. PROCESS HELLO            │
      │                                       │    - Decrypt                │
      │                                       │    - Validate signature     │
      │                                       │    - Check blocklist        │
      │                                       │    - Prompt user            │
      │                                       └──────────────┬──────────────┘
      │                                                       │
      │◀──────────── HELLO_ACK (accept/reject) ─────────────│
      │                                                       │
      │  ┌─────────────────────────────────┐                │
      │  │ 4. KEY EXCHANGE (Noise XK)      │                │
      │  │    if accepted                  │                │
      │  └─────────────────────────────────┘                │
      │                                                       │
      │──────────── KEY_EXCHANGE (msg 1) ──────────────────▶│
      │◀─────────── KEY_EXCHANGE (msg 2) ───────────────────│
      │──────────── KEY_EXCHANGE (msg 3) ──────────────────▶│
      │                                                       │
      │  ┌─────────────────────────────────┐                │
      │  │ 5. SECURE CHANNEL ESTABLISHED   │                │
      │  │    - Derive session key         │                │
      │  │    - Ready for messages         │                │
      │  └─────────────────────────────────┘                │
      │                                                       │
      │◀═══════════ ENCRYPTED MESSAGE CHANNEL ═════════════▶│
      │                                                       │
```

### 4.2 Message Send/Receive Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      SEND MESSAGE FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User Input                                                     │
│      │                                                          │
│      ▼                                                          │
│  ┌──────────────┐                                              │
│  │ Parse Input  │  "moltmessage @river-moon-dance Hello"       │
│  └──────┬───────┘                                              │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                              │
│  │ Validate     │  - Address format OK?                        │
│  │ Address      │  - Peer known?                               │
│  └──────┬───────┘                                              │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                              │
│  │ Check        │  - Connection active?                        │
│  │ Connection   │  - If not, establish                         │
│  └──────┬───────┘                                              │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                              │
│  │ Create       │  - Generate messageId                        │
│  │ Message      │  - Set timestamp                             │
│  └──────┬───────┘                                              │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                              │
│  │ Serialize    │  - JSON encode                               │
│  │ Message      │  - Check compression threshold               │
│  └──────┬───────┘                                              │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                              │
│  │ Compress     │  - zstd if beneficial                        │
│  │ (optional)   │                                              │
│  └──────┬───────┘                                              │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                              │
│  │ Encrypt      │  - ChaCha20-Poly1305                         │
│  │ Message      │  - With session key                          │
│  └──────┬───────┘                                              │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                              │
│  │ Sign         │  - Ed25519 signature                         │
│  │ Message      │  - Append signature                          │
│  └──────┬───────┘                                              │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                              │
│  │ Frame        │  - Add header bytes                          │
│  │ Message      │  - Calculate length                          │
│  └──────┬───────┘                                              │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                              │
│  │ Send via     │  - WebRTC data channel                       │
│  │ Transport    │  - Or relayed connection                     │
│  └──────┬───────┘                                              │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                              │
│  │ Log Event    │  - Metadata only (not content)               │
│  └──────────────┘                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   RECEIVE MESSAGE FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Data Channel Event                                             │
│      │                                                          │
│      ▼                                                          │
│  ┌──────────────┐                                              │
│  │ Receive      │  - Buffer from transport                     │
│  │ Raw Data     │                                              │
│  └──────┬───────┘                                              │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                              │
│  │ Parse Frame  │  - Extract header                            │
│  │              │  - Validate length                           │
│  └──────┬───────┘                                              │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                              │
│  │ Verify       │  - Check Ed25519 signature                   │
│  │ Signature    │  - Against peer's public key                 │
│  └──────┬───────┘                                              │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                              │
│  │ Decrypt      │  - ChaCha20-Poly1305                         │
│  │ Payload      │  - With session key                          │
│  └──────┬───────┘                                              │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                              │
│  │ Decompress   │  - If compressed flag set                    │
│  │ (if needed)  │                                              │
│  └──────┬───────┘                                              │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                              │
│  │ Deserialize  │  - Parse JSON                                │
│  │ Message      │  - Validate structure                        │
│  └──────┬───────┘                                              │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                              │
│  │ Validate     │  - Check message type                        │
│  │ Message      │  - Validate fields                           │
│  └──────┬───────┘                                              │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                              │
│  │ Route by     │  - MESSAGE → Display to user                 │
│  │ Type         │  - QUERY → Process and respond               │
│  │              │  - CONTEXT → Parse and store                 │
│  └──────┬───────┘                                              │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                              │
│  │ Log Event    │  - Metadata only                             │
│  └──────────────┘                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Permission Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    PERMISSION DECISION TREE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                   Incoming Connection Request                   │
│                            │                                    │
│                            ▼                                    │
│              ┌────────────────────────┐                        │
│              │   Is address blocked?  │                        │
│              └────────────┬───────────┘                        │
│                           │                                     │
│               ┌───────────┴───────────┐                        │
│               │                       │                        │
│              YES                     NO                        │
│               │                       │                        │
│               ▼                       ▼                        │
│        ┌─────────────┐    ┌────────────────────┐              │
│        │ Reject      │    │ Check trust level  │              │
│        │ connection  │    └─────────┬──────────┘              │
│        └─────────────┘              │                          │
│                          ┌─────────┴─────────┐                │
│                          │                   │                │
│                     Trusted?              Unknown              │
│                          │                   │                │
│                          ▼                   ▼                │
│                   ┌─────────────┐    ┌─────────────────────┐  │
│                   │ Auto-accept │    │ Prompt user         │  │
│                   │ connection  │    │ [Allow] [Deny]      │  │
│                   └─────────────┘    │ [Block]             │  │
│                                      └──────────┬──────────┘  │
│                                                 │              │
│                                    ┌────────────┼───────────┐ │
│                                    │            │           │ │
│                                Allow         Deny        Block│
│                                    │            │           │ │
│                                    ▼            ▼           ▼ │
│                             ┌──────────┐ ┌──────────┐ ┌──────┐│
│                             │Accept    │ │Reject    │ │Block ││
│                             │connection│ │connection│ │peer  ││
│                             └──────────┘ └──────────┘ └──────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Error Handling

### 5.1 Error Types

```typescript
enum ErrorCategory {
  // Address Errors (1000-1099)
  ADDRESS_INVALID = 1000,
  ADDRESS_NOT_FOUND = 1001,
  ADDRESS_COLLISION = 1002,
  ADDRESS_BLOCKED = 1003,
  
  // Crypto Errors (1100-1199)
  KEY_GENERATION_FAILED = 1100,
  ENCRYPTION_FAILED = 1101,
  DECRYPTION_FAILED = 1102,
  SIGNATURE_INVALID = 1103,
  SESSION_EXPIRED = 1104,
  
  // Network Errors (1200-1299)
  CONNECTION_FAILED = 1200,
  CONNECTION_TIMEOUT = 1201,
  CONNECTION_LOST = 1202,
  NAT_TRAVERSAL_FAILED = 1203,
  RELAY_UNAVAILABLE = 1204,
  DISCOVERY_FAILED = 1205,
  
  // Protocol Errors (1300-1399)
  MESSAGE_INVALID = 1300,
  MESSAGE_TOO_LARGE = 1301,
  COMPRESSION_FAILED = 1302,
  DECOMPRESSION_FAILED = 1303,
  UNSUPPORTED_VERSION = 1304,
  UNKNOWN_MESSAGE_TYPE = 1305,
  
  // Permission Errors (1400-1499)
  PERMISSION_DENIED = 1400,
  PERMISSION_REQUIRED = 1401,
  NOT_AUTHORIZED = 1402,
  
  // Internal Errors (1900-1999)
  INTERNAL_ERROR = 1900,
  STORAGE_ERROR = 1901,
  CONFIGURATION_ERROR = 1902,
}

interface MoltError extends Error {
  code: ErrorCategory;
  category: string;
  recoverable: boolean;
  retryAfter?: number;
  details?: Record<string, unknown>;
}
```

### 5.2 Recovery Strategies

| Error | Strategy | User Action |
|-------|----------|-------------|
| ADDRESS_NOT_FOUND | Prompt for correct address or retry discovery | Verify address spelling, check if peer is online |
| CONNECTION_FAILED | Exponential backoff retry (3 attempts) | Check network, try again later |
| CONNECTION_TIMEOUT | Retry with longer timeout, suggest relay | Check network, enable relay |
| NAT_TRAVERSAL_FAILED | Fallback to TURN relay | Enable relay in settings |
| DECRYPTION_FAILED | Re-establish session (key exchange) | Reconnect to peer |
| SESSION_EXPIRED | Re-initiate handshake | Automatic reconnect |
| RELAY_UNAVAILABLE | Try alternative relay, or direct connection | Configure backup relay |
| MESSAGE_TOO_LARGE | Split into chunks or compress | Reduce message size |
| PERMISSION_DENIED | Log and inform user | No action needed (intentional) |

**Retry Strategy:**

```typescript
interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;      // ms
  maxDelay: number;       // ms
  backoffMultiplier: number;
}

const defaultRetryConfig: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
};

// Retry delays: 1s, 2s, 4s (exponential backoff)
```

### 5.3 User-Facing Error Messages

| Error Code | User Message |
|------------|--------------|
| ADDRESS_INVALID | "Invalid address format. Use: word-word-word" |
| ADDRESS_NOT_FOUND | "Could not find peer 'river-moon-dance'. Check if they're online." |
| ADDRESS_BLOCKED | "Cannot connect: 'river-moon-dance' is blocked." |
| CONNECTION_FAILED | "Failed to connect to 'river-moon-dance'. Please try again." |
| CONNECTION_TIMEOUT | "Connection timed out. The peer may be offline or behind a restrictive firewall." |
| NAT_TRAVERSAL_FAILED | "Cannot establish direct connection. Try enabling relay mode." |
| RELAY_UNAVAILABLE | "No relay servers available. Please check your network or configure a relay." |
| DECRYPTION_FAILED | "Could not decrypt message. The session may have expired." |
| PERMISSION_DENIED | "Connection rejected by peer." |
| MESSAGE_TOO_LARGE | "Message too large (max 1MB). Consider splitting or compressing." |

---

## 6. Performance Requirements

### 6.1 Latency Targets

| Operation | Target | Maximum Acceptable |
|-----------|--------|-------------------|
| Message send (local) | < 10ms | 50ms |
| Message send (P2P direct) | < 100ms | 500ms |
| Message send (relayed) | < 300ms | 1000ms |
| Connection establishment | < 2s | 5s |
| Key exchange (Noise XK) | < 500ms | 2s |
| Context sync (compressed) | < 1s | 3s |
| Context sync (full) | < 5s | 15s |
| Discovery (LAN/mDNS) | < 100ms | 500ms |
| Discovery (Internet/Nostr) | < 2s | 5s |

### 6.2 Throughput Targets

| Metric | Target | Maximum |
|--------|--------|---------|
| Messages per second | 100 | 1000 |
| Concurrent connections | 10 | 50 |
| Message size (uncompressed) | 1 KB | 1 MB |
| Context size (compressed) | 10 KB | 100 KB |
| Context size (full) | 100 KB | 10 MB |
| Bandwidth per connection | 100 KB/s | 1 MB/s |

### 6.3 Resource Limits

| Resource | Limit | Notes |
|----------|-------|-------|
| Memory (baseline) | 50 MB | Idle state |
| Memory (per connection) | 5 MB | Active session |
| CPU (baseline) | < 1% | Idle state |
| CPU (per message) | < 10ms | Encrypt/sign/send |
| Disk (logs) | 100 MB | Before rotation |
| Disk (keys/cache) | 10 MB | Identity + address book |
| File descriptors | 100 | Connections + relay |

### 6.4 Optimization Guidelines

1. **Connection Pooling**: Reuse connections for multiple messages
2. **Message Batching**: Combine small messages when possible
3. **Lazy Encryption**: Only encrypt when ready to send
4. **Compression Threshold**: Only compress if ratio < 0.9
5. **Session Caching**: Cache derived session keys
6. **Relay Selection**: Choose lowest-latency relay automatically

---

## 7. Security Requirements

### 7.1 Threat Model

| Threat Actor | Capability | Mitigation |
|--------------|------------|------------|
| **Network Attacker** | Eavesdrop, modify, inject packets | E2E encryption, message signatures |
| **Man-in-the-Middle** | Intercept and relay messages | Noise XK mutual authentication |
| **Malicious Peer** | Send malicious messages, spam | Permission prompts, blocklist, rate limiting |
| **Relay Operator** | Observe traffic patterns | E2E encryption (can't read content) |
| **Local Attacker** | Access device filesystem | Encrypted key storage (future: OS keychain) |
| **Social Attacker** | Trick user into accepting malicious peer | Clear permission prompts, verify address |

**Out of Scope:**

- Physical device theft (rely on device security)
- Zero-day exploits in dependencies
- User intentionally sharing private keys
- Nation-state level adversaries with quantum computers

### 7.2 Security Guarantees

| Guarantee | Description | Implementation |
|-----------|-------------|----------------|
| **Confidentiality** | Only sender and receiver can read messages | ChaCha20-Poly1305 encryption |
| **Authenticity** | Messages are from claimed sender | Ed25519 signatures |
| **Integrity** | Messages cannot be modified in transit | Poly1305 MAC, signature verification |
| **Forward Secrecy** | Compromised long-term key doesn't expose past messages | Ephemeral keys in Noise XK |
| **Replay Protection** | Old messages cannot be replayed | Timestamp validation, messageId uniqueness |
| **Peer Authentication** | Peers are who they claim to be | Public key fingerprint → address mapping |

### 7.3 Security Implementation

#### 7.3.1 Key Storage

```
~/.molt-connect/
├── identity.json        # Ed25519 seed (encrypted at rest)
│   └── encrypted with user password or OS keychain
├── known-peers.json     # Peer public keys (plaintext, public info)
└── sessions/            # Session keys (in-memory only, not persisted)
```

**Key Protection:**

- Identity seed encrypted with user-provided passphrase (optional)
- If no passphrase, rely on filesystem permissions (mode 0600)
- Future: integrate with OS keychain (Keychain on macOS, Secret Service on Linux)

#### 7.3.2 Message Validation

```typescript
function validateMessage(message: BaseMessage, peerPublicKey: Buffer): boolean {
  // 1. Check timestamp is within acceptable range
  const now = Date.now();
  const messageTime = message.timestamp;
  if (Math.abs(now - messageTime) > 300000) { // 5 minutes
    return false; // Reject old or future-dated messages
  }
  
  // 2. Check messageId is unique (prevent replay)
  if (seenMessageIds.has(message.messageId)) {
    return false;
  }
  seenMessageIds.add(message.messageId);
  
  // 3. Verify signature
  const signatureValid = verifySignature(message, peerPublicKey);
  if (!signatureValid) {
    return false;
  }
  
  // 4. Validate message structure
  if (!validateStructure(message)) {
    return false;
  }
  
  return true;
}
```

#### 7.3.3 Rate Limiting

```typescript
interface RateLimitConfig {
  maxMessagesPerMinute: number;
  maxConnectionsPerHour: number;
  maxBytesPerMinute: number;
}

const defaultRateLimits: RateLimitConfig = {
  maxMessagesPerMinute: 60,
  maxConnectionsPerHour: 10,
  maxBytesPerMinute: 1024 * 1024, // 1 MB
};
```

### 7.4 Known Limitations

| Limitation | Risk | Mitigation |
|------------|------|------------|
| **No global address registry** | Address collisions possible | Collision detection, verify via public key |
| **Relay sees traffic metadata** | Traffic analysis possible | E2E encryption hides content |
| **Local key storage** | Vulnerable to local attacker | Encrypt keys at rest (optional) |
| **No anonymous mode** | Peers know each other's addresses | By design for accountability |
| **No forward secrecy per message** | Session key compromise reveals session | Rotate session key periodically |
| **Replay window 5 minutes** | Clock skew issues | NTP sync recommended |

---

## 8. Appendices

### 8.1 Configuration Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "identity": {
      "type": "object",
      "properties": {
        "address": { "type": "string" },
        "publicKey": { "type": "string" }
      }
    },
    "network": {
      "type": "object",
      "properties": {
        "enableDiscovery": { "type": "boolean", "default": true },
        "enableRelay": { "type": "boolean", "default": true },
        "stunServers": {
          "type": "array",
          "items": { "type": "string" },
          "default": ["stun:stun.l.google.com:19302"]
        },
        "relayServers": {
          "type": "array",
          "items": { 
            "type": "object",
            "properties": {
              "url": { "type": "string" },
              "region": { "type": "string" },
              "trusted": { "type": "boolean" }
            }
          }
        },
        "connectionTimeout": { "type": "number", "default": 30000 },
        "idleTimeout": { "type": "number", "default": 300000 }
      }
    },
    "permissions": {
      "type": "object",
      "properties": {
        "autoAcceptKnownPeers": { "type": "boolean", "default": false },
        "promptForNewPeers": { "type": "boolean", "default": true }
      }
    },
    "logging": {
      "type": "object",
      "properties": {
        "level": { 
          "type": "string", 
          "enum": ["debug", "info", "warn", "error"],
          "default": "info"
        },
        "logContent": { "type": "boolean", "default": false },
        "retentionDays": { "type": "number", "default": 30 }
      }
    }
  }
}
```

### 8.2 Dependencies

```json
{
  "name": "molt-connect",
  "version": "1.0.0",
  "dependencies": {
    "libsodium-wrappers": "^0.7.13",
    "zstd-codec": "^0.1.4",
    "wrtc": "^0.4.7",
    "multicast-dns": "^7.2.5",
    "nostr-tools": "^1.0.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "@types/node": "^20.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 8.3 File Structure

```
~/clawd/molt-connect/
├── src/
│   ├── address/
│   │   ├── index.ts
│   │   ├── generator.ts
│   │   ├── validator.ts
│   │   └── address-book.ts
│   ├── crypto/
│   │   ├── index.ts
│   │   ├── key-manager.ts
│   │   ├── session-crypto.ts
│   │   └── signature.ts
│   ├── network/
│   │   ├── index.ts
│   │   ├── discovery.ts
│   │   ├── nat-puncher.ts
│   │   ├── relay-client.ts
│   │   └── connection-manager.ts
│   ├── protocol/
│   │   ├── index.ts
│   │   ├── messages.ts
│   │   ├── framing.ts
│   │   ├── compression.ts
│   │   └── context-sync.ts
│   ├── skill/
│   │   ├── index.ts
│   │   ├── commands.ts
│   │   ├── permissions.ts
│   │   └── logging.ts
│   ├── event-bus.ts
│   └── index.ts
├── tests/
│   ├── address.test.ts
│   ├── crypto.test.ts
│   ├── network.test.ts
│   ├── protocol.test.ts
│   └── integration.test.ts
├── SKILL.md
├── package.json
├── tsconfig.json
├── README.md
└── CONFIG.example.json
```

### 8.4 Glossary

| Term | Definition |
|------|------------|
| **Address** | Three-word mnemonic identifier (e.g., `river-moon-dance`) |
| **Agent** | An AI assistant instance running Molt Connect |
| **Peer** | Another agent on the network |
| **Session** | An established encrypted communication channel with a peer |
| **Relay** | A server that forwards traffic when direct P2P is not possible |
| **STUN** | Session Traversal Utilities for NAT - helps discover public endpoint |
| **TURN** | Traversal Using Relays around NAT - relay server for difficult NATs |
| **ICE** | Interactive Connectivity Establishment - framework for NAT traversal |
| **Noise XK** | A cryptographic handshake pattern providing mutual authentication |
| **E2E** | End-to-End (encryption) |
| **mDNS** | Multicast DNS - for local network discovery |
| **Nostr** | A decentralized protocol for relayed messaging |
| **DHT** | Distributed Hash Table - for decentralized peer lookup |

### 8.5 Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-03-27 | Initial specification for Phase 2 Design |

---

**Document Status:** Complete  
**Next Phase:** Implementation (Phase 3)  
**Estimated Implementation Time:** 8-12 weeks