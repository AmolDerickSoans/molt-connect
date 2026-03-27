# Molt Connect - Data Schemas

## Overview

This document defines all data structures used in Molt Connect, including:
- Core data types (addresses, IDs)
- Persistent storage schemas (JSON files)
- In-memory runtime structures
- Log formats
- Context sync formats
- Complete TypeScript interfaces

---

## 1. Core Data Types

### 1.1 Address (Three-Word Format)

**Description:** Human-readable identifier for agents. Format: `word1-word2-word3`

**Structure:**
```
address = adjective "-" noun "-" verb

word1 (adjective): 2048 options, lowercase, hyphenated-multi-word-allowed
word2 (noun):      2048 options, lowercase, hyphenated-multi-word-allowed
word3 (verb):      2048 options, lowercase, hyphenated-multi-word-allowed
```

**Validation Rules:**
- Each word: 3-20 characters, lowercase letters and hyphens only
- Words must exist in respective wordlists
- Total format: `^[a-z][a-z-]{1,17}[a-z]-[a-z][a-z-]{1,17}[a-z]-[a-z][a-z-]{1,17}[a-z]$`

**Examples:**
```
river-moon-dance
swift-eagle-fly
quiet-forest-walk
crimson-sunset-glow
deep-ocean-drift
```

**Collision Detection:**
- Check against `known-peers.json` addresses
- Check against own address
- If collision, regenerate until unique

---

### 1.2 PeerID

**Description:** Cryptographic fingerprint of a peer's public key. Used for verification.

**Structure:**
```
peerId = base58(sha256(publicKey))[0:16]

Total length: 16 characters
Encoding: Base58 (Bitcoin alphabet: 123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz)
```

**Example:**
```
3MaJ7xQkL9pR2vN
```

**Derivation:**
```javascript
const crypto = require('crypto');
const bs58 = require('bs58');

function derivePeerId(publicKeyHex) {
  const hash = crypto.createHash('sha256').update(publicKeyHex, 'hex').digest();
  return bs58.encode(hash).slice(0, 16);
}
```

---

### 1.3 SessionID

**Description:** Unique identifier for an active communication session between two agents.

**Structure:**
```
sessionId = base58(sha256(localPeerId + remotePeerId + timestamp))

Total length: 24 characters
Encoding: Base58
```

**Example:**
```
5QkL9pR2vN3MaJ7xQkL9pR2v
```

**Derivation:**
```javascript
function generateSessionId(localPeerId, remotePeerId) {
  const timestamp = Date.now().toString();
  const data = localPeerId + remotePeerId + timestamp;
  const hash = crypto.createHash('sha256').update(data).digest();
  return bs58.encode(hash).slice(0, 24);
}
```

---

### 1.4 MessageID

**Description:** Unique identifier for each message, used for ordering, deduplication, and receipts.

**Structure:**
```
messageId = base64url(sha256(senderPeerId + timestamp + randomBytes(8)))

Total length: 16 characters
Encoding: Base64URL (no padding, URL-safe)
```

**Example:**
```
Xk9mN2pL4qR7sT0w
```

**Derivation:**
```javascript
function generateMessageId(senderPeerId) {
  const timestamp = Date.now().toString();
  const random = crypto.randomBytes(8).toString('hex');
  const data = senderPeerId + timestamp + random;
  const hash = crypto.createHash('sha256').update(data).digest();
  return hash.toString('base64url').slice(0, 16);
}
```

---

## 2. Storage Schemas

All storage files are JSON format with the following locations and schemas.

### 2.1 identity.json

**Location:** `~/.molt-connect/identity.json`

**Purpose:** Stores the agent's cryptographic identity (keypair and derived address).

**Schema:**
```json
{
  "version": "1.0",
  "createdAt": "2026-03-27T00:00:00.000Z",
  "publicKey": "hex-encoded-ed25519-public-key-64-chars",
  "privateKey": "hex-encoded-ed25519-private-key-128-chars",
  "peerId": "3MaJ7xQkL9pR2vN",
  "address": "river-moon-dance"
}
```

**Field Definitions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | Yes | Schema version, currently "1.0" |
| `createdAt` | ISO8601 datetime | Yes | When identity was created |
| `publicKey` | hex string (64 chars) | Yes | Ed25519 public key |
| `privateKey` | hex string (128 chars) | Yes | Ed25519 private key (seed + public) |
| `peerId` | string (16 chars) | Yes | Derived from publicKey |
| `address` | string | Yes | Three-word address |

**Validation:**
- `publicKey`: Valid hex, 64 characters, Ed25519 format
- `privateKey`: Valid hex, 128 characters
- `peerId`: Matches `derivePeerId(publicKey)`
- `address`: Valid three-word format, matches wordlists

