# A2A Protocol Analysis

## What is A2A?

**Agent2Agent (A2A)** is an open protocol by Google (Linux Foundation) enabling AI agents to communicate.

**Repository:** https://github.com/a2aproject/A2A
**License:** Apache 2.0
**SDKs:** Python, Go, JavaScript, Java, .NET

---

## Key Features

| Feature | A2A Approach |
|---------|--------------|
| **Transport** | JSON-RPC 2.0 over HTTP(S) |
| **Discovery** | Agent Cards (JSON metadata) |
| **Interaction** | Sync, Streaming (SSE), Async push |
| **Security** | Auth, encryption via HTTPS |
| **Opacity** | Agents don't expose internal state |
| **Data Types** | Text, files, structured JSON |

---

## What A2A Solves

- **Discovery**: Agent Cards describe capabilities
- **Capability negotiation**: Agents know what each other can do
- **Long-running tasks**: Async workflows with push notifications
- **Enterprise features**: Auth, observability, security

---

## What A2A Lacks (Molt Connect's Opportunity)

| Gap | Molt Connect Solution |
|-----|----------------------|
| **P2P** | WebRTC/libp2p direct connections |
| **Decentralized** | No central server needed |
| **Offline-first** | Works without internet |
| **Three-word addresses** | Human-readable agent addresses |
| **Permission prompts** | User approval for connections |
| **Context sync** | Structured memory sharing |

---

## Recommendation: Hybrid Approach

**Use A2A message format, add P2P transport.**

### What to Adopt from A2A:
1. **Agent Cards** - Standard format for capability discovery
2. **JSON-RPC 2.0** - Message format
3. **Task model** - Long-running task handling
4. **Capability negotiation** - Let agents know what each other can do

### What to Add (Molt Connect):
1. **P2P transport** - WebRTC/libp2p instead of HTTP
2. **Three-word addresses** - Human-readable identity
3. **Permission-first** - User must approve connections
4. **E2E encryption** - Noise protocol on top
5. **Context sync** - Memory/state sharing primitives

---

## Architecture: A2A + P2P

```
┌─────────────────────────────────────────────────────────────┐
│                      MOLT CONNECT                           │
├─────────────────────────────────────────────────────────────┤
│  Application Layer: A2A Protocol                            │
│  - Agent Cards (discovery)                                  │
│  - JSON-RPC 2.0 (message format)                            │
│  - Task model (long-running operations)                     │
├─────────────────────────────────────────────────────────────┤
│  Security Layer: Noise XK + Ed25519                         │
│  - E2E encryption                                           │
│  - Authentication                                           │
├─────────────────────────────────────────────────────────────┤
│  Transport Layer: P2P (WebRTC/libp2p)                       │
│  - Direct connections                                       │
│  - NAT traversal (ICE)                                      │
│  - Relay fallback                                           │
├─────────────────────────────────────────────────────────────┤
│  Identity Layer: Three-word addresses                       │
│  - BIP39 word mapping                                       │
│  - Ed25519 fingerprint                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: A2A Compatibility Layer
- Implement Agent Card format
- Implement JSON-RPC 2.0 message format
- Support A2A task model

### Phase 2: P2P Transport
- Add WebRTC/libp2p transport
- Keep A2A message format
- Bridge HTTP ↔ P2P

### Phase 3: Molt Connect Extensions
- Three-word addresses
- Permission prompts
- Context sync primitives

---

## Why This Approach Wins

1. **Interoperability**: Can talk to A2A agents (via HTTP bridge)
2. **P2P**: Direct connections without servers
3. **Standards-based**: Uses proven A2A + MCP patterns
4. **Differentiated**: P2P + offline + permissions = unique value

---

## References

- A2A GitHub: https://github.com/a2aproject/A2A
- A2A Spec: https://a2a-protocol.org/latest/specification/
- A2A Python SDK: https://github.com/a2aproject/a2a-python
- DeepLearning course: https://goo.gle/dlai-a2a

---

*We're not building from scratch. We're extending A2A with P2P.*
