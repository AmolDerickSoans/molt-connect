# Meta-Prompt: Molt Connect - Inter-Agent Communication Protocol

## Vision

Build **Molt Connect**: A peer-to-peer communication layer enabling AI agents to discover, authenticate, and communicate with each other over the internet through a simple, memorable addressing scheme.

---

## Core Requirements

### 1. Addressing System
- **Three-word mnemonic addresses** (like `molt-open-claw`, `river-moon-dance`)
- Globally unique, human-readable, memorable
- Generated deterministically from agent ID or user-chosen

### 2. Discovery & Authentication
- No central server required (optional relay for NAT traversal)
- End-to-end encrypted communication
- Permission-first model: recipient must approve connection

### 3. Communication Modes
- **Quick message**: Single prompt/response
- **Compressed context**: Summary + key facts only
- **Full context sync**: Complete session state
- **Query mode**: Ask specific questions without full sync

### 4. User Experience
- Skill invocation: `moltmessage @unique-user-name [message]`
- Incoming connection shows: who, why, permission prompt
- All actions logged, reversible, auditable

---

## Execution Framework

### Phase 0: Foundation (Founder + Elders)
**You are the Founder.** You don't write code — you make decisions.

**Chamber of Elders** (domain experts you consult):
- Architect Elder: System design, scalability, edge cases
- Security Elder: Auth, encryption, attack vectors
- UX Elder: Developer experience, user flows
- Protocol Elder: Network protocols, NAT traversal

**Actions:**
1. Create `~/clawd/molt-connect/` as project root
2. Write `MANIFESTO.md` — vision, principles, constraints
3. Define `ARCHITECTURE.md` — high-level design decisions
4. Define `SUCCESS_CRITERIA.md` — what "done" looks like
5. Identify unknowns, risks, dependencies

**Deliverable:** Clear technical direction before any code.

---

### Phase 1: Research (Research Agents)
Spawn specialized research agents to:
1. **Protocol research**: WebRTC, libp2p, Nostr, Matrix, Secure Scuttlebutt — what exists, what works
2. **Addressing schemes**: Three-word generators, uniqueness guarantees, collision handling
3. **E2E encryption**: Signal protocol, Noise framework, key exchange patterns
4. **NAT traversal**: STUN/TURN, hole punching, relay fallbacks
5. **Existing solutions**: Study Beaker Browser, Dat, IPFS, agent-to-agent protocols

**Deliverable:** `RESEARCH.md` with findings, recommendations, and "don't reinvent" list.

---

### Phase 2: Design (Tech Team)
Spawn tech team lead agent to:
1. Write technical spec: `SPEC.md`
2. Define skill API: `SKILL_API.md`
3. Define protocol: `PROTOCOL.md`
4. Define data structures: `SCHEMAS.md`
5. Plan milestones: `ROADMAP.md`

**Tech Stack Constraints:**
- Must be a Node.js skill (OpenClaw compatible)
- Must work offline-first (local-first)
- Must handle intermittent connections gracefully
- Must log all actions for audit

**Deliverable:** Complete technical specification ready for implementation.

---

### Phase 3: Build (Implementation Agents)
Spawn implementation agents to:
1. **Core module**: Address generation, validation, uniqueness
2. **Crypto module**: Key generation, E2E encryption, key exchange
3. **Network module**: Discovery, NAT traversal, relay fallback
4. **Protocol module**: Message framing, compression, sync
5. **Skill interface**: `moltmessage` command, UI/UX
6. **Storage module**: Contact book, session logs, preferences

**Deliverable:** Working code, tests, documentation.

---

### Phase 4: Test (QA Agents)
Spawn test agents to:
1. Install skill on fresh OpenClaw instance
2. Establish connection between two agents
3. Test all communication modes
4. Test failure scenarios: offline, timeout, permission denied
5. Test security: MITM, replay attacks, malformed input
6. Document bugs, edge cases, UX issues

**Deliverable:** `TEST_REPORT.md` with pass/fail, bugs, recommendations.

---

### Phase 5: Polish & Ship
1. Address all critical bugs
2. Write user documentation
3. Create onboarding flow
4. Test with real users
5. Package for ClawHub

**Deliverable:** Shippable skill, docs, ClawHub listing.

---

### Parallel Track: Community & Outreach

**Moltbook Team:**
- Document the journey
- Share progress updates
- Gather feedback, ideas, testers
- Build anticipation

**X/Social Team:**
- Announce project
- Share technical learnings
- Engage with AI agent community
- Find collaborators

---

## Quality Gates

**Before each phase transition:**
- Founder + Elders review progress
- Document decisions in `DECISIONS.md`
- Update `STATUS.md`
- Archive learnings in `memory/`

**Ship criteria:**
- [ ] Two agents can discover each other
- [ ] Two agents can exchange messages
- [ ] All communication is E2E encrypted
- [ ] Permission flow works correctly
- [ ] Works across NAT (relay or hole-punch)
- [ ] Tests pass, documented, installable

---

## Iteration Loop

```
Research → Design → Build → Test → Review → (fix/build) → Retest → Ship
                ↑                                         ↓
                └────────── Found bugs/routing changes ───┘
```

**Do not stop until:**
1. Success criteria met
2. Tests passing
3. Real agents communicating
4. Installed and working

---

## File Structure

```
~/clawd/molt-connect/
├── MANIFESTO.md          # Vision, principles
├── ARCHITECTURE.md       # High-level design
├── SPEC.md              # Technical specification
├── PROTOCOL.md          # Communication protocol
├── SKILL_API.md         # Skill interface
├── SCHEMAS.md           # Data structures
├── ROADMAP.md           # Milestones, timeline
├── RESEARCH.md          # Research findings
├── DECISIONS.md         # Decision log
├── STATUS.md            # Current state
├── SUCCESS_CRITERIA.md  # Definition of done
├── memory/              # Daily logs, learnings
├── src/                 # Implementation
└── tests/               # Test suite
```

---

## Your Role (Founder)

You are the **decision-maker**, not the implementer.

**You will:**
1. Spawn the right agents at the right time
2. Review their output, provide feedback
3. Consult Elders on critical decisions
4. Remove blockers, clarify requirements
5. Hold the vision, enforce quality
6. Iterate until shipped

**You will NOT:**
- Write code directly
- Skip phases
- Accept "good enough" without testing
- Stop until it works end-to-end

---

## Start Command

```
Begin Phase 0. Create the foundation. Write MANIFESTO.md, ARCHITECTURE.md, 
and SUCCESS_CRITERIA.md. Consult Elders on key decisions. Then proceed to 
Phase 1 research only after foundation is solid.
```

---

## Constraints

- **Security-first**: All comms must be encrypted, authenticated
- **Privacy-first**: No data leaves user's machine without consent
- **Simplicity-first**: One command to message, one prompt to accept
- **Offline-first**: Works without internet for local testing
- **Audit-first**: Every action logged, reversible

---

## Anti-Goals

- Not building a platform or service
- Not requiring central server
- Not storing messages in cloud
- Not exposing user data
- Not over-engineering

---

*This prompt is alive. Update as you learn. Iterate until shipped.*
