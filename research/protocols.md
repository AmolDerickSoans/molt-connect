# P2P Communication Protocols Research

**Research for Molt Connect** - Agent-to-Agent Communication  
**Date:** 2026-03-27

---

## 1. WebRTC

### Overview
WebRTC (Web Real-Time Communication) is a standard that enables peer-to-peer communication directly between browsers and applications. It provides both media streaming (audio/video) and arbitrary data transfer via data channels.

### Architecture

```
[Peer A] <---> [Signaling Server] <---> [Peer B]
    |                                    |
    +----[STUN/TURN Servers]------------+
                |
            [ICE Framework]
                |
         [Direct P2P Connection]
```

### NAT Traversal

WebRTC uses **ICE (Interactive Connectivity Establishment)** framework for NAT traversal:

1. **Host Candidates**: Direct local IP addresses
2. **Server Reflexive (srflx)**: Obtained via STUN servers - reveals public IP:port
3. **Peer Reflexive (prflx)**: Discovered during connection attempts through symmetric NAT
4. **Relay Candidates**: Via TURN servers for restrictive networks

**ICE Process:**
- Gathers all possible connection candidates
- Prioritizes UDP (faster) over TCP
- Selects best candidate pair (controlling agent decides)
- Falls back through candidates if primary fails

**STUN**: Simple server that echoes back client's public IP:port
**TURN**: Relay server for when direct connection impossible (last resort)

### Data Channels

`RTCDataChannel` provides:
- **Low-latency P2P data transfer** (no server relay)
- **Automatic encryption** via DTLS (as secure as HTTPS)
- **Ordered or unordered delivery** (configurable)
- **Reliable or unreliable mode** (configurable)
- **Buffering support** with backpressure notifications

```javascript
// Node.js via wrtc package example
const wrtc = require('wrtc');
const pc = new wrtc.RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
});

// Create data channel
const channel = pc.createDataChannel('molt-connect');

channel.onopen = () => {
  channel.send('Hello from agent!');
};

channel.onmessage = (event) => {
  console.log('Received:', event.data);
};
```

### Signaling Requirement

**Critical: WebRTC requires an external signaling mechanism** to exchange:
- SDP Offers/Answers (session descriptions)
- ICE Candidates

Common signaling approaches:
- WebSocket server
- HTTP polling
- Existing messaging infrastructure
- **Out-of-band exchange** (email, QR code, etc.)

WebRTC does NOT define signaling - it's application-specific.

### Node.js Implementation: `wrtc`