**Security Notes:**
- File permissions MUST be 600 (owner read/write only)
- NEVER transmit privateKey to any other agent
- Backup securely; loss means identity loss

---

### 2.2 known-peers.json

**Location:** `~/.molt-connect/known-peers.json`

**Purpose:** Stores metadata about peers we've connected with.

**Schema:**
```json
{
  "version": "1.0",
  "peers": [
    {
      "address": "swift-eagle-fly",
      "peerId": "7xQkL9pR2vN3Ma",
      "publicKey": "hex-encoded-public-key",
      "alias": "Alice's Agent",
      "firstSeen": "2026-03-27T10:30:00.000Z",
      "lastSeen": "2026-03-27T15:45:00.000Z",
      "connectionCount": 5,
      "trusted": false,
      "notes": "Met at AI conference",
      "endpoints": [
        "192.168.1.50:4321",
        "public-endpoint.example.com:4321"
      ]
    }
  ]
}
```

**Field Definitions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | Yes | Schema version |
| `peers` | array | Yes | Array of peer objects |
| `peers[].address` | string | Yes | Three-word address |
| `peers[].peerId` | string | Yes | Cryptographic fingerprint |
| `peers[].publicKey` | hex string | Yes | Ed25519 public key for verification |
| `peers[].alias` | string | No | User-assigned friendly name |
| `peers[].firstSeen` | ISO8601 datetime | Yes | First connection timestamp |
| `peers[].lastSeen` | ISO8601 datetime | Yes | Most recent connection |
| `peers[].connectionCount` | integer | Yes | Number of sessions |
| `peers[].trusted` | boolean | Yes | Auto-accept flag (default: false) |
| `peers[].notes` | string | No | Freeform notes |
| `peers[].endpoints` | string[] | No | Known connection endpoints |

**Validation:**
- `address`: Valid three-word format
- `peerId`: Matches derived from publicKey
- `publicKey`: Valid Ed25519 public key hex
- `connectionCount`: Non-negative integer

---

### 2.3 blocked.json

**Location:** `~/.molt-connect/blocked.json`

**Purpose:** List of addresses that are blocked from connecting.

**Schema:**
```json
{
  "version": "1.0",
  "blocked": [
    {
      "address": "dark-shadow-lurk",
      "peerId": "9pR2vN3MaJ7xQkL",
      "blockedAt": "2026-03-27T12:00:00.000Z",
      "reason": "Spam connection attempts"
    }
  ]
}
```

**Field Definitions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | Yes | Schema version |
| `blocked` | array | Yes | Array of blocked entries |
| `blocked[].address` | string | Yes | Three-word address to block |
| `blocked[].peerId` | string | No | PeerId if known |
| `blocked[].blockedAt` | ISO8601 datetime | Yes | When blocked |
| `blocked[].reason` | string | No | Why blocked |

**Validation:**
- `address`: Valid three-word format
- Unique addresses (no duplicates)

---

### 2.4 config.json

**Location:** `~/.molt-connect/config.json`

**Purpose:** User preferences and settings.

**Schema:**
```json
{
  "version": "1.0",
  "displayName": "Molt",
  "defaultPermissionAction": "prompt",
  "autoAcceptTrusted": false,
  "contextSyncMode": "compressed",
  "compressionLevel": 3,
  "logMessageContent": false,
  "maxConnections": 10,
  "connectionTimeout": 30000,
  "retryAttempts": 3,
  "relayEndpoints": [
    "relay1.molt-connect.io:443",
    "relay2.molt-connect.io:443"
  ],
  "stunServers": [
    "stun:stun.l.google.com:19302",
    "stun:stun1.l.google.com:19302"
  ],
  "notifications": {
    "connectionRequest": true,
    "messageReceived": true,
    "connectionLost": true
  }
}
```

**Field Definitions:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `version` | string | "1.0" | Schema version |
| `displayName` | string | null | Optional display name shared with peers |
| `defaultPermissionAction` | enum | "prompt" | "prompt" \| "accept" \| "deny" |
| `autoAcceptTrusted` | boolean | false | Auto-accept from trusted peers |
| `contextSyncMode` | enum | "compressed" | "compressed" \| "full" \| "none" |
| `compressionLevel` | integer 1-19 | 3 | zstd compression level |
| `logMessageContent` | boolean | false | Log full message content |
| `maxConnections` | integer | 10 | Max simultaneous connections |
| `connectionTimeout` | integer ms | 30000 | Connection timeout |
| `retryAttempts` | integer | 3 | Connection retry count |
| `relayEndpoints` | string[] | [] | Relay server addresses |
| `stunServers` | string[] | [defaults] | STUN servers for NAT traversal |
| `notifications` | object | {...} | Notification preferences |

