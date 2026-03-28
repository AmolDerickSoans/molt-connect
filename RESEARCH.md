# Molt Connect Research Summary

**Phase 1 Complete** | 2026-03-27  
**Implementation Complete** | 2026-03-27
**GitHub Published** | 2026-03-27

---

## Final Status: PRODUCT COMPLETE ✅

**GitHub:** https://github.com/AmolDerickSoans/molt-connect

---

## Implementation Results

### What Was Built
| Component | Status | Notes |
|-----------|--------|-------|
| Ed25519 Identity | ✅ Done | Key generation, signing, verification |
| Three-word addresses | ✅ Done | Derived from public key fingerprint |
| A2A Protocol | ✅ Done | JSON-RPC 2.0 compatible |
| P2P Messaging | ✅ Done | Direct agent-to-agent |
| Permission system | ✅ Done | PermissionManager with prompts |
| CLI commands | ✅ Done | whoami, listen, send, add, list, trust, block |
| OpenClaw skill | ✅ Done | Installed at ~/.agents/skills/molt-connect |
| Git repo | ✅ Done | Published to GitHub |
| Desktop app | ✅ Done | Electron app with DMG release |

### Key Implementation Decisions
1. **Address format**: Three-word derived from Ed25519 public key hash
2. **Message signing**: All messages signed with Ed25519
3. **Address spoofing prevention**: Signature verified against public key
4. **Dev mode**: `MOLT_DEV_MODE=true` allows localhost testing
5. **Config isolation**: `MOLT_CONFIG_DIR` for per-agent identity storage

### Bugs Fixed During Implementation
1. **Signature payload mismatch** - Sender/receiver used different formats
2. **Identity caching** - CONFIG_DIR evaluated at module load, not runtime
3. **Import error** - `verifyAddressBinding` not exported from correct module

### Latest Test Results (11:17 AM IST - Mar 28)
```
Agent 1: @also-zircon-book (port 4001)
Agent 2: @book-flow-coral (port 4002)

A → B: "Hello from Agent 1!" ✅ (verified signature)
B → A: "Hi back from Agent 2!" ✅ (verified signature)
```

**Total: 17 consecutive test runs passing** (Mar 27-28, 2026)

---

## Test History (All Passing)

| Time | Agent 1 | Agent 2 | Status |
|------|---------|---------|--------|
| 12:55 PM Mar 27 | @bomb-krypton-yellow | @ivory-lima-sierra | ✅ |
| 2:02 PM | @alpha-most-joy | @papa-acid-more | ✅ |
| 3:03 PM | @mail-bone-lima | @dark-lotus-amber | ✅ |
| 4:03 PM | @bravo-dark-fort | @suit-india-river | ✅ |
| 5:05 PM | @ocean-name-such | @india-aged-main | ✅ |
| 6:07 PM | @lotus-much-river | @forest-india-hotel | ✅ |
| 7:16 PM | @step-five-frost | @krystal-mail-debt | ✅ |
| 10:00 PM | @jade-river-ford | @aged-baby-bone | ✅ |
| 11:23 PM | @foot-kilo-army | @boom-peace-stop | ✅ |
| 12:24 AM Mar 28 | @bath-love-deal | @jungle-beat-krypton | ✅ |
| 1:25 AM | @boom-more-bank | @india-baby-zircon | ✅ |
| 4:39 AM | @valley-blaze-sure | @amber-much-both | ✅ |
| 6:01 AM | @wind-data-foxtrot | @such-onyx-oscar | ✅ |
| 7:42 AM | @dear-romeo-umber | @jungle-dune-glimmer | ✅ |
| 8:58 AM | @umber-topaz-foxtrot | @magenta-male-onyx | ✅ |
| 10:10 AM | @xray-romeo-bath | @take-joy-hemlock | ✅ |
| 11:17 AM | @also-zircon-book | @book-flow-coral | ✅ |

---

## Remaining (User Actions)

| Task | Command |
|------|---------|
| npm publish | `npm adduser && npm publish --access public` |
| ClawHub publish | `clawhub login && clawhub publish` |
| Website fix | Investigate 401 on Vercel |
| Outreach | Templates ready in outreach/ |

---

5 research agents investigated key areas for Molt Connect. Here's the synthesis.

---

## 1. P2P Protocols

