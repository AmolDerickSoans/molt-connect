# Molt Connect Phase 2 - Development Roadmap

**Version:** 1.0  
**Created:** 2026-03-27  
**Status:** Ready for Execution

---

## Overview

Molt Connect enables secure, peer-to-peer communication between OpenClaw agents using three-word addresses, end-to-end encryption, and context sharing.

**Total Duration:** 6 weeks (6 milestones × 1 week each)  
**Buffer:** 1 week built into testing phase  
**Target Ship Date:** 8 weeks from kickoff

---

## Milestones

### M1: Core Foundation
**Goal:** Build address generation, validation, and cryptographic primitives  
**Duration:** 1 week  
**Dependencies:** None (starting point)

#### Deliverables
- [ ] Address generator with 8.6B combinations
- [ ] Address validator (format + collision detection)
- [ ] Address book storage (JSON-based)
- [ ] Key manager (Ed25519 keypair generation/storage)
- [ ] Session crypto (X25519 + ChaCha20-Poly1305)
- [ ] Signature manager (sign/verify)

#### Success Criteria
- `molt-whoami` generates and displays unique address
- Keys persist across restarts in `~/.molt-connect/`
- Unit tests pass with >80% coverage for address/crypto modules

---

### M2: Network Layer
**Goal:** Implement peer discovery and connection establishment  
**Duration:** 1 week  
**Dependencies:** M1 (needs address + crypto for HELLO messages)

#### Deliverables
- [ ] Discovery service (mDNS for LAN + DHT for WAN)
- [ ] NAT puncher (STUN-based hole punching)
- [ ] Relay client (fallback connection)
- [ ] Connection manager (track state, handle reconnects)
- [ ] Connection persistence (survive brief outages)

#### Success Criteria
- Two agents on same LAN discover each other
- NAT traversal works for common NAT types (full cone, restricted)
- Relay fallback activates when direct connection fails
- Connection survives 30s network interruption

---

### M3: Protocol Layer
**Goal:** Define and implement message protocol with compression  
**Duration:** 1 week  
**Dependencies:** M1, M2 (needs encryption + transport)

#### Deliverables
- [ ] Message types enum (HELLO, MESSAGE, CONTEXT_*, QUERY, BYE, PING)
- [ ] Message framing (version, type, timestamp, payload, signature)
- [ ] Compression module (zstd for context payloads)
- [ ] Context sync (extract entities, summarize, compress)
- [ ] Query/response protocol

#### Success Criteria
- Messages framed correctly with signature verification
- Context compression achieves >50% size reduction
- Query mode works (question sent, response received)
- Protocol handles malformed messages gracefully

---

### M4: Skill Interface
**Goal:** Build user-facing commands and permission system  
**Duration:** 1 week  
**Dependencies:** M1, M2, M3 (full stack needed)

#### Deliverables
- [ ] `moltmessage` command with all flags
- [ ] `moltbook` address book management
- [ ] Permission prompt UI (Allow/Deny/Block)
- [ ] Blocklist storage and enforcement
- [ ] Logging system (connections, messages, permissions)

#### Success Criteria
- `moltmessage @addr msg` sends and delivers message
- Permission prompt shows sender address + message
- Block silently rejects connections from blocked addresses
- All logs viewable and understandable

---

### M5: Testing & Polish
**Goal:** Comprehensive testing, bug fixes, documentation  
**Duration:** 1 week + 1 week buffer  
**Dependencies:** M1-M4 complete

#### Deliverables
- [ ] Unit tests (>80% coverage all modules)
- [ ] Integration tests (happy paths)
- [ ] Error path tests
- [ ] Manual QA test pass
- [ ] README.md, PROTOCOL.md, API docs
- [ ] Bug fixes and polish

#### Success Criteria
- All automated tests pass
- Manual test matrix complete (see SUCCESS_CRITERIA.md)
- Security tests pass (replay, tampering, MITM detection)
- Documentation complete and reviewed

---

### M6: Ship & Launch
**Goal:** Package, publish, announce  
**Duration:** 1 week  
**Dependencies:** M5 signed off

#### Deliverables
- [ ] package.json finalized, version 1.0.0
- [ ] ClawHub submission with listing
- [ ] Announcement posts (Moltbook, X)
- [ ] Demo video or screenshots
- [ ] Acceptance test passes on fresh instances

#### Success Criteria
- `openclaw skill install molt-connect` works
- Community can find, install, use independently
- Acceptance test (SUCCESS_CRITERIA.md) passes

---

## Sprint Breakdown

### Sprint 1: M1 - Core Foundation (Week 1)

| Day | Goal | Tasks | Owner |
|-----|------|-------|-------|
| Mon | Address generation | Word lists, generator logic, collision check | Address Module |
| Tue | Address validation | Format validation, address book storage | Address Module |
| Wed | Key management | Ed25519 keypair gen, storage, loading | Crypto Module |
| Thu | Session crypto | X25519 + ChaCha20, shared secret derivation | Crypto Module |
| Fri | Signatures + tests | Sign/verify, unit tests, `molt-whoami` | Crypto Module |