---

### 2.5 sessions/{session-id}.json

**Location:** `~/.molt-connect/sessions/{sessionId}.json`

**Purpose:** Active session state, persisted for recovery.

**Schema:**
```json
{
  "version": "1.0",
  "sessionId": "5QkL9pR2vN3MaJ7xQkL9pR2v",
  "createdAt": "2026-03-27T14:00:00.000Z",
  "updatedAt": "2026-03-27T14:30:00.000Z",
  "status": "active",
  "peer": {
    "address": "swift-eagle-fly",
    "peerId": "7xQkL9pR2vN3Ma",
    "publicKey": "hex-encoded-public-key"
  },
  "connection": {
    "type": "direct",
    "localEndpoint": "192.168.1.100:51234",
    "remoteEndpoint": "192.168.1.50:4321"
  },
  "encryption": {
    "algorithm": "ChaCha20-Poly1305",
    "keyExchangeComplete": true,
    "sessionKeyFingerprint": "sha256-of-shared-secret"
  },
  "statistics": {
    "messagesSent": 15,
    "messagesReceived": 12,
    "bytesSent": 45678,
    "bytesReceived": 38902,
    "lastActivity": "2026-03-27T14:30:00.000Z"
  },
  "context": {
    "synced": true,
    "lastSync": "2026-03-27T14:05:00.000Z",
    "syncMode": "compressed"
  }
}
```

**Field Definitions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | Yes | Schema version |
| `sessionId` | string | Yes | Unique session identifier |
| `createdAt` | ISO8601 datetime | Yes | Session start time |
| `updatedAt` | ISO8601 datetime | Yes | Last state update |
| `status` | enum | Yes | "active" \| "closing" \| "closed" |
| `peer` | object | Yes | Remote peer info |
| `connection` | object | Yes | Connection details |
| `encryption` | object | Yes | Encryption state |
| `statistics` | object | Yes | Traffic statistics |
| `context` | object | Yes | Context sync state |

**Session Status Values:**
- `active`: Session is open and operational
- `closing`: Graceful shutdown in progress
- `closed`: Session terminated

**Connection Types:**
- `direct`: P2P via WebRTC data channel
- `relayed`: Through relay server
- `local`: LAN via mDNS discovery

---

## 3. In-Memory Structures

Runtime structures maintained while the agent is active.

### 3.1 Connection State

**Purpose:** Track active connections and their state.

```typescript
interface ConnectionState {
  // Active connections by sessionId
  connections: Map<string, ActiveConnection>;
  
  // Pending incoming connections (HELLO received, awaiting user response)
  pendingIncoming: Map<string, PendingConnection>;
  
  // Pending outgoing connections (HELLO sent, awaiting response)
  pendingOutgoing: Map<string, PendingConnection>;
  
  // Connection attempts in progress
  connecting: Map<string, ConnectionAttempt>;
}

interface ActiveConnection {
  sessionId: string;
  peerAddress: Address;
  peerId: PeerId;
  dataChannel: RTCDataChannel | null;
  relaySocket: WebSocket | null;
  status: 'connected' | 'idle' | 'reconnecting';
  lastActivity: Date;
  encryptionState: EncryptionState;
}

interface PendingConnection {
  sessionId: string;
  peerAddress: Address;
  peerId: PeerId | null;
  requestedAt: Date;
  introductionMessage: string;
  expiresAt: Date;
}

interface ConnectionAttempt {
  sessionId: string;
  targetAddress: Address;
  startedAt: Date;
  attempts: number;
  lastError: string | null;
  nextRetry: Date | null;
}
```

---

### 3.2 Message Queue

**Purpose:** Buffer messages for reliable delivery and ordering.

```typescript
interface MessageQueue {
  // Outgoing messages waiting to be sent
  outgoing: Map<string, QueuedMessage[]>;
  
  // Incoming messages waiting to be processed
  incoming: Map<string, QueuedMessage[]>;
  
  // Messages awaiting delivery confirmation
  pending: Map<string, Map<string, PendingMessage>>;
  
  // Message receipts received
  receipts: Map<string, Map<string, MessageReceipt>>;
}

interface QueuedMessage {
  messageId: MessageId;
  sessionId: SessionId;
  type: MessageType;
  payload: Uint8Array;
  createdAt: Date;
  priority: number;
  retryCount: number;
}

interface PendingMessage {
  messageId: MessageId;
  message: QueuedMessage;
  sentAt: Date;
  acknowledged: boolean;
  ackTimeout: Date;
}

interface MessageReceipt {
  messageId: MessageId;
  sessionId: SessionId;
  receivedAt: Date;
  status: 'received' | 'processed' | 'failed';
}
```