**Recommendation: Hybrid Stack**
| Layer | Protocol | Why |
|-------|----------|-----|
| Discovery | Nostr + mDNS | Nostr for internet, mDNS for LAN |
| Connection | libp2p | Built-in NAT traversal, routing |
| Data | WebRTC | Direct P2P channels with encryption |

**Key Insights:**
- WebRTC requires external signaling (we can use Nostr)
- libp2p is heavy but solves most P2P problems (used by IPFS, Ethereum)
- Nostr is simple (WebSockets + JSON) and great for discovery
- SSB patterns useful for offline-first design

**Full report:** `research/protocols.md`

---

## 2. Cryptographic Protocols

**Recommendation: Noise Protocol (XK Pattern)**

| Approach | Verdict |
|----------|---------|
| Signal Protocol | Overkill for P2P with known peers |
| Noise XK | Recommended - best balance |
| Simple ECDH | Too simple, no forward secrecy |

**Key Insights:**
- Signal designed for async messaging with server-mediated prekeys
- Noise XK provides: mutual auth, forward secrecy (per-session), simpler implementation
- Message encryption: ChaCha20-Poly1305 (28 bytes overhead)
- Optional signing: Ed25519 (64 bytes overhead)

**Full report:** `research/crypto.md`

---

## 3. NAT Traversal

**Recommendation: Full ICE with TURN Fallback**

| Metric | Value |
|--------|-------|
| P2P success rate | ~85% with ICE + TURN |
| Relay needed | 10-30% of connections |
| Infrastructure cost | $20-50/month |
| Stack | werift + coturn + Google STUN |

**Key Insights:**
- Never rely on STUN alone
- Symmetric NAT is the hardest (~15% of users)
- TURN servers are dumb pipes - no data storage
- WebRTC's ICE handles complexity automatically

**Full report:** `research/nat-traversal.md`

---

## 4. Existing Solutions

**Critical Finding: No standard exists for P2P agent-to-agent communication.**

Molt Connect's opportunity: be the "USB-C for AI agents" but truly P2P.

**What to Steal:**
| From | Pattern |
|------|---------|
| libp2p | Modular transport, multiaddress |
| MCP | Capability negotiation, tools/resources abstraction |
| Farcaster | Hybrid on-chain/off-chain identity |
| Beaker/Hyper | Public key addressing, versioned logs |
| Telegram Bot API | JSON simplicity, dual delivery modes |

**Message Format:** JSON-RPC 2.0

**Full report:** `research/existing-solutions.md`

---

## 5. Addressing Schemes

**Recommendation: Ed25519 Fingerprint → 3-word Mapping**

| Component | Choice |
|-----------|--------|
| Word list | BIP39 (2048 words, open standard) |
| Combinations | 8.6 billion |
| Collision probability | 44% at 1M users |
| Uniqueness | Kademlia DHT for registration |

**Key Insights:**
- BIP39 is battle-tested (millions of crypto users)
- What3Words is proprietary - can't use
- PGP Word List too small (512 words)
- Collision math: birthday paradox applies
- For global uniqueness: derive 3-word from public key fingerprint, register in DHT

**Full report:** `research/addressing.md`

---

## Synthesis: Technical Decisions

Based on research, these decisions are confirmed:

1. **Identity**: Ed25519 keypair (fingerprint → 3-word address)
2. **Discovery**: Nostr relays (internet) + mDNS (LAN)
3. **Transport**: libp2p (or WebRTC directly with Nostr signaling)
4. **Encryption**: Noise XK pattern
5. **NAT Traversal**: ICE with TURN fallback
6. **Message Format**: JSON-RPC 2.0
7. **Uniqueness**: DHT registration (optional for local-only)

---

## Open Questions

1. **libp2p vs WebRTC directly?** 
   - libp2p: more features, heavier
   - WebRTC + Nostr signaling: lighter, more control
   - Need to prototype both

2. **DHT for address registration?**
   - Adds complexity
   - Alternative: local-only uniqueness + public key verification

3. **Context sync format?**
   - Standardize on OpenClaw MEMORY.md format?
   - Or create neutral format?

---

## Next Steps

Phase 2: Design
- [ ] Write SPEC.md (technical specification)
- [ ] Write SKILL_API.md (skill interface)
- [ ] Write PROTOCOL.md (wire format)
- [ ] Write SCHEMAS.md (data structures)
- [ ] Write ROADMAP.md (milestones)

---

*Research phase complete. Ready for design phase.*
