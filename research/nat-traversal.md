# NAT Traversal Techniques - Research Report

**Project:** Molt Connect  
**Date:** 2026-03-27  
**Sources:** RFC 5389, RFC 5766, RFC 5245, RFC 5128, Wikipedia, Tailscale Blog, WebRTC.org, coturn/coturn

---

## Executive Summary

NAT (Network Address Translation) traversal is essential for peer-to-peer connectivity. The success rate of direct P2P connections varies by NAT type:
- **Easy NATs (Cone types):** 90-95% success rate with STUN + hole punching
- **Hard NATs (Symmetric):** 0-10% success without relay fallback
- **Overall real-world success:** ~85% with proper ICE implementation

**Key Insight:** Always implement ICE with TURN relay fallback. Never rely on STUN alone.

---

## 1. STUN (Session Traversal Utilities for NAT)

### Overview

STUN is a lightweight protocol that helps endpoints discover their public IP address and port mapping. It's defined in [RFC 5389](https://datatracker.ietf.org/doc/html/rfc5389).

### How It Works

```
┌─────────┐                    ┌─────────┐
│ Client  │                    │ STUN    │
│ (NATed) │                    │ Server  │
└────┬────┘                    └────┬────┘
     │                              │
     │  STUN Binding Request        │
     │  (from private:port)         │
     │─────────────────────────────>│
     │                              │
     │  STUN Binding Response       │
     │  (contains public IP:port)   │
     │<─────────────────────────────│
     │                              │
```

**Process:**
1. Client sends a STUN Binding Request from its local socket
2. STUN server receives the packet and sees the public IP:port (after NAT translation)
3. Server returns this mapped address in the response
4. Client now knows its "server reflexive" address

### Critical Requirement

**STUN MUST use the same socket as your main protocol.** Each socket gets a different NAT mapping. If you query STUN from a different socket, you'll get a useless answer.

### Limitations

| Limitation | Description |
|------------|-------------|
| **NAT Type Dependent** | Only works reliably with "easy" NATs (Cone types) |
| **Symmetric NAT Problem** | Different destination = different mapping, so STUN-discovered address won't work for peer connection |
| **Not a Complete Solution** | STUN is a TOOL, not a traversal solution by itself |
| **Security Vulnerabilities** | Classic STUN (RFC 3489) was vulnerable to IP spoofing; modern STUN requires ICE for security |

### Code Example (Node.js with `stun` package)

```javascript
import { createSocket } from 'dgram';
import { stunRequest } from 'stun';

const socket = createSocket('udp4');
socket.bind(12345); // Must use the same port for actual communication

const result = await stunRequest('stun.l.google.com:19302', socket);
console.log('Public address:', result.getAddress());
// Now use this socket for your actual P2P connection!
```

### STUN Servers (Free Public)

```
stun.l.google.com:19302
stun1.l.google.com:19302
stun2.l.google.com:19302
stun3.l.google.com:19302
stun4.l.google.com:19302
```

---

## 2. TURN (Traversal Using Relays around NAT)

### Overview