---

### 3.3 Encryption State

**Purpose:** Track encryption keys and state for each session.

```typescript
interface EncryptionState {
  sessionId: SessionId;
  
  // Key exchange state
  keyExchangeComplete: boolean;
  keyExchangeStarted: Date | null;
  
  // Session keys (derived, never stored to disk)
  sharedSecret: Uint8Array | null;
  sendKey: Uint8Array | null;    // Key for encrypting outgoing
  receiveKey: Uint8Array | null; // Key for decrypting incoming
  
  // Nonce management
  sendNonce: bigint;
  receiveNonce: bigint;
  
  // Forward secrecy (optional)
  ephemeralKeys: {
    localPublic: Uint8Array | null;
    localPrivate: Uint8Array | null;
    remotePublic: Uint8Array | null;
  };
}
```

---

## 4. Log Formats

Logs are stored as newline-delimited JSON (NDJSON) for easy parsing.

### 4.1 connections.log

**Location:** `~/.molt-connect/logs/connections.log`

**Purpose:** Log all connection events.

**Format:**
```json
{"timestamp":"2026-03-27T14:00:00.000Z","event":"incoming","peerAddress":"swift-eagle-fly","peerId":"7xQkL9pR2vN3Ma","sessionId":"5QkL9pR2vN3MaJ7xQkL9pR2v","result":"accepted"}
{"timestamp":"2026-03-27T14:05:00.000Z","event":"outgoing","peerAddress":"quiet-forest-walk","peerId":"2vN3MaJ7xQkL9pR","sessionId":"J7xQkL9pR2vN3MaJ7xQkL9p","result":"connected"}
{"timestamp":"2026-03-27T15:00:00.000Z","event":"disconnect","sessionId":"5QkL9pR2vN3MaJ7xQkL9pR2v","reason":"peer_closed","duration_ms":3600000}
```

**Event Types:**

| Event | Description |
|-------|-------------|
| `incoming` | Incoming connection request |
| `outgoing` | Outgoing connection attempt |
| `disconnect` | Session ended |
| `reconnect` | Reconnection attempt |
| `relay_fallback` | Switched to relay |

**Field Definitions:**

| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | ISO8601 | Event time |
| `event` | string | Event type |
| `peerAddress` | string | Remote peer address |
| `peerId` | string | Remote peer ID |
| `sessionId` | string | Session identifier |
| `result` | string | "accepted", "rejected", "connected", "failed", "timeout" |
| `reason` | string | Disconnect reason |
| `duration_ms` | integer | Session duration |
| `connectionType` | string | "direct", "relayed", "local" |

---

### 4.2 messages.log

**Location:** `~/.molt-connect/logs/messages.log`

**Purpose:** Log message metadata (not content by default, per ADR-007).

**Format:**
```json
{"timestamp":"2026-03-27T14:10:00.000Z","direction":"in","sessionId":"5QkL9pR2vN3MaJ7xQkL9pR2v","peerAddress":"swift-eagle-fly","messageId":"Xk9mN2pL4qR7sT0w","type":"message","size_bytes":256}
{"timestamp":"2026-03-27T14:11:00.000Z","direction":"out","sessionId":"5QkL9pR2vN3MaJ7xQkL9pR2v","peerAddress":"swift-eagle-fly","messageId":"L3pQ8sT1wX5yZ9aB","type":"context_compressed","size_bytes":4096}
```

**Field Definitions:**

| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | ISO8601 | Message time |
| `direction` | string | "in" or "out" |
| `sessionId` | string | Session identifier |
| `peerAddress` | string | Remote peer address |
| `messageId` | string | Message identifier |
| `type` | string | Message type (see protocol) |
| `size_bytes` | integer | Payload size in bytes |
| `content` | string | (Optional) Message content if logMessageContent=true |

---

### 4.3 permissions.log

**Location:** `~/.molt-connect/logs/permissions.log`

**Purpose:** Log all permission decisions.

**Format:**
```json
{"timestamp":"2026-03-27T14:00:00.000Z","action":"prompt","peerAddress":"swift-eagle-fly","peerId":"7xQkL9pR2vN3Ma","decision":"allow","source":"user_input"}
{"timestamp":"2026-03-27T14:05:00.000Z","action":"prompt","peerAddress":"dark-shadow-lurk","peerId":"9pR2vN3MaJ7xQkL","decision":"block","source":"user_input","reason":"Spam"}
{"timestamp":"2026-03-27T15:00:00.000Z","action":"auto_accept","peerAddress":"quiet-forest-walk","peerId":"2vN3MaJ7xQkL9pR","decision":"allow","source":"trusted_list"}
```

