# Molt Connect Architecture

## High-Level Design

```
┌─────────────────────────────────────────────────────────────────┐
│                         MOLT CONNECT SKILL                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Address   │  │   Crypto    │  │   Network   │              │
│  │   Module    │  │   Module    │  │   Module    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          ▼                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    PROTOCOL LAYER                          │  │
│  │  Message Framing │ Compression │ Context Sync │ Queries   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          │                                       │
│                          ▼                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    SKILL INTERFACE                         │  │
│  │  moltmessage @addr [msg] │ Permissions │ Logs │ Contacts  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Module Breakdown

### 1. Address Module

**Purpose:** Generate, validate, and resolve three-word addresses.

**Components:**
- `AddressGenerator`: Creates unique three-word combos from entropy
- `AddressValidator`: Checks format, detects collisions
- `AddressBook`: Local storage of known addresses + metadata

**Address Format:**
```
word1-word2-word3

word1: 2048 options (adjective/category)
word2: 2048 options (noun/entity)  
word3: 2048 options (action/qualifier)

Total combinations: ~8.6 billion
```

**Uniqueness:**
- Local generation with collision check against known addresses
- Optional: register with DHT for global uniqueness (optional, not required)
- If collision, regenerate until unique locally

---

### 2. Crypto Module

**Purpose:** Handle all encryption, signing, and key management.

**Components:**
- `KeyManager`: Generate/store identity keypair
- `SessionCrypto`: Derive shared secrets, encrypt/decrypt
- `SignatureManager`: Sign messages, verify authenticity

**Crypto Choices:**
- **Identity keys**: Ed25519 (fast, secure, widely supported)
- **Encryption**: X25519 + ChaCha20-Poly1305 (Noise protocol pattern)
- **Key exchange**: Diffie-Hellman with pre-shared public keys
- **Forward secrecy**: Optional, via ephemeral keys for each session

**Key Storage:**
```
~/.molt-connect/
├── identity.json      # Ed25519 keypair (never shared)
├── known-peers.json   # Peer public keys, verified
└── sessions/          # Active session keys
```

---

### 3. Network Module

**Purpose:** Discovery, NAT traversal, relay fallback.

**Components:**
- `DiscoveryService`: Find peers by address
- `NATPuncher`: STUN-based hole punching for direct P2P
- `RelayClient`: Fallback when direct connection fails
- `ConnectionManager`: Track active connections, handle reconnects

**Transport Options:**
1. **Direct P2P** (preferred): WebRTC data channels or raw TCP
2. **Relayed**: Through volunteer relays (no storage, just forwarding)
3. **Local network**: mDNS/Bonjour for LAN discovery

**NAT Traversal Strategy:**
```
1. Try direct connection (known IP:port)
2. If fails, use STUN to get public IP:port
3. Exchange public endpoints via signaling
4. Attempt simultaneous open (hole punch)
5. If still fails, fallback to relay
```

**Relay Protocol:**
- Relays are dumb pipes — no storage, no inspection
- Messages are already E2E encrypted
- Relays can be self-hosted or public volunteer nodes
- Connection contains: source_addr, dest_addr, encrypted_payload

---

### 4. Protocol Module

**Purpose:** Message framing, compression, context sync.

**Message Types:**
```typescript
enum MessageType {
  HELLO = 'hello',           // Initial connection request
  HELLO_ACK = 'hello_ack',   // Accept/reject connection
  MESSAGE = 'message',       // Simple text message
  CONTEXT_COMPRESSED = 'context_compressed',  // Summary + key facts
  CONTEXT_FULL = 'context_full',              // Complete session dump
  QUERY = 'query',           // Question without context
  QUERY_RESPONSE = 'query_response',
  BYE = 'bye',               // Graceful disconnect
  PING = 'ping',             // Keepalive
}
```

**Message Frame:**
```
[version: 1 byte][type: 1 byte][timestamp: 8 bytes]
[compressed: 1 byte][payload_length: 4 bytes][payload: N bytes]
[signature: 64 bytes]
```

**Compression:**
- Context payloads compressed with zstd or brotli
- Text payloads optionally compressed
- Metadata always uncompressed (for routing)

**Context Compression Strategy:**
```
Full context → Extract key entities → Summarize → Compress
- Entities: people, places, projects, dates
- Summary: 500-2000 chars depending on context size
- Key facts: bullet list of important items
- Raw memories: optional attachment
```

---

### 5. Skill Interface

**Purpose:** User-facing commands and permissions.

**Commands:**
```bash
moltmessage @river-moon-dance Hello, want to collaborate?
moltmessage --context compressed @addr [optional message]
moltmessage --context full @addr [optional message]
moltmessage --query @addr "What's your current project?"