**Status:** The original `wrtc` package is deprecated. Alternatives:
- `node-webrtc` (community fork)
- `werift` (pure TypeScript implementation)
- `electron-webrtc` (uses Electron's WebRTC)

**Pros:**
- Native browser support (no Node.js needed for browser agents)
- Built-in encryption (DTLS)
- Supports both media and data
- Standardized protocol
- Excellent NAT traversal

**Cons:**
- Requires signaling server (not truly serverless)
- `wrtc` package maintenance concerns
- Native dependencies can be tricky
- No built-in peer discovery
- Connection setup latency (ICE negotiation)

### Relevance for Molt Connect

WebRTC is **excellent for direct agent-to-agent data channels** once peers know each other. The signaling requirement means you still need a discovery/meetup mechanism. Could combine with other protocols for discovery, then use WebRTC for direct communication.

**Sources:**
- https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Connectivity
- https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_data_channels
- https://webrtc.org/getting-started/overview

---

## 2. libp2p

### Overview
libp2p is a **modular peer-to-peer networking stack** originally developed for IPFS. It's a collection of protocols that work together for P2P communication, providing solutions for transport, security, discovery, NAT traversal, and more.

### Problems It Solves

1. **Fragmentation**: Every P2P app used to reinvent networking
2. **Transport diversity**: Works across TCP, WebSockets, WebRTC, QUIC, etc.
3. **NAT traversal**: Built-in hole punching and relay
4. **Peer discovery**: Multiple discovery mechanisms
5. **Security**: Encrypted channels by default
6. **Interoperability**: Same protocol across languages

### Architecture

```
┌─────────────────────────────────────────────┐
│              Application Layer               │
├─────────────────────────────────────────────┤
│  PubSub (gossipsub) │ DHT (Kademlia)        │
├─────────────────────────────────────────────┤
│           Peer Routing & Discovery           │
├─────────────────────────────────────────────┤
│           Secure Channel (Noise/TLS)         │
├─────────────────────────────────────────────┤
│         Stream Multiplexer (mplex/yamux)     │
├─────────────────────────────────────────────┤
│    Transport (TCP/WebSockets/WebRTC/QUIC)    │
└─────────────────────────────────────────────┘
```

### Peer Discovery

libp2p supports multiple discovery mechanisms:

1. **mDNS**: Local network discovery (UDP broadcast)
2. **Bootstrap nodes**: Known peers to connect initially
3. **DHT (Kademlia)**: Distributed hash table for finding peers
4. **PubSub peer exchange**: Discovery via gossip
5. **Rendezvous**: Meetup points for peers

### Key Features for Agent Communication

**NAT Traversal:**
- AutoNAT protocol (detect NAT type)
- Circuit Relay (volunteer relay servers)
- Hole punching (direct P2P through NAT)

**PubSub (gossipsub):**
- Efficient broadcast messaging
- Mesh-based with gossip overlay
- Ideal for agent broadcast channels

**DHT:**
- Store and retrieve peer info
- Content routing
- Decentralized peer lookup

### Node.js Implementation

```javascript
import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { noise } from '@libp2p/noise';
import { mplex } from '@libp2p/mplex';
import { bootstrap } from '@libp2p/bootstrap';
import { kadDHT } from '@libp2p/kad-dht';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';

const node = await createLibp2p({
  transports: [tcp()],
  connectionEncryption: [noise()],
  streamMuxers: [mplex()],
  peerDiscovery: [
    bootstrap({
      list: ['/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ']
    })
  ],
  dht: kadDHT(),
  pubsub: gossipsub()
});

await node.start();
console.log('Node started with ID:', node.peerId.toString());

// Dial a peer
await node.dial('/ip4/192.168.1.100/tcp/4001/p2p/peer-id-here');

// Subscribe to topic
node.pubsub.subscribe('molt-agents');
node.pubsub.addEventListener('message', (evt) => {
  console.log('Received:', evt.detail);
});
```

### Overhead Assessment

**Bundle Size:** ~500KB-1MB (tree-shakeable)
**Runtime Memory:** ~10-50MB depending on connections
**Network:** DHT maintenance, peer heartbeats

**Is it worth the dependency?**

| Use Case | Recommendation |
|----------|----------------|
| Simple 1:1 messaging | Overkill - consider WebRTC |
| Agent swarm with discovery | Excellent fit |
| Need DHT/routing | Essential |
| Browser-only agents | Use js-libp2p with WebRTC transport |
| Long-lived connections | Good fit |

### Pros & Cons

**Pros:**
- Battle-tested (IPFS, Ethereum, Filecoin)
- Modular - use only what you need
- Multi-language support (JS, Go, Rust, Python)
- Excellent NAT traversal built-in
- Active development and community
- Built-in security (encrypted channels)
- DHT for peer/content discovery

**Cons:**
- Significant learning curve
- Heavy dependency for simple use cases
- DHT can be slow for small networks
- Requires understanding of multiple protocols
- Connection establishment takes time

### Relevance for Molt Connect

libp2p is **highly relevant** for Molt Connect if you need:
- Agent discovery without central server
- Broadcast messaging between agents
- NAT traversal for remote agents
- Content routing (find agent by capability)

Best combined with a lightweight signaling layer for initial connection, then libp2p handles everything else.

**Sources:**
- https://libp2p.io/docs/
- https://github.com/libp2p/js-libp2p
- https://docs.libp2p.io/concepts/

---

## 3. Nostr

### Overview
Nostr ("Notes and Other Stuff Transmitted by Relays") is a decentralized protocol designed for censorship-resistant social networking. It uses a **relay model** where anyone can run relays, and clients connect to multiple relays to publish and receive messages.

### Censorship Resistance Mechanisms

1. **No Single Point of Control**: Messages distributed across many relays
2. **Cryptographic Signatures**: Every event signed with author's private key
3. **Client Choice**: Users choose which relays to trust
4. **No Identity Provider**: Keys are identity - no central registration
5. **Open Protocol**: Anyone can build clients or relays

**Key Insight:** Censorship resistance comes from the ability to publish to ANY willing relay. If one relay blocks you, others won't.

### Relay Model

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│ Relay 1 │     │ Relay 2 │     │ Relay 3 │
└────┬────┘     └────┬────┘     └────┬────┘
     │               │               │
     └───────────────┼───────────────┘
                     │
           ┌─────────┴─────────┐
           │    WebSocket      │
           │   Connections     │
           └─────────┬─────────┘
                     │
              ┌──────┴──────┐
              │   Client    │
              │  (Agent)    │
              └─────────────┘
```

**How it works:**
1. Client opens WebSocket connections to multiple relays
2. Sends `EVENT` messages to publish
3. Sends `REQ` (subscription) messages to receive
4. Each event is a signed JSON object with kind, content, tags

### Event Structure (NIP-01)

```json
{
  "id": "sha256-hash",
  "pubkey": "32-byte-hex-public-key",
  "created_at": 1739953200,
  "kind": 1,
  "tags": [["p", "recipient-pubkey"], ["e", "referenced-event"]],
  "content": "Message content",
  "sig": "64-byte-signature"
}
```

**Event Kinds:**
- 0: User metadata (profile)
- 1: Text note (short message)
- 4: Encrypted DM (NIP-04)
- 10002: Relay list metadata
- Custom ranges for application-specific events

### Using Nostr for Discovery

**Yes, Nostr can be used for peer discovery:**

1. **Kind 0 events**: Advertise agent capabilities in metadata
2. **Kind 10002**: Publish list of relays where agent can be found
3. **Custom kind**: Define agent discovery event type
4. **NIP-28 (Public Chat)**: Channel-based discovery
5. **NIP-65**: Relay list for finding where agents publish

### Agent-to-Agent Communication

```javascript
// Using nostr-tools
import { generateSecretKey, getPublicKey, finalizeEvent } from 'nostr-tools/pure';
import { Relay } from 'nostr-tools/relay';

const sk = generateSecretKey();
const pk = getPublicKey(sk);

const relay = await Relay.connect('wss://relay.damus.io');

// Publish event
const event = finalizeEvent({
  kind: 1,
  created_at: Math.floor(Date.now() / 1000),
  tags: [['p', 'recipient-pubkey']],
  content: 'Agent message'
}, sk);

await relay.publish(event);

// Subscribe to events
const sub = relay.subscribe([
  { kinds: [1], '#p': [pk] }
], {
  onevent(event) {
    console.log('Received:', event.content);
  }
});
```

### Pros & Cons

**Pros:**
- True decentralization
- Censorship-resistant
- No central server required
- Simple protocol (WebSockets + JSON)
- Built-in identity (keypairs)
- Encrypted DMs possible
- Works well for discovery

**Cons:**
- Relays may require payment
- No guaranteed delivery
- Event ordering is timestamp-based
- No built-in P2P (relays are servers)
- Bandwidth considerations (broadcast to all relays)
- Key management responsibility on user

### Relevance for Molt Connect

**Nostr is excellent for:**
- Agent discovery and metadata
- Broadcast announcements
- Censorship-resistant messaging
- Finding other agents via relays

**Not ideal for:**
- High-throughput data transfer
- Real-time bidirectional streams
- Direct P2P (requires relay for NAT traversal)

**Recommendation:** Use Nostr for **discovery and signaling**, then establish direct WebRTC or libp2p connections for actual agent communication.

**Sources:**
- https://github.com/nostr-protocol/nostr
- https://github.com/nostr-protocol/nips/blob/master/01.md
- https://nostr.how/

---

## 4. Matrix

### Overview
Matrix is an open standard for decentralized, federated real-time communication. It's designed for instant messaging, VoIP, and IoT, providing a complete solution with end-to-end encryption, federation, and bridging to other networks.

### Federation Architecture

```
┌────────────────┐         ┌────────────────┐
│  Homeserver A  │◄───────►│  Homeserver B  │
│  (matrix.org)  │         │  (example.com) │
└───────┬────────┘         └───────┬────────┘
        │                          │
   ┌────┴────┐                ┌────┴────┐
   │  Users  │                │  Users  │
   │ @a:hsA  │                │ @b:hsB  │
   └─────────┘                └─────────┘

Rooms are replicated across all participating homeservers
```

**Key Concepts:**
- **Homeserver**: Server that hosts user accounts and rooms
- **Room**: Shared conversation space, replicated across servers
- **Event**: Any piece of data (message, state change, etc.)
- **Event Graph**: DAG of events (partial ordering)
- **Federation**: Server-to-server sync protocol

### How Federation Works

1. User sends event to their homeserver via Client-Server API
2. Homeserver signs the event
3. Event is federated to other participating homeservers
4. Each homeserver validates signature and adds to room graph
5. Other users receive via sync (long-poll or push)

### Protocol Overhead

**Network:**
- HTTP-based (REST + WebSocket for sync)
- Events signed with Ed25519
- Full room state sync on join
- Traffic scales with room size

**Server Resources:**
- Database (PostgreSQL recommended)
- State resolution computation
- Federation traffic handling
- Media storage

**Client Resources:**
- Sync state locally
- E2EE computation (Megolm ratchet)

### Is It Overkill for Agent Communication?

| Aspect | Assessment |
|--------|------------|
| **Simple 1:1 messaging** | Overkill - too much overhead |
| **Group coordination** | Good fit - rooms handle this well |
| **Need audit trail** | Good - event graph persists |
| **Bridge to other networks** | Excellent - Matrix bridges to everything |
| **Lightweight agents** | Heavy - requires full Matrix client |
| **Serverless operation** | No - requires homeserver |

### Matrix for Agents

**Possible approach:**
1. Each agent is a Matrix user
2. Agents join shared rooms for coordination
3. Direct rooms for 1:1 communication
4. E2EE for private agent communication

```javascript
// Using matrix-js-sdk
import { createClient } from 'matrix-js-sdk';

const client = createClient({
  baseUrl: 'https://matrix.org',
  accessToken: 'access_token',
  userId: '@agent:molt.connect'
});

await client.startClient();

// Send message to room
await client.sendEvent('!room-id:matrix.org', 'm.room.message', {
  msgtype: 'm.text',
  body: 'Agent report: task complete'
}, '');

// Listen for messages
client.on('Room.timeline', (event, room, toStartOfTimeline) => {
  if (event.getType() === 'm.room.message') {
    console.log('Message:', event.getContent().body);
  }
});
```

### Pros & Cons

**Pros:**
- Complete messaging solution
- Built-in E2E encryption (Megolm/Olm)
- Federation for decentralization
- Bridges to other networks (Slack, Discord, IRC, etc.)
- Rich event types (messages, files, reactions, etc.)
- Well-documented protocol
- Multiple client/server implementations

**Cons:**
- Heavy protocol overhead
- Requires homeserver infrastructure
- Complex state resolution
- Learning curve
- Not designed for small agents
- Federation setup complexity

### Relevance for Molt Connect

**Matrix is good if you need:**
- Full messaging infrastructure
- Bridging to existing chat platforms
- Persistent message history
- Human-agent interaction in same rooms

**Not recommended if:**
- Lightweight agent-to-agent communication
- Minimal infrastructure
- Low latency is critical
- Simple discovery + messaging

**Recommendation:** Consider Matrix only if Molt Connect needs to integrate with human chat systems or requires full messaging infrastructure. For pure agent-to-agent, it's overkill.

**Sources:**
- https://spec.matrix.org/v1.11/
- https://matrix.org/docs/

---

## 5. Secure Scuttlebutt (SSB)

### Overview
Secure Scuttlebutt is an offline-first, peer-to-peer protocol designed for decentralized social networking. It emphasizes **local-first data** and **gossip-based replication**, making it ideal for intermittent connectivity.

### Offline-First Design

**Core Principle:** Data lives locally first, syncs when connected.

1. **Feed**: Each identity has an append-only log (feed)
2. **Local Storage**: All followed feeds stored locally
3. **Gossip Sync**: Peers exchange feeds when they meet
4. **Eventually Consistent**: No requirement for constant connectivity

```
┌─────────────┐         ┌─────────────┐
│   Peer A    │◄───────►│   Peer B    │
│  (offline)  │  sync   │   (online)  │
└──────┬──────┘         └──────┬──────┘
       │                       │
  ┌────┴────┐             ┌────┴────┐
  │ Local   │             │ Local   │
  │ Feed    │             │ Feed    │
  │ Store   │             │ Store   │
  └─────────┘             └─────────┘
```

### Replication Model

**Gossip Protocol:**
1. Peers connect when they discover each other
2. Exchange feed ranges they're missing
3. Verify signatures on received messages
4. Store locally for offline access
5. Forward to other connected peers

**Connection Types:**
- **Local Network**: UDP broadcast discovery
- **Internet**: Via pubs (public bootstrap peers)
- **Invite Codes**: One-time connection tokens

### Key Protocol Features

**Cryptographic Identity:**
- Ed25519 keypairs for identity
- Each message signed by author
- Feed ID = public key

**Handshake (Secret Handshake):**
- Authenticated and encrypted
- Mutual identity verification
- Network identifier prevents cross-network leaks
- Forward secrecy

**Discovery Mechanisms:**
1. **mDNS**: Local network broadcast
2. **Pubs**: Public relay servers with invite codes
3. **Pub Messages**: Advertise peers in feed

### What We Can Learn from SSB

| Feature | Applicability to Molt Connect |
|---------|------------------------------|
| **Offline-first** | Essential for intermittent agent availability |
| **Append-only logs** | Good for audit trails, message history |
| **Gossip sync** | Efficient for propagating agent state |
| **Local storage** | Agents can cache peer data |
| **Simple handshake** | Could adapt for agent authentication |
| **Feed-based identity** | Agents could have persistent identity feeds |

### Protocol Example

```javascript
// Using ssb-db
const SecretStack = require('secret-stack');
const ssbKeys = require('ssb-keys');

const Server = SecretStack({
  caps: {
    shs: '1KHLiKZvAvjbY1ziZEHMXawbCEIM6qwjCDm3VYRan/s=' // network key
  }
})
  .use(require('ssb-db'))
  .use(require('ssb-conn'))
  .use(require('ssb-replicate'));

const ssb = Server({
  keys: ssbKeys.generate()
});

// Publish to feed
ssb.publish({
  type: 'agent-message',
  content: { status: 'ready', capabilities: ['search', 'analyze'] }
}, (err, msg) => {
  console.log('Published:', msg.key);
});

// Query feed
ssb.query.read({
  query: [{ '$filter': { value: { content: { type: 'agent-message' } } } }]
}).pipe(/* process messages */);
```

### Pros & Cons

**Pros:**
- True offline-first design
- No central server required
- Cryptographic identity
- Gossip-based replication
- Works well in intermittent connectivity
- Simple, well-documented protocol

**Cons:**
- Small ecosystem compared to others
- Eventually consistent (not real-time)
- Storage grows with network size
- JavaScript-centric implementations
- Slower sync for large networks
- Less active development

### Relevance for Molt Connect

**SSB inspires:**
- Offline agent operation
- Gossip-based state propagation
- Feed-based agent identity
- Local caching of peer information

**Consider implementing:**
- Append-only logs for agent activity
- Gossip protocol for state sync
- mDNS for local agent discovery
- Invite-based peer connections

**Sources:**
- https://ssbc.github.io/scuttlebutt-protocol-guide/
- https://www.scuttlebutt.nz/

---

## 6. Protocol Comparison

| Feature | WebRTC | libp2p | Nostr | Matrix | SSB |
|---------|--------|--------|-------|--------|-----|
| **Direct P2P** | ✅ Yes | ✅ Yes | ❌ Via relay | ❌ Via server | ✅ Yes |
| **NAT Traversal** | ✅ ICE/STUN/TURN | ✅ AutoNAT/Relay | ❌ None | ❌ None | ⚠️ Limited |
| **Peer Discovery** | ❌ External | ✅ DHT/mDNS/Bootstrap | ✅ Relays | ✅ Room directory | ✅ mDNS/Pubs |
| **Signaling Required** | ✅ Yes | ⚠️ Bootstrap helps | ❌ Relays handle | ❌ Server handles | ❌ Pubs help |
| **Offline Support** | ❌ No | ⚠️ Partial | ⚠️ Store at relay | ⚠️ Server stores | ✅ Full |
| **Encryption** | ✅ DTLS | ✅ Noise | ✅ NIP-04 | ✅ Megolm | ✅ Secret Handshake |
| **Broadcast** | ❌ Mesh needed | ✅ PubSub | ✅ Relays | ✅ Rooms | ✅ Gossip |
| **Infrastructure** | STUN/TURN server | Bootstrap nodes | Relays | Homeserver | Pubs (optional) |
| **Node.js Support** | ⚠️ wrtc (maintenance) | ✅ Excellent | ✅ nostr-tools | ✅ matrix-js-sdk | ✅ ssb-db |
| **Learning Curve** | Medium | High | Low | High | Medium |
| **Protocol Weight** | Light | Heavy | Light | Heavy | Medium |
| **Real-time** | ✅ Yes | ✅ Yes | ⚠️ Depends on relay | ✅ Yes | ❌ Eventually |

### Use Case Recommendations

| Use Case | Recommended Protocol |
|----------|---------------------|
| **Simple 1:1 agent messaging** | WebRTC (with external signaling) |
| **Agent discovery + communication** | libp2p or Nostr |
| **Large agent swarms** | libp2p (DHT + PubSub) |
| **Offline-capable agents** | SSB-inspired design |
| **Human-agent integration** | Matrix |
| **Censorship-resistant discovery** | Nostr |
| **Local network agents** | libp2p (mDNS) or SSB |
| **Browser-based agents** | WebRTC native or libp2p-webrtc |

---

## 7. Recommendation for Molt Connect

### Hybrid Approach Recommended

Based on this research, I recommend a **hybrid multi-layer architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│                     Molt Connect Stack                      │
├─────────────────────────────────────────────────────────────┤
│  Layer 3: Data Transfer                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ WebRTC Data Channels (direct P2P, encrypted, fast)  │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: Connection & Routing                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ libp2p (peer routing, NAT traversal, optional DHT)  │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Layer 1: Discovery & Signaling                             │
│  ┌───────────────────┬─────────────────────────────────┐   │
│  │ Nostr (discovery) │ mDNS (local) │ Bootstrap (known)│   │
│  └───────────────────┴─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Rationale

1. **Discovery Layer (Nostr/mDNS)**
   - Use Nostr for internet-scale agent discovery
   - Use mDNS for local network discovery
   - Lightweight, no infrastructure needed for discovery
   - Agents advertise capabilities via Nostr events

2. **Connection Layer (libp2p)**
   - Handles NAT traversal (AutoNAT, circuit relay)
   - Provides secure channels (Noise encryption)
   - Optional DHT for content routing
   - Well-tested in production systems

3. **Data Layer (WebRTC)**
   - Direct P2P for lowest latency
   - Works in browsers natively
   - Built-in encryption
   - Reliable and unreliable modes

### Implementation Path

**Phase 1: MVP**
- Use Nostr for agent discovery
- WebRTC for direct communication
- Simple WebSocket signaling server

**Phase 2: Production**
- Add libp2p for NAT traversal
- Implement relay fallback
- Add DHT for capability routing

**Phase 3: Advanced**
- SSB-inspired offline mode
- Gossip-based state propagation
- Feed-based agent history

### Key Dependencies

```json
{
  "dependencies": {
    "nostr-tools": "^2.x",          // Discovery
    "libp2p": "^1.x",               // Connection layer
    "@libp2p/webrtc": "^4.x",       // WebRTC transport
    "@libp2p/relay": "^1.x",        // Circuit relay
    "@chainsafe/libp2p-gossipsub": "^1.x"  // PubSub
  }
}
```

### Summary

For Molt Connect's agent-to-agent communication:
- **WebRTC** provides the best direct P2P data channels
- **libp2p** solves NAT traversal and provides infrastructure
- **Nostr** offers simple, censorship-resistant discovery
- **SSB** inspires offline-first design patterns
- **Matrix** is overkill unless human integration is needed

The hybrid approach gives you the best of each protocol while minimizing complexity for your specific use case.

---

*Research completed: 2026-03-27*