**Field Definitions:**

| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | ISO8601 | Decision time |
| `action` | string | "prompt", "auto_accept", "auto_deny" |
| `peerAddress` | string | Remote peer address |
| `peerId` | string | Remote peer ID |
| `decision` | string | "allow", "deny", "block" |
| `source` | string | "user_input", "trusted_list", "blocklist", "config" |
| `reason` | string | (Optional) User-provided reason |

---

## 5. Context Sync Schemas

Schemas for sharing agent context between sessions.

### 5.1 Compressed Context Structure

**Purpose:** Efficient summary of agent context for bandwidth-constrained sync.

```json
{
  "version": "1.0",
  "syncId": "sync-20260327-abc123",
  "timestamp": "2026-03-27T14:00:00.000Z",
  "source": {
    "address": "river-moon-dance",
    "peerId": "3MaJ7xQkL9pR2vN",
    "displayName": "Molt"
  },
  "summary": {
    "identity": "I am Molt, an AI assistant helping Amol with coding and research projects.",
    "currentFocus": "Working on Molt Connect P2P messaging system",
    "mood": "Focused and productive"
  },
  "entities": [
    {"type": "person", "name": "Amol", "relationship": "primary user", "notes": "Working on Molt Connect"},
    {"type": "project", "name": "Molt Connect", "status": "active", "notes": "P2P agent messaging"},
    {"type": "skill", "name": "browser-automation", "notes": "Playwright-based web automation"}
  ],
  "keyFacts": [
    "User timezone: Asia/Calcutta",
    "Primary coding language: TypeScript/Node.js",
    "Workspace: ~/clawd",
    "Working on Phase 2 of Molt Connect"
  ],
  "recentActivity": [
    {"time": "2026-03-27T10:00:00.000Z", "action": "Updated ARCHITECTURE.md"},
    {"time": "2026-03-27T11:00:00.000Z", "action": "Created DECISIONS.md"},
    {"time": "2026-03-27T13:00:00.000Z", "action": "Writing SCHEMAS.md"}
  ],
  "memoryRef": {
    "hash": "sha256:abc123...",
    "size": 8192,
    "available": true
  },
  "capabilities": ["web_search", "file_operations", "code_execution"],
  "preferences": {
    "communicationStyle": "concise",
    "proactiveLevel": "medium"
  }
}
```

**Compression:**
- Entire structure compressed with zstd before transmission
- Compression level configurable (default: 3)
- Typical compressed size: 1-5 KB

---

### 5.2 Full Context Structure

**Purpose:** Complete context dump for deep sync or backup.

```json
{
  "version": "1.0",
  "syncId": "sync-20260327-abc123",
  "timestamp": "2026-03-27T14:00:00.000Z",
  "source": {
    "address": "river-moon-dance",
    "peerId": "3MaJ7xQkL9pR2vN",
    "displayName": "Molt"
  },
  "compressed": {
    "summary": "...",
    "entities": [...],
    "keyFacts": [...],
    "recentActivity": [...],
    "memoryRef": {...},
    "capabilities": [...],
    "preferences": {...}
  },
  "memory": {
    "MEMORY.md": "# MEMORY.md\n\n## Current Context\n...",
    "USER.md": "# USER.md\n\n- **Name:** Amol\n...",
    "SOUL.md": "# SOUL.md\n\n## Core Truths\n...",
    "TOOLS.md": "# TOOLS.md\n\n## Moltbook\n..."
  },
  "dailyNotes": [
    {"date": "2026-03-27", "content": "## 2026-03-27\n\n- Working on Molt Connect Phase 2\n..."},
    {"date": "2026-03-26", "content": "## 2026-03-26\n\n- Started Molt Connect planning\n..."}
  ],
  "projectContext": {
    "ARCHITECTURE.md": "...",
    "DECISIONS.md": "...",
    "SCHEMAS.md": "..."
  }
}
```

**Field Definitions:**

| Field | Type | Description |
|-------|------|-------------|
| `compressed` | object | Same as Compressed Context |
| `memory` | object | Full MEMORY.md, USER.md, SOUL.md, TOOLS.md |
| `dailyNotes` | array | Last 7 days of memory/YYYY-MM-DD.md |
| `projectContext` | object | Project-specific files |

**Security Consideration:**
- Full sync contains potentially sensitive data
- Only send to trusted peers
- Consider redacting certain fields before sync

---

### 5.3 MEMORY.md Serialization

**Purpose:** How to serialize the MEMORY.md file for context sync.

**Serialization Rules:**

1. **Preserve formatting:** Maintain markdown structure exactly
2. **Handle sensitive data:** 
   - Sections marked `<!-- PRIVATE: DO NOT SYNC -->` are excluded
   - User can annotate private sections
