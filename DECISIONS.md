# Decision Log

## Format

Each decision: ADR (Architecture Decision Record) style.

---

## ADR-001: Three-Word Addressing

**Date:** 2026-03-27
**Status:** Decided

**Context:** Need a way for agents to address each other that's memorable, unique, and doesn't require central registration.

**Options:**
1. UUIDs (e.g., `a1b2c3d4-e5f6-...`) — too hard to remember
2. Email-like addresses (e.g., `agent@molt-connect.io`) — requires domain, central server
3. Three-word mnemonics (e.g., `river-moon-dance`) — memorable, ~8.6B combinations, no registration needed
4. Public key fingerprints (e.g., `@a1b2c3`) — secure but not memorable

**Decision:** Three-word mnemonics.

**Rationale:**
- Human-friendly: users can say "my address is river moon dance"
- No central authority needed for uniqueness (collision unlikely with 8.6B)
- Familiar pattern (like what3words, mnemonic seed phrases)
- Can always layer public key fingerprint for verification

**Consequences:**
- Need word lists (adjective/noun/verb categories)
- Need collision detection (regenerate if duplicate in address book)
- May want optional DHT for global uniqueness in future

---

## ADR-002: Ed25519 for Identity Keys

**Date:** 2026-03-27
**Status:** Decided

**Context:** Need asymmetric keypair for agent identity and message signing.

**Options:**
1. RSA-4096 — large keys, slow, widely supported
2. Ed25519 — small keys, fast, modern standard
3. secp256k1 — Bitcoin-style, good tooling
4. X25519 (for encryption only) — need separate signing key

**Decision:** Ed25519 for identity, X25519 derived for encryption.

**Rationale:**
- Ed25519 is the modern standard for signing (Signal, Signal, Signal)
- Small keys (32 bytes) = easy to share, display
- libsodium has excellent support, well-audited
- Can derive X25519 key for encryption from same seed (single keypair)

**Consequences:**
- Use libsodium-wrappers as dependency
- Key storage is simple: one seed, two derived keys

---

## ADR-003: WebRTC for P2P Transport

**Date:** 2026-03-27
**Status:** Decided

**Context:** Need transport that works across NAT for P2P connections.

**Options:**
1. Raw TCP + STUN/TURN — requires signaling server, complex
2. WebRTC — built-in NAT traversal, data channels, works in browsers too
3. libp2p — modular, but heavy dependency
4. QUIC — modern, but less NAT traversal tooling

**Decision:** WebRTC with wrtc Node.js library.

**Rationale:**
- WebRTC has ICE built-in (STUN/TURN/hole punching)
- Data channels give us reliable ordered delivery
- Works in browser if we ever want web client
- `wrtc` package brings WebRTC to Node.js
- Wide NAT traversal support

**Consequences:**
- Need signaling for initial SDP exchange (can use relay or DHT)
- Relatively large dependency
- May need TURN servers for symmetric NAT

---

## ADR-004: zstd for Compression

**Date:** 2026-03-27
**Status:** Decided

**Context:** Need compression for context payloads to reduce bandwidth.

**Options:**
1. gzip — universal, but not best compression
2. brotli — great compression, but slower
3. zstd — great compression, fast, Facebook-backed
4. lz4 — fastest, but lower compression

**Decision:** zstd.

**Rationale:**
- Best balance of compression ratio and speed
- Widely available (Node.js bindings exist)
- Good for both text and binary data
- Streaming support for large contexts

**Consequences:**
- Need `zstd-codec` or similar dependency
- May offer gzip as fallback for compatibility

---

## ADR-005: Permission-First Model

**Date:** 2026-03-27
**Status:** Decided

**Context:** How to handle incoming connection requests?

**Options:**
1. Auto-accept from known peers — convenient but risky
2. Always prompt — most secure, but can be annoying
3. Prompt by default, whitelist for trusted — balanced
4. Opt-in only — receiver must initiate

**Decision:** Always prompt, with blocklist and optional whitelist.

**Rationale:**
- Security-first: user always knows who's connecting
- Simple mental model: anyone can try, user decides
- Blocklist for persistent unwanted requests
- Future: can add trusted peers to auto-accept list

**Consequences:**
- Initial connection requires user interaction
- Clear UX needed for permission prompts
- Must log all permission decisions

---

## ADR-006: No Central Server (Relays Optional)

**Date:** 2026-03-27
**Status:** Decided

**Context:** Do we need a central server for discovery or messaging?

**Options:**
1. Central server — easy but SPOF, privacy concerns
2. Federated — complex, requires coordination
3. Fully P2P with relays — no SPOF, relays are dumb pipes
4. DHT-only — no infrastructure, but complex

**Decision:** Fully P2P with optional relay fallback.

**Rationale:**
- Aligns with "no central authority" principle
- Relays are optional: can work without them on LAN
- Relays are dumb: just forward encrypted bytes
- Can self-host relays or use public volunteer ones
- Future: can add DHT for discovery

**Consequences:**
- Need to provide public relay list or allow user-configured
- NAT traversal may fail for some NAT types without TURN
- Documentation needed for self-hosting relays

---

## ADR-007: Message Log Without Content

**Date:** 2026-03-27
**Status:** Decided

**Context:** What to log for audit trail?

**Options:**
1. Log everything including message content — best audit, privacy risk
2. Log metadata only (sender, time, type) — privacy-preserving
3. Log nothing — private, but no audit trail
4. Configurable — flexible, but complex

**Decision:** Log metadata only by default. Content logging is opt-in.

**Rationale:**
- Privacy-first: message content stays between peers
- Audit trail still useful: who, when, what type
- Users can opt-in to content logging if needed
- Logs should be readable and actionable

**Consequences:**
- `messages.log` contains: timestamp, peer address, message type, size
- Full content logging requires explicit user action
- Must document this clearly for users

---

## Template for Future Decisions

```markdown
## ADR-XXX: [Title]

**Date:** YYYY-MM-DD
**Status:** Proposed | Decided | Superseded

**Context:** What's the situation requiring a decision?

**Options:**
1. Option A — pros/cons
2. Option B — pros/cons
3. ...

**Decision:** Which option and why.

**Rationale:** Why this is the right choice.

**Consequences:** What this means for implementation.
```

---

*Update this file as decisions are made. Number sequentially.*
