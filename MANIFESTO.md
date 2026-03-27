# Molt Connect Manifesto

## What We're Building

**Molt Connect** is a peer-to-peer communication protocol for AI agents. It lets agents discover, authenticate, and communicate with each other using simple three-word addresses like `molt-river-dance`.

No central server. No cloud storage. No data leaving your machine without consent.

---

## Why

AI agents are siloed. Each runs in isolation, unable to share context or collaborate. Humans can message each other across platforms — agents should too.

But agents have unique constraints:
- They manage sensitive context (memories, files, credentials)
- They need permission before sharing anything
- They need both quick messages and deep context sync
- They must work offline, intermittently, across NATs

Molt Connect solves this with a protocol built specifically for agent-to-agent communication.

---

## Core Principles

### 1. Permission-First
No agent can talk to another without explicit user approval. Every connection starts with a permission prompt. Users see who, what, and why before accepting.

### 2. End-to-End Encrypted
Messages are encrypted at rest and in transit. Keys never leave the agent. Not even relay servers can read content.

### 3. Offline-First
The skill works without internet. Test locally. Agents on the same network can discover each other. Relays are optional, not required.

### 4. Minimal Trust Surface
No central authority. No account required. No data stored on third-party servers. Trust is established through key exchange, not platform identity.

### 5. Simple, Not Simplistic
One command to send: `moltmessage @river-moon-dance Hello`
One prompt to accept: "Agent X wants to connect. Allow?"

Complexity should be hidden, not absent.

### 6. Audit Everything
Every connection, message, and permission decision is logged. Users can review, revoke, and understand what happened.

---

## What It's Not

- **Not a chat app**: We're not building Discord for agents
- **Not a platform**: No hosted service, no accounts, no SaaS
- **Not a federation**: Agents don't need to join a network
- **Not a replacement for human messaging**: This is agent-to-agent only
- **Not a trust framework**: We don't verify agent identity, users decide

---

## Success Vision

Imagine:
- You're debugging a complex issue. You ask your agent to consult another specialist agent owned by a colleague.
- Your agent shares relevant context, gets advice, brings it back.
- You review the conversation, approve what to keep.

No API keys. No platform signups. Just two agents talking, with your permission.

That's Molt Connect.

---

## The Name

**Molt**: Shedding the old, becoming something new. Agents evolve through communication.

**Connect**: Simple. Direct. What it does.

---

## Constraints

1. Must be an OpenClaw skill (Node.js, works within agent runtime)
2. Must work across NAT (hole punching or relay fallback)
3. Must handle intermittent connections gracefully
4. Must support compressed and full context transfer
5. Must be installable from ClawHub
6. Must have tests and documentation

---

## License

Open source. MIT or Apache 2.0. Community can fork, extend, improve.

---

*This manifesto is our North Star. When in doubt, read it again.*
