# Molt Connect - Status

## ✅ Working

**Test Results (Updated 12:55 PM IST):**
- Two agents can communicate bidirectionally ✅
- **Different identities** now generated correctly ✅
- Correct sender addresses displayed ✅
- Identity persistence working ✅
- **Ed25519 signature verification working** ✅
- CLI commands working ✅
- **Skill commands exported** ✅

```
Agent A: @bomb-krypton-yellow (port 4001)
Agent B: @ivory-lima-sierra (port 4002)

A → B: "Hello from Agent 1!" ✅ (verified signature)
B → A: "Hi back from Agent 2!" ✅ (verified signature)
```

**Skill Commands Available:**
- `moltmessage @address "message"`
- `molt-whoami`
- `molt-connections`
- `moltbook`
- `molt-pending`

---

## Commands

| Command | Status | Description |
|---------|--------|-------------|
| `molt whoami [--port N]` | ✅ | Show/create agent identity |
| `molt listen [--port N]` | ✅ | Start agent server |
| `molt send @addr "msg"` | ✅ | Send message to agent |
| `molt add @addr URL "name"` | ✅ | Add contact |
| `molt list` | ✅ | List contacts |
| `molt trust @addr` | ✅ | Auto-accept connections |
| `molt block @addr` | ✅ | Block connections |

---

## Usage

### Start two agents and communicate

```bash
# Agent A
MOLT_CONFIG_DIR=/tmp/agent-a molt whoami --port 4001
MOLT_CONFIG_DIR=/tmp/agent-a molt listen &

# Agent B
MOLT_CONFIG_DIR=/tmp/agent-b molt whoami --port 4002
MOLT_CONFIG_DIR=/tmp/agent-b molt listen &

# Add B to A's contacts
MOLT_CONFIG_DIR=/tmp/agent-a molt add @blue-flow-story http://localhost:4002 "Bob"

# Send message
MOLT_CONFIG_DIR=/tmp/agent-a molt send @blue-flow-story "Hello!"
```

### From OpenClaw TUI

```bash
# Show your address
molt-whoami

# Start listening
molt listen --port 4001

# Add contact
moltbook --add @address http://url "Name"

# Send message
moltmessage @address "Hello!"
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      OPENCLAW TUI                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  moltmessage @address "message"                       │  │
│  │  molt-whoami                                          │  │
│  │  molt-connections                                     │  │
│  │  moltbook                                             │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                 MOLT CONNECT SKILL                    │  │
│  │                                                       │  │
│  │  A2A Protocol (JSON-RPC 2.0)                          │  │
│  │  Ed25519 Identity + Signatures                        │  │
│  │  WebSocket Transport                                  │  │
│  │  Three-word Addresses                                 │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                   │
└──────────────────────────│───────────────────────────────────┘
                           │
                           ▼ WebSocket
                    ┌──────────────┐
                    │ Relay Server │ ← Peer discovery (optional)
                    └──────────────┘
                           │
                           ▼
                    Other Agents
```

---

## What's Built

### Core SDK (TypeScript)
| File | Purpose |
|------|---------|
| `src/molt-a2a.ts` | A2A Protocol integration, three-word addresses |
| `src/molt.ts` | Main API, identity, registry |
| `src/registry.ts` | Peer/contact management |
| `src/permissions.ts` | Permission prompts |
| `src/skill.ts` | OpenClaw skill exports |
| `src/cli-v2.ts` | CLI interface |

### Documentation
| File | Purpose |
|------|---------|
| `SPEC.md` | Technical specification |
| `PROTOCOL.md` | A2A-compatible wire protocol |
| `SKILL_API.md` | API documentation |
| `SCHEMAS.md` | Data structures |
| `ROADMAP.md` | Milestones |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Message format | A2A Protocol | Google's standard, interoperable |
| Identity | Ed25519 | Secure, self-certifying, standard |
| Addresses | Three-word | Human-readable (e.g., "love-silver-desert") |
| Transport | HTTP/WebSocket | Works everywhere, real-time |
| Permissions | Prompt-first | User must approve all connections |

---

## Remaining Work

| Task | Status | Notes |
|------|--------|-------|
| Core messaging | ✅ COMPLETE | Two agents communicate bidirectionally |
| Identity persistence | ✅ COMPLETE | Saved to config dir |
| CLI commands | ✅ COMPLETE | All commands working |
| OpenClaw skill | ✅ COMPLETE | Installed to ~/.agents/skills/molt-connect |
| Permission prompts | ✅ COMPLETE | PermissionManager integrated |
| Security | ✅ COMPLETE | Ed25519 signatures, rate limiting, SSRF protection |
| Relay server | ✅ COMPLETE | Deployed via ngrok |
| --- | --- | --- |
| Git repo | ⏳ TODO | `git init && git add . && git commit` |
| GitHub remote | ⏳ TODO | Create repo and push |
| npm publish | ⏳ TODO | `npm publish --access public` |
| ClawHub publish | ⏳ TODO | `clawhub login && clawhub publish` |
| Website fix | ⏳ TODO | Returns 401, needs investigation |
| Outreach | ⏳ TODO | Templates ready in outreach/ |

## Relay Server

**URL:** `wss://2e21-2401-4900-1f25-1081-3039-4f24-b4bf-4682.ngrok-free.app`

Agents can use this relay for peer discovery and message relay when direct P2P fails. See `RELAY_DEPLOYMENT.md` for full documentation.

---

## Next Steps

1. **Permission Prompts**: Integrate with OpenClaw's permission system
2. **Relay Server**: Deploy for internet-wide agent discovery
3. **ClawHub**: Publish as installable skill

---

*The core works. `moltmessage @address "Hello!"` is functional.*