TURN is a relay protocol defined in [RFC 5766](https://datatracker.ietf.org/doc/html/rfc5766). When direct P2P connection fails, TURN provides a relayed path through a server.

### When TURN is Needed

```
┌─────────┐         ┌─────────┐
│ Peer A  │         │ Peer B  │
│ Symmetric NAT    Symmetric NAT
└────┬────┘         └────┬────┘
     │                   │
     │    Direct P2P fails (both behind hard NATs)
     │                   │
     │  ┌────────────────┴────────────────┐
     │  │         TURN Server             │
     │  │      (Relay Fallback)           │
     └──┤                                 ├──┘
        │  A ←→ Relay ←→ B               │
        └─────────────────────────────────┘
```

**TURN is needed when:**
- Both peers are behind symmetric NATs
- One or both NATs have endpoint-dependent filtering
- Firewall policies block direct UDP/TCP

### How TURN Works

1. **Allocation:** Client requests a "relayed transport address" from TURN server
2. **Permission:** Client creates permissions for peers to send data
3. **Channels:** (Optional) Optimized data path for high-volume traffic
4. **Relaying:** All data flows through the TURN server

### Overhead

| Metric | Value |
|--------|-------|
| **Latency** | +20-100ms (depends on server location) |
| **Bandwidth** | 2x (server handles all traffic) |
| **Server Cost** | High (must handle all relayed traffic) |
| **Setup Time** | Additional RTT for allocation/permissions |

### TURN Server Setup (coturn)

**Installation (Linux):**
```bash
apt install coturn
```

**Docker:**
```bash
docker run -d \
  -p 3478:3478 \
  -p 3478:3478/udp \
  -p 5349:5349 \
  -p 5349:5349/udp \
  -p 49152-65535:49152-65535/udp \
  coturn/coturn
```

**Configuration (`/etc/turnserver.conf`):**
```
listening-port=3478
tls-listening-port=5349
relay-ip=YOUR_PUBLIC_IP
external-ip=YOUR_PUBLIC_IP
realm=yourdomain.com
secret=YOUR_SHARED_SECRET
fingerprint
lt-cred-mech
```

### Code Example (WebRTC with TURN)

```javascript
const config = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:your-turn-server.com:3478',
      username: 'username',
      credential: 'password'
    }
  ]
};

const pc = new RTCPeerConnection(config);
```

---

## 3. ICE (Interactive Connectivity Establishment)

### Overview

ICE is the comprehensive NAT traversal framework defined in [RFC 5245](https://datatracker.ietf.org/doc/html/rfc5245). It orchestrates STUN, TURN, and hole punching to find the best path.

### How ICE Works

```
┌──────────────────────────────────────────────────────────────┐
│                    ICE ALGORITHM                              │
├──────────────────────────────────────────────────────────────┤
│ 1. GATHER CANDIDATES                                          │
│    - Host candidates (local IPs)                             │
│    - Server reflexive (via STUN)                             │
│    - Relayed candidates (via TURN)                           │
│                                                               │
│ 2. PRIORITIZE CANDIDATES                                      │
│    - Host > Server Reflexive > Relayed                       │
│    - Prefer IPv6 over IPv4                                    │
│                                                               │
│ 3. CONNECTIVITY CHECKS                                        │
│    - For each candidate pair, send STUN Binding Request      │
│    - Both sides must receive valid response                  │
│    - Discover peer reflexive candidates                      │
│                                                               │
│ 4. NOMINATE BEST PATH                                         │
│    - Controlling agent nominates successful pair             │
│    - All media flows through nominated pair                  │
│                                                               │
│ 5. KEEPALIVE                                                  │
│    - Send STUN keepalives or media to maintain binding       │
└──────────────────────────────────────────────────────────────┘
```

### Candidate Types

| Type | Source | Priority | Use Case |
|------|--------|----------|----------|
| **Host** | Local interface | Highest | Direct LAN, same NAT |
| **Server Reflexive (srflx)** | STUN response | Medium | Direct internet path |
| **Peer Reflexive (prflx)** | Discovered during ICE | Medium | NAT hairpinning |
| **Relayed (relay)** | TURN allocation | Lowest | Fallback, hard NATs |

### ICE Agent Roles

- **Controlling Agent:** The one that initiates the call; nominates the final candidate pair
- **Controlled Agent:** Responds to nominations

### Trickle ICE

Instead of waiting for all candidates, send them as discovered:

```javascript
pc.onicecandidate = (event) => {
  if (event.candidate) {
    // Send immediately to peer via signaling
    signalingChannel.send({ candidate: event.candidate });
  }
};
```

**Benefit:** Reduces connection setup time significantly.

---

## 4. Hole Punching

### UDP Hole Punching

**Process:**
1. Both peers use STUN to discover their public endpoints
2. Peers exchange endpoints via signaling server
3. Both peers simultaneously send UDP packets to each other
4. NATs create mappings, allowing bidirectional flow

```
Peer A (NAT)                    Peer B (NAT)
    │                               │
    │  ─── UDP to B:port ───>      │  (Blocked by NAT)
    │                               │
    │      <─── UDP to A:port ───   │  (Blocked by NAT)
    │                               │
    │  ─── UDP to B:port ───>      │  (Allowed! NAT B has mapping)
    │                               │
    │      <─── UDP to A:port ───   │  (Allowed! NAT A has mapping)
    │                               │
    │  <════ Bidirectional! ════>  │
```

### TCP Hole Punching

More complex due to TCP's connection semantics:

1. Both peers bind to known ports
2. Both initiate simultaneous TCP SYN to each other
3. NATs create mappings during SYN exchange
4. Connection establishes

**Challenge:** Requires:
- NAT port preservation (same port on both sides)
- Simultaneous open support
- Predictable port assignment

**Success Rate:** Lower than UDP (requires cooperative NATs)

### Problematic NAT Types for Hole Punching

| NAT Type | UDP Success | TCP Success | Notes |
|----------|-------------|-------------|-------|
| Full Cone | ✅ High | ✅ High | Most permissive |
| Restricted Cone | ✅ High | ⚠️ Medium | Requires prior outbound |
| Port-Restricted Cone | ✅ High | ⚠️ Medium | Most common consumer NAT |
| Symmetric | ❌ Low | ❌ Very Low | Different mapping per destination |

---

## 5. NAT Types Comparison

### Detailed Breakdown

| NAT Type | Mapping Behavior | Filtering Behavior | Hole Punching |
|----------|------------------|-------------------|---------------|
| **Full Cone** | Same public port for all destinations | Any external host can send | Easy |
| **Restricted Cone** | Same public port for all destinations | Only hosts that received traffic | Easy |
| **Port-Restricted Cone** | Same public port for all destinations | Only specific IP:port pairs | Easy |
| **Symmetric** | Different port per destination | Only recipient of traffic can reply | **Hard** |

### RFC 4787 Terminology (Preferred)

Modern specs use mapping/filtering behavior:

| Behavior Type | Description |
|---------------|-------------|
| **Endpoint-Independent Mapping** | Same external endpoint for all destinations (Cone NATs) |
| **Address-Dependent Mapping** | Different port for each destination IP (some Symmetric) |
| **Address-and-Port-Dependent Mapping** | Different port for each destination IP:port (Symmetric) |

### Detecting NAT Type

```javascript
// Use multiple STUN servers to detect NAT behavior
const stunServers = [
  'stun.l.google.com:19302',
  'stun1.l.google.com:19302',
  'stun2.l.google.com:19302'
];

// If all return same mapped address: Cone NAT
// If different addresses: Symmetric NAT
```

### Real-World Distribution (Approximate)

| NAT Type | Home Networks | Corporate | Mobile |
|----------|---------------|-----------|--------|
| Full/Restricted Cone | 60% | 10% | 5% |
| Port-Restricted Cone | 30% | 30% | 25% |
| Symmetric | 10% | 60% | 70% |

**Trend:** Symmetric NATs are increasing, especially in mobile networks.

---

## 6. Relay Fallback Architecture

### Simplest Relay Design

**Principle:** Make relays "dumb pipes" - they just forward data, no application logic.

```
┌─────────────────────────────────────────────────────────────┐
│                     RELAY ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│   ┌──────────┐    WebSocket/QUIC    ┌──────────┐            │
│   │  Peer A  │◄═════════════════════►│          │            │
│   └──────────┘                       │          │            │
│                                      │  RELAY   │            │
│   ┌──────────┐    WebSocket/QUIC    │  SERVER  │            │
│   │  Peer B  │◄═════════════════════►│          │            │
│   └──────────┘                       │          │            │
│                                      └──────────┘            │
│                                                               │
│   Relay responsibilities:                                     │
│   1. Accept connections from authenticated peers              │
│   2. Maintain peer ID → connection mapping                    │
│   3. Forward packets between peers                            │
│   4. Optionally: rate limiting, bandwidth tracking            │
│                                                               │
│   Relay does NOT:                                             │
│   - Understand application protocol                           │
│   - Inspect packet contents                                   │
│   - Store data                                                │
│   - Perform complex routing                                   │
└─────────────────────────────────────────────────────────────┘
```

### DERP-Style Relay (Tailscale's Approach)

DERP (Detour Encrypted Routing Protocol):

1. **Global Relay Network:** Multiple relay servers worldwide
2. **Latency-Based Selection:** Client chooses nearest relay
3. **Encrypted Tunnel:** TLS between client and relay
4. **HTTP/2 Framing:** Efficient multiplexing over single connection

**Benefits:**
- Zero config (auto-discovery)
- Works through any firewall allowing HTTPS
- Geographic distribution reduces latency

### Implementation Considerations

| Factor | Recommendation |
|--------|----------------|
| **Protocol** | WebSocket or QUIC for web; custom UDP for native |
| **Authentication** | JWT tokens with short expiry |
| **Scaling** | Stateless relays with distributed registry |
| **Cost Optimization** | Only use relay when direct path fails |

---

## 7. Practical Implementation for Node.js

### Recommended Libraries

| Library | Use Case | Maturity |
|---------|----------|----------|
| **werift** | Full WebRTC implementation | Production-ready |
| **node-datachannel** | libdatachannel bindings | Production-ready |
| **stun** | Pure STUN client | Simple, stable |
| **node-turn** | TURN client | Basic |
| **simple-peer** | WebRTC wrapper for Node | Easy to use |

### Complete ICE Implementation Example

```javascript
import { RTCPeerConnection } from 'werift';

class P2PConnection {
  constructor(signalingChannel, isInitiator) {
    this.pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        {
          urls: 'turn:your-turn-server.com:3478',
          username: process.env.TURN_USER,
          credential: process.env.TURN_PASS
        }
      ]
    });
    
    this.signalingChannel = signalingChannel;
    this.isInitiator = isInitiator;
    
    this.setupICEHandlers();
  }
  
  setupICEHandlers() {
    // Trickle ICE - send candidates as discovered
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.signalingChannel.send({
          type: 'ice-candidate',
          candidate: event.candidate
        });
      }
    };
    
    // Connection state changes
    this.pc.onconnectionstatechange = () => {
      console.log('Connection state:', this.pc.connectionState);
      if (this.pc.connectionState === 'connected') {
        console.log('P2P connection established!');
      }
    };
  }
  
  async initiate() {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    
    this.signalingChannel.send({
      type: 'offer',
      sdp: offer
    });
  }
  
  async handleOffer(offer) {
    await this.pc.setRemoteDescription(offer);
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    
    this.signalingChannel.send({
      type: 'answer',
      sdp: answer
    });
  }
  
  async handleAnswer(answer) {
    await this.pc.setRemoteDescription(answer);
  }
  
  async addRemoteCandidate(candidate) {
    try {
      await this.pc.addIceCandidate(candidate);
    } catch (e) {
      console.error('Failed to add ICE candidate:', e);
    }
  }
}
```

### Signaling Server Example (WebSocket)

```javascript
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });
const rooms = new Map();

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    const message = JSON.parse(data);
    
    switch (message.type) {
      case 'join':
        // Add to room
        if (!rooms.has(message.room)) {
          rooms.set(message.room, new Set());
        }
        rooms.get(message.room).add(ws);
        ws.roomId = message.room;
        break;
        
      case 'offer':
      case 'answer':
      case 'ice-candidate':
        // Forward to other peers in room
        const room = rooms.get(ws.roomId);
        if (room) {
          for (const client of room) {
            if (client !== ws) {
              client.send(JSON.stringify(message));
            }
          }
        }
        break;
    }
  });
});
```

### Testing NAT Traversal

```javascript
// Test script to verify ICE is working
async function testICE() {
  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'turn:your-server.com:3478', username: 'test', credential: 'test' }
    ]
  });
  
  pc.onicecandidate = (e) => {
    if (e.candidate) {
      const type = e.candidate.type;
      console.log(`Found ${type} candidate:`, e.candidate.address);
    }
  };
  
  pc.onicegatheringstatechange = () => {
    console.log('ICE gathering state:', pc.iceGatheringState);
  };
  
  // Trigger gathering
  await pc.createDataChannel('test');
  await pc.createOffer().then(offer => pc.setLocalDescription(offer));
  
  // Wait for gathering to complete
  await new Promise(resolve => {
    if (pc.iceGatheringState === 'complete') resolve();
    pc.onicegatheringstatechange = () => {
      if (pc.iceGatheringState === 'complete') resolve();
    };
  });
  
  console.log('ICE gathering complete!');
}
```

---

## 8. Recommendations for Molt Connect

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    MOLT CONNECT ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. SIGNALING SERVER (Moltbook infrastructure)                   │
│     - WebSocket/HTTP long-poll for peer discovery                │
│     - Exchange ICE candidates (SDP offer/answer)                 │
│     - Minimal bandwidth, can be cheap VPS                        │
│                                                                   │
│  2. STUN SERVERS (Use public Google STUN)                        │
│     - Free, reliable, globally distributed                       │
│     - No cost to Molt Connect                                    │
│                                                                   │
│  3. TURN SERVERS (Self-hosted coturn on cheap VPS)               │
│     - Deploy to multiple regions                                 │
│     - Start with 1-2 regions, scale as needed                    │
│     - Estimate: $10-20/month per region                          │
│                                                                   │
│  4. CLIENT IMPLEMENTATION                                         │
│     - Use werift or node-datachannel                             │
│     - Implement full ICE with TURN fallback                      │
│     - Connection priority: Host > srflx > relay                  │
│                                                                   │
│  5. RELAY OPTIMIZATION                                            │
│     - Monitor relay usage                                        │
│     - Alert when relay usage > 20% (indicates NAT issues)        │
│     - Consider DERP-style geographic distribution                │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Success Rate Expectations

| Scenario | Expected Success Rate |
|----------|----------------------|
| Both peers on home internet | 95% direct, 5% relay |
| One mobile, one home | 85% direct, 15% relay |
| Both mobile | 70% direct, 30% relay |
| Corporate networks | 50% direct, 50% relay |

### Implementation Priority

1. **Phase 1:** Basic ICE with STUN only
   - Implement STUN-based address discovery
   - Simple hole punching
   - Works for most home users

2. **Phase 2:** Add TURN relay
   - Deploy coturn server
   - Implement TURN client
   - Handle all NAT types

3. **Phase 3:** Optimization
   - Multiple TURN regions
   - Latency-based relay selection
   - Connection migration

### Cost Estimates

| Component | Monthly Cost |
|-----------|--------------|
| Signaling server (small VPS) | $5-10 |
| TURN server (medium VPS) | $10-20 per region |
| Bandwidth (TURN relay) | $0.05-0.10 per GB |

**Initial budget:** $20-50/month for global coverage

---

## 9. Key Takeaways

1. **Always use ICE** - It's the standard for NAT traversal
2. **Always have TURN** - Without relay fallback, 10-30% of connections fail
3. **Use public STUN** - Google's STUN servers are free and reliable
4. **Self-host TURN** - Third-party TURN is expensive; coturn is production-ready
5. **Monitor relay usage** - High relay usage indicates NAT problems
6. **Plan for mobile** - Mobile networks have increasingly hard NATs

---

## References

- [RFC 5389 - STUN](https://datatracker.ietf.org/doc/html/rfc5389)
- [RFC 5766 - TURN](https://datatracker.ietf.org/doc/html/rfc5766)
- [RFC 5245 - ICE](https://datatracker.ietf.org/doc/html/rfc5245)
- [RFC 5128 - P2P Communication across NATs](https://www.rfc-editor.org/rfc/rfc5128)
- [RFC 4787 - NAT Behavioral Requirements](https://datatracker.ietf.org/doc/html/rfc4787)
- [Tailscale: How NAT Traversal Works](https://tailscale.com/blog/how-nat-traversal-works/)
- [WebRTC.org: Peer Connections](https://webrtc.org/getting-started/peer-connections)
- [coturn TURN Server](https://github.com/coturn/coturn)