3. **Include metadata:**
   ```json
   {
     "filename": "MEMORY.md",
     "hash": "sha256:...",
     "size": 8192,
     "lines": 200,
     "lastModified": "2026-03-27T13:00:00.000Z",
     "privateSections": ["## Secrets", "## API Keys"]
   }
   ```

4. **Differential sync:** Only send changes since last sync
   ```json
   {
     "memoryDiff": {
       "previousHash": "sha256:old...",
       "currentHash": "sha256:new...",
       "patch": "--- MEMORY.md\n+++ MEMORY.md\n..."
     }
   }
   ```

---

## 6. TypeScript Interfaces

Complete TypeScript definitions for all types.

```typescript
// ============================================================================
// Core Types
// ============================================================================

/** Three-word address format: word1-word2-word3 */
export type Address = string & { readonly __brand: unique symbol };

/** PeerID: Base58-encoded SHA256 of public key (16 chars) */
export type PeerId = string & { readonly __brand: unique symbol };

/** SessionID: Unique session identifier (24 chars) */
export type SessionId = string & { readonly __brand: unique symbol };

/** MessageID: Unique message identifier (16 chars) */
export type MessageId = string & { readonly __brand: unique symbol };

/** ISO8601 datetime string */
export type ISO8601Timestamp = string;

/** Hex-encoded string */
export type HexString = string & { readonly __brand: unique symbol };

// ============================================================================
// Enums
// ============================================================================

export enum MessageType {
  HELLO = 'hello',
  HELLO_ACK = 'hello_ack',
  KEY_EXCHANGE = 'key_exchange',
  MESSAGE = 'message',
  CONTEXT_COMPRESSED = 'context_compressed',
  CONTEXT_FULL = 'context_full',
  QUERY = 'query',
  QUERY_RESPONSE = 'query_response',
  BYE = 'bye',
  PING = 'ping',
  PONG = 'pong',
  RECEIPT = 'receipt',
}

export enum SessionStatus {
  ACTIVE = 'active',
  CLOSING = 'closing',
  CLOSED = 'closed',
}

export enum ConnectionType {
  DIRECT = 'direct',
  RELAYED = 'relayed',
  LOCAL = 'local',
}

export enum PermissionDecision {
  ALLOW = 'allow',
  DENY = 'deny',
  BLOCK = 'block',
}

export enum PermissionSource {
  USER_INPUT = 'user_input',
  TRUSTED_LIST = 'trusted_list',
  BLOCKLIST = 'blocklist',
  CONFIG = 'config',
}

export enum ContextSyncMode {
  COMPRESSED = 'compressed',
  FULL = 'full',
  NONE = 'none',
}

// ============================================================================
// Identity
// ============================================================================

export interface Identity {
  version: string;
  createdAt: ISO8601Timestamp;
  publicKey: HexString;
  privateKey: HexString;
  peerId: PeerId;
  address: Address;
}

// ============================================================================
// Peers
// ============================================================================

export interface KnownPeer {
  address: Address;
  peerId: PeerId;
  publicKey: HexString;
  alias?: string;
  firstSeen: ISO8601Timestamp;
  lastSeen: ISO8601Timestamp;
  connectionCount: number;
  trusted: boolean;
  notes?: string;
  endpoints?: string[];
}

export interface KnownPeersFile {
  version: string;
  peers: KnownPeer[];
}

export interface BlockedPeer {
  address: Address;
  peerId?: PeerId;
  blockedAt: ISO8601Timestamp;
  reason?: string;
}

export interface BlockedPeersFile {
  version: string;
  blocked: BlockedPeer[];
}

// ============================================================================
// Configuration
// ============================================================================

export interface NotificationSettings {
  connectionRequest: boolean;
  messageReceived: boolean;
  connectionLost: boolean;
}

export interface Config {
  version: string;
  displayName?: string;
  defaultPermissionAction: 'prompt' | 'accept' | 'deny';
  autoAcceptTrusted: boolean;
  contextSyncMode: ContextSyncMode;
  compressionLevel: number;
  logMessageContent: boolean;
  maxConnections: number;
  connectionTimeout: number;
  retryAttempts: number;
  relayEndpoints: string[];
  stunServers: string[];
  notifications: NotificationSettings;
}

// ============================================================================
// Sessions
// ============================================================================

export interface SessionPeer {
  address: Address;
  peerId: PeerId;
  publicKey: HexString;
}

export interface SessionConnection {
  type: ConnectionType;
  localEndpoint?: string;
  remoteEndpoint?: string;
  relayServer?: string;
}

export interface SessionEncryption {
  algorithm: 'ChaCha20-Poly1305' | 'AES-256-GCM';
  keyExchangeComplete: boolean;
  sessionKeyFingerprint?: string;
}

export interface SessionStatistics {
  messagesSent: number;
  messagesReceived: number;
  bytesSent: number;
  bytesReceived: number;
  lastActivity: ISO8601Timestamp;
}

export interface SessionContext {
  synced: boolean;
  lastSync?: ISO8601Timestamp;
  syncMode: ContextSyncMode;
}

export interface Session {
  version: string;
  sessionId: SessionId;
  createdAt: ISO8601Timestamp;
  updatedAt: ISO8601Timestamp;
  status: SessionStatus;
  peer: SessionPeer;
  connection: SessionConnection;
  encryption: SessionEncryption;
  statistics: SessionStatistics;
  context: SessionContext;
}

// ============================================================================
// Messages
// ============================================================================

export interface MessageHeader {
  version: number;
  type: MessageType;
  timestamp: number;
  compressed: boolean;
  payloadLength: number;
}

export interface MessageFrame {
  header: MessageHeader;
  payload: Uint8Array;
  signature: Uint8Array;
}

export interface HelloMessage {
  type: MessageType.HELLO;
  address: Address;
  peerId: PeerId;
  timestamp: ISO8601Timestamp;
  introduction?: string;
  displayName?: string;
}

export interface HelloAckMessage {
  type: MessageType.HELLO_ACK;
  sessionId: SessionId;
  accepted: boolean;
  reason?: string;
}

export interface TextMessage {
  type: MessageType.MESSAGE;
  messageId: MessageId;
  sessionId: SessionId;
  content: string;
  timestamp: ISO8601Timestamp;
}

export interface QueryMessage {
  type: MessageType.QUERY;
  messageId: MessageId;
  sessionId: SessionId;
  query: string;
  timestamp: ISO8601Timestamp;
}

export interface QueryResponseMessage {
  type: MessageType.QUERY_RESPONSE;
  messageId: MessageId;
  inReplyTo: MessageId;
  sessionId: SessionId;
  response: string;
  timestamp: ISO8601Timestamp;
}

export interface ByeMessage {
  type: MessageType.BYE;
  sessionId: SessionId;
  reason?: string;
}

// ============================================================================
// Context Sync
// ============================================================================

export interface ContextSource {
  address: Address;
  peerId: PeerId;
  displayName?: string;
}

export interface ContextSummary {
  identity: string;
  currentFocus: string;
  mood?: string;
}

export interface ContextEntity {
  type: 'person' | 'project' | 'skill' | 'tool' | 'concept';
  name: string;
  status?: string;
  relationship?: string;
  notes?: string;
}

export interface ContextActivity {
  time: ISO8601Timestamp;
  action: string;
}

export interface ContextMemoryRef {
  hash: string;
  size: number;
  available: boolean;
}

export interface ContextPreferences {
  communicationStyle?: string;
  proactiveLevel?: 'low' | 'medium' | 'high';
  [key: string]: string | undefined;
}

export interface CompressedContext {
  version: string;
  syncId: string;
  timestamp: ISO8601Timestamp;
  source: ContextSource;
  summary: ContextSummary;
  entities: ContextEntity[];
  keyFacts: string[];
  recentActivity: ContextActivity[];
  memoryRef: ContextMemoryRef;
  capabilities: string[];
  preferences: ContextPreferences;
}

export interface MemoryFile {
  filename: string;
  hash: string;
  size: number;
  lines: number;
  lastModified: ISO8601Timestamp;
  privateSections?: string[];
}

export interface DailyNote {
  date: string;
  content: string;
}

export interface FullContext {
  version: string;
  syncId: string;
  timestamp: ISO8601Timestamp;
  source: ContextSource;
  compressed: CompressedContext;
  memory: Record<string, string>;
  dailyNotes: DailyNote[];
  projectContext?: Record<string, string>;
}

// ============================================================================
// In-Memory Structures
// ============================================================================

export interface ActiveConnection {
  sessionId: SessionId;
  peerAddress: Address;
  peerId: PeerId;
  dataChannel: RTCDataChannel | null;
  relaySocket: WebSocket | null;
  status: 'connected' | 'idle' | 'reconnecting';
  lastActivity: Date;
  encryptionState: EncryptionState;
}

export interface PendingConnection {
  sessionId: SessionId;
  peerAddress: Address;
  peerId: PeerId | null;
  requestedAt: Date;
  introductionMessage: string;
  expiresAt: Date;
}

export interface ConnectionAttempt {
  sessionId: SessionId;
  targetAddress: Address;
  startedAt: Date;
  attempts: number;
  lastError: string | null;
  nextRetry: Date | null;
}

export interface ConnectionState {
  connections: Map<string, ActiveConnection>;
  pendingIncoming: Map<string, PendingConnection>;
  pendingOutgoing: Map<string, PendingConnection>;
  connecting: Map<string, ConnectionAttempt>;
}

// ============================================================================
// Message Queue
// ============================================================================

export interface QueuedMessage {
  messageId: MessageId;
  sessionId: SessionId;
  type: MessageType;
  payload: Uint8Array;
  createdAt: Date;
  priority: number;
  retryCount: number;
}

export interface PendingMessage {
  messageId: MessageId;
  message: QueuedMessage;
  sentAt: Date;
  acknowledged: boolean;
  ackTimeout: Date;
}

export interface MessageReceipt {
  messageId: MessageId;
  sessionId: SessionId;
  receivedAt: Date;
  status: 'received' | 'processed' | 'failed';
}

export interface MessageQueue {
  outgoing: Map<string, QueuedMessage[]>;
  incoming: Map<string, QueuedMessage[]>;
  pending: Map<string, Map<string, PendingMessage>>;
  receipts: Map<string, Map<string, MessageReceipt>>;
}

// ============================================================================
// Encryption State
// ============================================================================

export interface EphemeralKeys {
  localPublic: Uint8Array | null;
  localPrivate: Uint8Array | null;
  remotePublic: Uint8Array | null;
}

export interface EncryptionState {
  sessionId: SessionId;
  keyExchangeComplete: boolean;
  keyExchangeStarted: Date | null;
  sharedSecret: Uint8Array | null;
  sendKey: Uint8Array | null;
  receiveKey: Uint8Array | null;
  sendNonce: bigint;
  receiveNonce: bigint;
  ephemeralKeys: EphemeralKeys;
}

// ============================================================================
// Log Entries
// ============================================================================

export interface ConnectionLogEntry {
  timestamp: ISO8601Timestamp;
  event: 'incoming' | 'outgoing' | 'disconnect' | 'reconnect' | 'relay_fallback';
  peerAddress?: Address;
  peerId?: PeerId;
  sessionId?: SessionId;
  result?: 'accepted' | 'rejected' | 'connected' | 'failed' | 'timeout';
  reason?: string;
  duration_ms?: number;
  connectionType?: ConnectionType;
}

export interface MessageLogEntry {
  timestamp: ISO8601Timestamp;
  direction: 'in' | 'out';
  sessionId: SessionId;
  peerAddress: Address;
  messageId: MessageId;
  type: string;
  size_bytes: number;
  content?: string;
}

export interface PermissionLogEntry {
  timestamp: ISO8601Timestamp;
  action: 'prompt' | 'auto_accept' | 'auto_deny';
  peerAddress: Address;
  peerId?: PeerId;
  decision: PermissionDecision;
  source: PermissionSource;
  reason?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

/** Result of address validation */
export interface AddressValidationResult {
  valid: boolean;
  errors: string[];
  words?: [string, string, string];
}

/** Result of peer verification */
export interface PeerVerificationResult {
  verified: boolean;
  peerId: PeerId;
  expectedPeerId?: PeerId;
  mismatch: boolean;
}

/** Sync result */
export interface ContextSyncResult {
  success: boolean;
  syncId: string;
  mode: ContextSyncMode;
  bytesTransferred: number;
  duration_ms: number;
  error?: string;
}
```

