# Existing Agent-to-Agent Communication Solutions & P2P Patterns

**Research Date:** 2026-03-27  
**Purpose:** Identify patterns, designs, and ideas for Molt Connect

---

## Table of Contents
1. [Beaker Browser & Hyper Protocol](#1-beaker-browser--hyper-protocol)
2. [Dat Protocol](#2-dat-protocol)
3. [IPFS & libp2p](#3-ipfs--libp2p)
4. [Farcaster](#4-farcaster)
5. [Telegram Bot API](#5-telegram-bot-api)
6. [MCP (Model Context Protocol)](#6-mcp-model-context-protocol)
7. [Existing AI Agent Protocols](#7-existing-ai-agent-protocols)
8. [Patterns to Steal](#8-patterns-to-steal)
9. [Recommendations for Molt Connect](#9-recommendations-for-molt-connect)

---

## 1. Beaker Browser & Hyper Protocol

### Overview
Beaker Browser (discontinued 2024) was an experimental P2P web browser that enabled users to create, host, and share websites directly from their devices without central servers. It used the Dat/Hyper protocol stack for decentralized data synchronization.

**Key Innovation:** "Hostless applications" - web apps that don't require a server to run.

### Relevant Features
- **Public-key addressing:** Archives addressed by their public key (e.g., `hyper://public-key`)
- **Built-in versioning:** Every publish creates a new revision, logged and revertible
- **Merkle tree integrity:** Content-addressed with BLAKE2b hashing; repository hash is hash of all content hashes
- **Three discovery modes:**
  1. DNS name servers (custom dns-discovery module)
  2. DNS multicast (mDNS) for LAN discovery
  3. Kademlia DHT for global peer discovery
- **Anyone can re-host:** Peers can serve content they've downloaded, increasing resilience
- **Browser-integrated publishing:** One-click publish, no server setup required
- **.well-known bridge:** SSL websites can point to Dat version for transition

### What to Steal
- **Public-key addressing:** Simple, self-certifying identifiers
- **Multi-discovery strategy:** Don't rely on single discovery mechanism
- **Version log as first-class citizen:** Built-in versioning from day one
- **Re-hosting model:** Any participant can serve any content (resilience)
- **Content-addressed integrity:** Merkle trees for tamper detection

### What to Avoid
- **Custom browser requirement:** Barrier to adoption; didn't reach critical mass
- **Static-only content:** Couldn't support dynamic apps (WordPress etc.)
- **Hosting dependency:** Without "always-on" peers, content dies
- **Centralized "super-peers":** Hashbase undermined decentralization goals

### Sources
- [Beaker GitHub](https://github.com/beakerbrowser/beaker)
- [Bernstein Bear - Dat Paper Analysis](https://bernsteinbear.com/dat-paper/)

---

## 2. Dat Protocol

### Overview
Dat is a P2P hypermedia protocol providing public-key-addressed file archives that can be synced securely and browsed on-demand. Now evolved into the Hyper ecosystem (Hypercore, Hyperdrive).

### Technical Architecture

**Discovery Mechanism:**
```
join(key, [port])    → Register interest in data
leave(key, [port])   → Unregister interest
foundpeer(key, ip, port) → Callback when peer found
```

**Discovery Key Calculation:**
```
discovery_key = BLAKE2b(public_key + "hypercore")
```
This prevents eavesdroppers from learning Dat URLs from network traffic.

**Three-Layer Discovery:**
1. **Local:** mDNS (multicast DNS) for LAN
2. **DNS:** Custom DNS servers for semi-decentralized lookup
3. **DHT:** Kademlia DHT for global peer discovery

### Versioning System
- **Append-only log:** All changes written to version log
- **Merkle tree:** Root hash changes when any content changes
- **Efficient sync:** Only download changed chunks (random access)
- **Real-time sync:** Can subscribe to live updates

### What to Steal
- **Discovery key abstraction:** Separate discovery key from content key (privacy)
- **Append-only log for versioning:** Simple, auditable history
- **Multi-source sync:** Download from multiple peers simultaneously
- **Chunk-level addressing:** Efficient partial sync
- **Signature-based authenticity:** All updates signed by author

### What to Avoid
- **Discovery key alone doesn't prevent traffic analysis:** IP addresses still visible
- **Bootstrap node dependency:** Needs initial DHT nodes

### Sources
- [Dat Protocol Website](https://www.datprotocol.com/)
- [Dat Protocol Book](https://dat-ecosystem-archive.github.io/book/)
- [Dat Discovery Mechanism](https://github.com/dmsoltech/p2p-networking-crypto/blob/master/dat.md)

---

## 3. IPFS & libp2p

### Overview
IPFS (InterPlanetary File System) is a P2P distributed file system connecting devices with the same system of files. Think "single BitTorrent swarm exchanging objects within one Git repository."

### Content Addressing
```
CID (Content Identifier) = hash(content)
```
- **Self-certifying:** Content addressable, location independent
- **Merkle DAG:** Generalized Merkle directed acyclic graph
- **CIDv0/CIDv1:** Multi-format content identifiers

### libp2p: The Networking Layer
libp2p was extracted from IPFS as a **modular P2P networking framework**. Now powers Ethereum, Filecoin, Polkadot, and more.

**Key Components:**
1. **Transport agnostic:** TCP, QUIC, WebSockets, WebRTC
2. **Peer identity:** Public key derived PeerID
3. **Peer routing:** Kademlia DHT for peer discovery
4. **NAT traversal:** AutoNAT, circuit relay, hole punching
5. **Security:** Noise protocol, TLS
6. **PubSub:** GossipSub for efficient broadcast

**libp2p Features for Agent Communication:**
- **Flexible addressing:** Multiaddress format (e.g., `/ip4/1.2.3.4/tcp/4001/p2p/PeerID`)
- **PubSub:** Subscribe to topics, receive messages from interested peers
- **GossipSub:** Efficient, scalable message delivery in large networks

### Overhead Considerations
- **DHT maintenance:** Periodic lookups, bucket refreshes
- **Connection overhead:** Keep-alive for multiple transports
- **Memory usage:** Peerstore, routing tables
- **Not lightweight:** Best for substantial nodes, not tiny agents

### What to Steal
- **libp2p as networking layer:** Don't reinvent P2P; use libp2p
- **Multiaddress:** Flexible, self-describing addresses
- **GossipSub:** Proven PubSub for scalability
- **Content addressing (CIDs):** Content-centric vs location-centric
- **Modular design:** Pick and choose components

### What to Avoid
- **Full IPFS node overhead:** Heavy for simple agent communication
- **DHT for small networks:** Overkill for <100 peers
- **Content persistence:** IPFS doesn't guarantee content stays available

### Sources
- [IPFS Paper (arXiv)](https://arxiv.org/abs/1407.3561)
- [IPFS libp2p Docs](https://docs.ipfs.tech/concepts/libp2p/)
- [libp2p Concepts](https://docs.libp2p.io/concepts/)

---

## 4. Farcaster

### Overview
Farcaster is a decentralized social protocol with a **hybrid architecture**: identity on-chain, data off-chain. Users own their identity and social graph, portable across apps.

### Architecture: On-Chain vs Off-Chain

**On-Chain (OP Mainnet):**
- Account creation
- Paying rent for data storage
- Adding account keys for connected apps
- Security-critical, consistency-critical operations

**Off-Chain (Snapchain - P2P network):**
- Posting messages
- Following users
- Reactions
- Profile updates
- Performance-critical operations

**Key Insight:** Off-chain uses signatures from on-chain identity for security.

### Identity Model
- **Farcaster ID (fid):** On-chain identifier (integer)
- **Username:** Resolvable on-chain or via hubs
- **Signers:** App-specific keys authorized by user
- **Portability:** Same identity works across all Farcaster apps

### Message Structure
```json
{
  "data": {
    "type": "MESSAGE_TYPE_CAST_ADD",
    "fid": 12345,
    "timestamp": 1234567890,
    "network": "FARCASTER_NETWORK_MAINNET",
    "castAddBody": { ... }
  },
  "hash": "0x...",
  "hashScheme": "HASH_SCHEME_BLAKE2B",
  "signature": "0x...",
  "signatureScheme": "SIGNATURE_SCHEME_ED25519",
  "signer": "0x..."
}
```

### What to Steal
- **Hybrid on/off-chain split:** Expensive operations on-chain, frequent operations off-chain
- **Signer authorization:** User authorizes app-specific keys
- **Signature-based offline verification:** Don't need on-chain for every action
- **Portable identity:** User owns their graph, not the app
- **Hub replication:** Multiple hubs store data for reliability

### What to Avoid
- **On-chain for everything:** Too expensive, too slow
- **Single hub dependency:** Needs multiple hubs for decentralization
- **Complex message types:** Keep message schema simple

### Sources
- [Farcaster Architecture Docs](https://docs.farcaster.xyz/learn/architecture/overview)
- [Farcaster Protocol DeepWiki](https://deepwiki.com/farcasterxyz/protocol)

---

## 5. Telegram Bot API

### Overview
HTTP-based interface for building bots on Telegram. Simple request-response model with JSON payloads.

### Communication Pattern
**Long Polling:**
```
GET https://api.telegram.org/bot<TOKEN>/getUpdates?offset=XXX
→ Returns array of Update objects
```

**Webhook:**
```
POST to your URL with Update object
```

### Message Format
```json
{
  "update_id": 123456789,
  "message": {
    "message_id": 1,
    "from": {
      "id": 123456789,
      "is_bot": false,
      "first_name": "User",
      "username": "user123"
    },
    "chat": {
      "id": 123456789,
      "type": "private"
    },
    "date": 1234567890,
    "text": "Hello bot"
  }
}
```

### Key Patterns
1. **HTTP-based:** No special protocol, just HTTPS
2. **JSON payloads:** Simple, human-readable
3. **Two modes:** Polling or webhook (push)
4. **Message types:** Text, photo, document, location, etc.
5. **Inline queries:** Bot can respond without being in chat
6. **Callback queries:** Button clicks trigger callbacks
7. **Editing/deleting:** Messages can be modified after sending

### Bot-to-Bot Communication
Bots can communicate with each other via:
- **Deep linking:** `t.me/bot?start=param`
- **Inline mode:** One bot calls another
- **Webhook forwarding:** Bot A sends to Bot B's webhook

### What to Steal
- **JSON-RPC-like simplicity:** Easy to implement, debug
- **Two delivery modes:** Polling for simple, webhook for real-time
- **Message envelope pattern:** Consistent structure for all message types
- **Edit/delete capabilities:** Messages aren't immutable
- **Inline/callback patterns:** Actions without full conversations

### What to Avoid
- **Centralized:** Single point of control (Telegram servers)
- **No offline:** Bot must be online to receive messages
- **Rate limits:** Strict limits on message frequency

### Sources
- [Telegram Bot API Docs](https://core.telegram.org/bots/api)

---

## 6. MCP (Model Context Protocol)

### Overview
Anthropic's open protocol for connecting AI applications to external systems. Think "USB-C port for AI applications."

### Architecture
```
┌─────────────────────────────────────┐
│          MCP Host (AI App)          │
│  ┌──────────┐ ┌──────────┐ ┌──────┐│
│  │Client 1  │ │Client 2  │ │Client││
│  └────┬─────┘ └────┬─────┘ └──┬───┘│
└───────┼────────────┼──────────┼────┘
        │            │          │
   ┌────▼───┐   ┌────▼───┐  ┌───▼────┐
   │Server A│   │Server B│  │Server C│
   │(local) │   │(local) │  │(remote)│
   └────────┘   └────────┘  └────────┘
```

### Two Layers

**Data Layer (JSON-RPC 2.0):**
- Lifecycle management
- Capability negotiation
- Core primitives

**Transport Layer:**
- **Stdio:** For local servers (same machine)
- **Streamable HTTP:** For remote servers (with SSE for streaming)

### Primitives (Server → Client)

1. **Resources:** Data sources (files, DBs, APIs)
   - `resources/list` - Discover available resources
   - `resources/read` - Fetch resource content
   - `resources/subscribe` - Watch for changes

2. **Tools:** Executable functions
   - `tools/list` - Discover available tools
   - `tools/call` - Execute a tool

3. **Prompts:** Reusable templates
   - `prompts/list` - Discover prompts
   - `prompts/get` - Retrieve prompt

### Primitives (Client → Server)

1. **Sampling:** Request LLM completions
   - `sampling/createMessage` - Server asks client's LLM

2. **Elicitation:** Request user input
   - `elicitation/create` - Server asks client to get user input

3. **Logging:** Debug/info messages
   - `notifications/message` - Log to client

### Message Format
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-06-18",
    "capabilities": { "elicitation": {} },
    "clientInfo": { "name": "my-client", "version": "1.0.0" }
  }
}
```

### Capability Negotiation
```json
// Client declares capabilities
"capabilities": { "elicitation": {} }

// Server declares capabilities
"capabilities": {
  "tools": { "listChanged": true },
  "resources": {}
}
```

### What to Steal
- **JSON-RPC 2.0 foundation:** Simple, well-understood
- **Capability negotiation:** Advertise what you support
- **Resource/Tool/Prompt separation:** Clear abstraction for context
- **Sampling primitive:** Servers can request LLM access (agentic!)
- **Elicitation pattern:** Server can ask user for input
- **Notifications for updates:** Real-time capability changes
- **Transport abstraction:** Same protocol over stdio or HTTP

### What to Avoid
- **Host-centric model:** Assumes one AI app controlling everything
- **No direct server-to-server:** All communication through host
- **Stateful connections:** Requires connection management

### Sources
- [MCP Website](https://modelcontextprotocol.io)
- [MCP Architecture Docs](https://modelcontextprotocol.io/docs/learn/architecture)
- [MCP Specification](https://modelcontextprotocol.io/specification/latest)
- [Anthropic MCP Announcement](https://www.anthropic.com/news/model-context-protocol)

---

## 7. Existing AI Agent Protocols

### Current Landscape (as of 2026)

**1. LangChain/LangGraph**
- Agent framework, not a communication protocol
- Uses function calling within single runtime
- No standard for cross-agent communication

**2. AutoGen (Microsoft)**
- Multi-agent conversation framework
- Custom message format
- Requires shared runtime or HTTP
- Not a standard protocol

**3. CrewAI**
- Agent orchestration framework
- Task-based collaboration
- No standard inter-agent protocol

**4. Agent-to-Agent (A2A) - Emerging**
- Various proposals, no dominant standard
- MCP is closest thing to a standard for context sharing
- No widely-adopted P2P agent protocol

### Key Insight
**There is no standard AI agent-to-agent communication protocol.** MCP comes closest for context/tool sharing, but it's host-centric (agents don't talk directly). This is an opportunity for Molt Connect.

### What Exists
- **MCP:** Context sharing between AI app and data sources
- **OpenAI Assistants API:** Stateless agent API, not P2P
- **LangGraph Platform:** Hosted agent runtime, proprietary protocol
- **Semantic Kernel:** Microsoft's agent orchestration, internal messaging

### What's Missing
- **P2P agent discovery:** How do agents find each other?
- **Agent identity:** Portable identity for agents
- **Capability advertisement:** What can this agent do?
- **Secure agent-to-agent messaging:** Without central server
- **Agent reputation/trust:** How do agents know who to trust?

---

## 8. Patterns to Steal

### A. Identity Patterns

| Solution | Pattern | Steal? |
|----------|---------|--------|
| Dat/Hyper | Public key as address | ✅ Simple, self-certifying |
| Farcaster | On-chain ID + off-chain signers | ✅ Hybrid trust model |
| libp2p | PeerID from public key | ✅ Standard approach |
| MCP | No identity concept | ❌ Not applicable |

**Recommendation:** Agent identity = public key. Optional on-chain registration for reputation.

### B. Discovery Patterns

| Solution | Pattern | Steal? |
|----------|---------|--------|
| Dat | Multi-mode (mDNS + DNS + DHT) | ✅ Layered discovery |
| libp2p | Kademlia DHT + mDNS | ✅ Standard P2P approach |
| Farcaster | Hubs directory | ⚠️ Centralized list |
| Telegram | Central server | ❌ Not P2P |

**Recommendation:** mDNS for local, DHT for global, optional rendezvous servers for bootstrapping.

### C. Message Patterns

| Solution | Pattern | Steal? |
|----------|---------|--------|
| Telegram | JSON envelope with type field | ✅ Simple, extensible |
| MCP | JSON-RPC 2.0 | ✅ Standard, tooling exists |
| Farcaster | Signed message with hash | ✅ Verifiable, tamper-proof |
| Dat | Append-only log | ⚠️ Good for history, heavy for chat |

**Recommendation:** JSON-RPC 2.0 + signed messages. Optional append-only log for auditability.

### D. Transport Patterns

| Solution | Pattern | Steal? |
|----------|---------|--------|
| MCP | Stdio (local) + HTTP (remote) | ✅ Simple dual transport |
| libp2p | Multi-transport (TCP/QUIC/WS) | ✅ Flexible |
| Telegram | HTTPS only | ❌ Not P2P |

**Recommendation:** WebSocket for real-time, HTTP for compatibility, libp2p for P2P.

### E. Capability Patterns

| Solution | Pattern | Steal? |
|----------|---------|--------|
| MCP | Capability negotiation on connect | ✅ Essential |
| Farcaster | Implicit (message types) | ⚠️ Less explicit |
| Dat | Data-only | ❌ Not applicable |

**Recommendation:** MCP-style capability negotiation. Advertise tools, resources, skills.

### F. Versioning Patterns

| Solution | Pattern | Steal? |
|----------|---------|--------|
| Dat | Append-only log + Merkle tree | ✅ Audit trail |
| IPFS | CID = version | ✅ Immutable versions |
| Farcaster | Hash chain | ⚠️ Complex |
| Telegram | Edit/delete messages | ✅ Flexibility |

**Recommendation:** Content-addressed messages (hash = ID). Support edits with version history.

---

## 9. Recommendations for Molt Connect

### Core Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Molt Connect Node                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Identity   │  │  Transport   │  │   Protocol   │  │
│  │  (Key Pair)  │  │ (WS/HTTP/p2p)│  │ (JSON-RPC 2) │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Discovery    │  │ Capabilities │  │   Message    │  │
│  │(mDNS/DHT/etc)│  │ (Tools/Skills)│  │   (Signed)   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### What to Implement

**Phase 1: Foundation**
1. ✅ **Identity:** Ed25519 key pair, public key as Agent ID
2. ✅ **Transport:** WebSocket (real-time) + HTTP (compat)
3. ✅ **Protocol:** JSON-RPC 2.0 message format
4. ✅ **Capabilities:** Tool/skill advertisement via `agent/capabilities`
5. ✅ **Message Signing:** Ed25519 signatures on all messages

**Phase 2: Discovery**
1. ✅ **mDNS:** Local agent discovery (like Chromecast)
2. ✅ **DHT:** Global agent discovery (Kademlia)
3. ✅ **Rendezvous servers:** Optional bootstrap nodes
4. ✅ **Agent directory:** Optional registries for discoverability

**Phase 3: Advanced**
1. ⚠️ **Message history:** Optional append-only log
2. ⚠️ **Reputation:** Optional on-chain registration
3. ⚠️ **Delegation:** App-specific keys authorized by agent
4. ⚠️ **E2E encryption:** Noise protocol for private channels

### What NOT to Implement

❌ **Custom transport protocol** - Use libp2p if P2P is core  
❌ **Blockchain for everything** - Only for identity/reputation  
❌ **Full IPFS integration** - Too heavy for agent messaging  
❌ **Complex consensus** - Agents are autonomous, no consensus needed  
❌ **Centralized server required** - Should work fully P2P  

### Minimal Viable Protocol

```json
// Agent Hello (capability advertisement)
{
  "jsonrpc": "2.0",
  "method": "agent/hello",
  "params": {
    "agentId": "did:molt:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
    "capabilities": {
      "tools": [{ "name": "search", "description": "Web search" }],
      "skills": ["coding", "research"],
      "version": "1.0.0"
    },
    "signature": "..."
  }
}

// Message
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "message/send",
  "params": {
    "from": "did:molt:...",
    "to": "did:molt:...",
    "type": "text",
    "content": "Hello, agent!",
    "timestamp": 1234567890,
    "signature": "..."
  }
}

// Tool Call
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tool/call",
  "params": {
    "tool": "search",
    "arguments": { "query": "Molt Connect" },
    "caller": "did:molt:...",
    "signature": "..."
  }
}
```

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Message format | JSON-RPC 2.0 | Standard, tooling exists, extensible |
| Identity | Ed25519 public key | Self-certifying, no CA needed |
| Transport | WebSocket + HTTP | Real-time + compatibility |
| Discovery | mDNS + DHT | Local + global |
| Capabilities | MCP-style advertisement | Proven pattern |
| Signatures | Ed25519 | Fast, secure, widely supported |

### Open Questions

1. **Delegation:** How to authorize third-party apps to act as agent?
   - Farcaster's signer model is promising
   - MCP doesn't address this

2. **Reputation:** How to establish trust between unknown agents?
   - On-chain identity with attestations?
   - Web of trust?

3. **Message delivery:** At-least-once or exactly-once?
   - P2P makes exactly-once hard
   - Idempotent operations safer

4. **Group messaging:** How to handle multi-agent conversations?
   - libp2p PubSub for broadcast
   - Each message signed individually

---

## Summary: What Molt Connect Should Be

1. **A protocol, not a platform** - Agents connect directly, no mandatory server
2. **Simple identity** - Public key = Agent ID, no PKI
3. **Standard messaging** - JSON-RPC 2.0, easy to implement
4. **Capability-first** - Agents advertise what they can do
5. **Signed everything** - All messages verifiable
6. **Layered discovery** - mDNS for local, DHT for global
7. **Hybrid optional** - Can work with servers for bootstrapping

**The gap in the market:** No standard for P2P agent-to-agent communication. MCP is closest but is host-centric. Molt Connect can be the "USB-C for AI agents" - but P2P.

---

*Research compiled from official documentation, specifications, and technical papers.*