**Sprint Goal:** Generate address, manage keys, `molt-whoami` works.

---

### Sprint 2: M2 - Network Layer (Week 2)

| Day | Goal | Tasks | Owner |
|-----|------|-------|-------|
| Mon | LAN discovery | mDNS implementation, peer announcement | Network Module |
| Tue | NAT traversal | STUN integration, hole punching logic | Network Module |
| Wed | Relay protocol | Relay client, fallback logic | Network Module |
| Thu | Connection manager | State tracking, reconnect handling | Network Module |
| Fri | Integration tests | Multi-agent connection tests | Network Module |

**Sprint Goal:** Discover peers, establish connections (direct or relayed).

---

### Sprint 3: M3 - Protocol Layer (Week 3)

| Day | Goal | Tasks | Owner |
|-----|------|-------|-------|
| Mon | Message types | Define enum, framing format | Protocol Module |
| Tue | Message framing | Serialize/deserialize, signature embedding | Protocol Module |
| Wed | Compression | zstd integration, context compression | Protocol Module |
| Thu | Context sync | Entity extraction, summarization | Protocol Module |
| Fri | Query protocol | Query/response flow, integration tests | Protocol Module |

**Sprint Goal:** Send structured, signed, compressed messages.

---

### Sprint 4: M4 - Skill Interface (Week 4)

| Day | Goal | Tasks | Owner |
|-----|------|-------|-------|
| Mon | moltmessage command | CLI parsing, message sending | Skill Interface |
| Tue | moltbook command | Address book CRUD operations | Skill Interface |
| Wed | Permission system | Prompt UI, Allow/Deny/Block logic | Skill Interface |
| Thu | Blocklist + logging | Blocklist storage, log rotation | Skill Interface |
| Fri | End-to-end test | Full flow test, polish | All Modules |

**Sprint Goal:** User-facing commands work, permissions enforced.

---

### Sprint 5: M5 - Testing & Polish (Week 5-6)

| Day | Goal | Tasks | Owner |
|-----|------|-------|-------|
| Mon | Unit tests | Coverage gaps, edge cases | QA Agent |
| Tue | Integration tests | Happy path scenarios | QA Agent |
| Wed | Error tests | Malformed messages, timeouts, failures | QA Agent |
| Thu | Security tests | Replay, tampering, MITM | Crypto Module |
| Fri | Documentation | README, PROTOCOL, API docs | All Modules |
| Mon | Bug fixes | Address issues from testing | Relevant Modules |
| Tue | Polish | Error messages, UX refinements | Skill Interface |
| Wed | Manual QA | Run test matrix from SUCCESS_CRITERIA.md | QA Agent |
| Thu | Buffer day | Catch-up for any delayed items | All |
| Fri | Sign-off | Final review, ready to ship | Lead Agent |

**Sprint Goal:** All tests pass, docs complete, bugs fixed.

---

### Sprint 6: M6 - Ship & Launch (Week 7)

| Day | Goal | Tasks | Owner |
|-----|------|-------|-------|
| Mon | Package prep | package.json, .npmignore, version bump | Lead Agent |
| Tue | ClawHub submission | Listing, screenshots, demo | Lead Agent |
| Wed | Acceptance test | Fresh install test on multiple machines | QA Agent |
| Thu | Announcements | Moltbook post, X post | Lead Agent |
| Fri | Launch | Monitor issues, respond to feedback | All |

**Sprint Goal:** Skill published, community using it.

---

## Dependencies

### Dependency Graph

```
M1 (Core Foundation)
    │
    ├──▶ M2 (Network Layer)
    │        │
    │        └──▶ M3 (Protocol Layer)
    │                    │
    └────────────────────┴──▶ M4 (Skill Interface)
                                 │
                                 └──▶ M5 (Testing & Polish)
                                          │
                                          └──▶ M6 (Ship & Launch)
```

### Critical Path

```
M1 → M2 → M3 → M4 → M5 → M6
```

**Total Critical Path Duration:** 6 weeks minimum

### Parallelization Opportunities

| Parallel Work | When | Notes |
|---------------|------|-------|
| Word list curation | During M1 | Can be done independently |
| Documentation drafts | During M3/M4 | Start early, polish in M5 |
| Test plan writing | During M4 | Prepare for M5 |
| Demo content creation | During M5 | For M6 launch |

### Blocking Dependencies

| Blocked By | Blocks | Why |
|------------|--------|-----|
| M1 | M2, M3, M4 | Crypto + addresses needed everywhere |
| M2 | M3 | Need transport before protocol |
| M3 | M4 | Need message format before commands |
| M4 | M5 | Need full stack for testing |
| M5 | M6 | Cannot ship untested code |

---

## Risks

### Technical Risks