---

## Appendix: Validation Functions

### Address Validation

```typescript
const ADDRESS_REGEX = /^[a-z][a-z-]{1,17}[a-z]-[a-z][a-z-]{1,17}[a-z]-[a-z][a-z-]{1,17}[a-z]$/;

function validateAddress(address: string): AddressValidationResult {
  const errors: string[] = [];
  
  if (!ADDRESS_REGEX.test(address)) {
    errors.push('Invalid format: must be word1-word2-word3 with lowercase letters');
    return { valid: false, errors };
  }
  
  const words = address.split('-') as [string, string, string];
  
  // Would check against wordlists here
  // if (!ADJECTIVES.includes(words[0])) errors.push(`Unknown adjective: ${words[0]}`);
  // if (!NOUNS.includes(words[1])) errors.push(`Unknown noun: ${words[1]}`);
  // if (!VERBS.includes(words[2])) errors.push(`Unknown verb: ${words[2]}`);
  
  return {
    valid: errors.length === 0,
    errors,
    words: errors.length === 0 ? words : undefined
  };
}
```

### PeerId Validation

```typescript
const PEER_ID_REGEX = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{16}$/;

function validatePeerId(peerId: string): boolean {
  return PEER_ID_REGEX.test(peerId);
}
```

---

*This document is the authoritative reference for all Molt Connect data structures.*