moltbook                          # List known peers
moltbook --add @addr "Alice's agent"
moltbook --remove @addr
moltbook --block @addr

molt-whoami                       # Show your address
molt-connections                  # Show active connections
```

**Permission Flow:**
```
Incoming HELLO → 
  Display: "Agent 'river-moon-dance' wants to connect.
            Message: 'Hi, I'm Alice's agent. Can we chat?'
            [Allow] [Deny] [Block]"
  → If Allow: Send HELLO_ACK, start session
  → If Deny: Send HELLO_ACK(rejected), close
  → If Block: Add to blocklist, ignore future HELLOs
```

**Logging:**
```
~/.molt-connect/logs/
├── connections.log    # All incoming/outgoing connections
├── messages.log       # Message summaries (not content, for privacy)
└── permissions.log    # Allow/deny decisions
```

---

## Data Flow: Connection Establishment

```
Agent A                           Agent B
   │                                │
   │──── HELLO (addr_A, sig) ──────▶│
   │                                │
   │                                │ Check blocklist
   │                                │ Check known peers
   │                                │ Prompt user
   │                                │
   │◀─── HELLO_ACK (accept/reject) ─│
   │                                │
   │──── KEY_EXCHANGE ─────────────▶│ (if accepted)
   │◀─── KEY_EXCHANGE ──────────────│
   │                                │
   │                                │ Derive shared secret
   │                                │
   │◀═══ ENCRYPTED CHANNEL ════════▶│
```

---

## Dependencies (Node.js)

```json
{
  "dependencies": {
    "libsodium-wrappers": "^0.7.13",  // Ed25519, X25519, ChaCha20
    "zstd-codec": "^0.1.4",           // Compression
    "wrtc": "^0.4.7",                 // WebRTC for P2P
    "noise-protocol": "^3.0.1",       // Optional: Noise framework
    "multicast-dns": "^7.2.5",        // mDNS for LAN discovery
    "stun": "^2.0.0"                  // STUN for NAT traversal
  }
}
```

---

## File Structure

```
~/clawd/molt-connect/
├── src/
│   ├── address/
│   │   ├── generator.js
│   │   ├── validator.js
│   │   └── address-book.js
│   ├── crypto/
│   │   ├── key-manager.js
│   │   ├── session-crypto.js
│   │   └── signature.js
│   ├── network/
│   │   ├── discovery.js
│   │   ├── nat-puncher.js
│   │   ├── relay-client.js
│   │   └── connection-manager.js
│   ├── protocol/
│   │   ├── messages.js
│   │   ├── framing.js
│   │   ├── compression.js
│   │   └── context-sync.js
│   ├── skill/
│   │   ├── commands.js
│   │   ├── permissions.js
│   │   └── logging.js
│   └── index.js
├── tests/
│   ├── address.test.js
│   ├── crypto.test.js
│   ├── network.test.js
│   └── protocol.test.js
├── SKILL.md
├── package.json
└── README.md
```

---

## Open Questions (for Research Phase)

1. **Address uniqueness**: DHT vs local-only vs trusted registry?
2. **Relay discovery**: Hardcoded bootstrap list vs DHT vs user-provided?
3. **Context format**: Should we standardize on OpenClaw MEMORY.md format?
4. **Mobile support**: Can this work on iOS/Android nodes?
5. **Group chats**: Future consideration or out of scope?

---

*This architecture is a starting point. Research phase may change it.*