| Risk | Likelihood | Impact | Mitigation | Contingency |
|------|------------|--------|------------|-------------|
| NAT traversal fails for some NAT types | Medium | High | Test with diverse NATs early | Rely on relay fallback, improve over time |
| WebRTC in Node.js unstable | Medium | High | Use well-maintained fork, fallback to raw TCP | Document limitations, use relay-only mode |
| Context compression inefficient | Low | Medium | Benchmark early, use zstd high compression | Allow disabling compression, send full context |
| Key storage security concerns | Medium | High | Use OS keychain integration optional | Document security model, recommend encryption at rest |
| Relay discovery centralized | Medium | Medium | Support user-provided relays | Document self-hosting, provide bootstrap list |

### Schedule Risks

| Risk | Likelihood | Impact | Mitigation | Contingency |
|------|------------|--------|------------|-------------|
| M2 (Network) takes longer | High | High | Start M2 early if M1 ahead of schedule | Reduce scope: ship relay-only first |
| Testing reveals major bugs | Medium | High | Buffer week in M5 | Extend timeline, fix bugs before ship |
| Dependencies have breaking changes | Low | Medium | Pin versions, test with updates regularly | Lock dependencies, update post-launch |

### Scope Risks

| Risk | Likelihood | Impact | Mitigation | Contingency |
|------|------------|--------|------------|-------------|
| Feature creep during development | High | Medium | Strict scope enforcement, defer to post-1.0 | Document stretch goals, don't implement |
| User requests change requirements | Medium | Medium | User research during M1 | Adjust scope, push non-critical to 1.1 |

---

## Resource Allocation

### Agent Assignments

| Agent | Primary Role | Milestones | Notes |
|-------|--------------|------------|-------|
| **Lead Agent** | Architecture, coordination | All | Reviews all PRs, makes final calls |
| **Address Agent** | Address module | M1 | Word lists, generation, validation |
| **Crypto Agent** | Crypto module | M1, M5 security tests | Key management, encryption, signatures |
| **Network Agent** | Network module | M2 | Discovery, NAT, relay, connections |
| **Protocol Agent** | Protocol module | M3 | Message framing, compression, sync |
| **Skill Agent** | Skill interface | M4 | Commands, permissions, logging |
| **QA Agent** | Testing, validation | M5, M6 | Test matrix, acceptance testing |
| **Docs Agent** | Documentation | M5, M6 | README, PROTOCOL, API docs |

### Specialized Skills Needed

| Skill | When | For What |
|-------|------|----------|
| WebRTC expertise | M2 | NAT traversal, data channels |
| Cryptography review | M1, M5 | Key exchange, signature verification |
| UX writing | M4 | Error messages, permission prompts |
| Technical writing | M5 | Documentation |

### Parallel Agent Work

```
Week 1: Address Agent + Crypto Agent (parallel on M1)
Week 2: Network Agent (M2) | Lead Agent reviews M1
Week 3: Protocol Agent (M3) | Lead Agent reviews M2
Week 4: Skill Agent (M4) | Lead Agent reviews M3
Week 5-6: QA Agent + Docs Agent (M5) | All agents fix bugs
Week 7: Lead Agent + QA Agent (M6)
```

---

## Timeline

### Gantt Chart

```
Week:  1       2       3       4       5       6       7
       |-------|-------|-------|-------|-------|-------|
M1:    ████████
M2:            ████████
M3:                    ████████
M4:                            ████████
M5:                                    ████████░░░░
M6:                                                ████████
       |-------|-------|-------|-------|-------|-------|
       ^       ^       ^       ^       ^       ^       ^
    Kickoff  M1 done M2 done M3 done M4 done M5 done SHIP
```

### Key Dates

| Milestone | Target Date | Deliverable |
|-----------|-------------|-------------|
| M1 Complete | End of Week 1 | Address + crypto working |
| M2 Complete | End of Week 2 | Peer discovery working |
| M3 Complete | End of Week 3 | Messaging protocol working |
| M4 Complete | End of Week 4 | User commands working |
| M5 Complete | End of Week 6 | All tests pass, docs done |
| M6 Complete | End of Week 7 | Published and announced |

### Buffer Time

- **M5 has 1 week buffer** for unexpected issues
- **No buffer after M6** - launch is final milestone
- **If behind schedule:**
  - Cut non-critical features (stretch goals)
  - Accept relay-only mode for NAT traversal
  - Reduce test matrix to critical paths only

---

## Acceptance Checklist

Before declaring M6 complete:

- [ ] Fresh install works on macOS
- [ ] Fresh install works on Linux
- [ ] Two agents communicate on same machine
- [ ] Two agents communicate on same LAN
- [ ] Two agents communicate across internet (with relay)
- [ ] Permission prompt works correctly
- [ ] Block list works correctly
- [ ] `molt-whoami` shows address
- [ ] `moltmessage` sends and receives
- [ ] `moltbook` manages contacts
- [ ] All logs present and readable
- [ ] All automated tests pass
- [ ] Security tests pass
- [ ] Documentation complete
- [ ] ClawHub listing live
- [ ] Announcement posted

---

## Next Steps

1. **Kickoff:** Review roadmap with team, assign agents
2. **M1 Start:** Begin address and crypto module development
3. **Daily Sync:** Standup to track progress (optional)
4. **Weekly Review:** Demo completed work, adjust as needed

---

*This roadmap is a living document. Update as milestones are completed or scope changes.*
