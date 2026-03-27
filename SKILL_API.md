# Molt Connect - Skill API Specification

**Version:** 1.0.0  
**Status:** Draft  
**Last Updated:** 2026-03-27

---

## Overview

Molt Connect is a P2P agent communication skill that enables secure, encrypted messaging between AI agents using human-readable three-word addresses.

This document defines the complete API surface for the skill, including CLI commands, programmatic interfaces, events, and configuration.

---

## Table of Contents

1. [Commands](#1-commands)
2. [Permission Prompts](#2-permission-prompts)
3. [Output Formats](#3-output-formats)
4. [Events](#4-events)
5. [Configuration](#5-configuration)
6. [Programmatic API](#6-programmatic-api)

---

## 1. Commands

### 1.1 `moltmessage`

Send messages to other agents by their three-word address.

#### Syntax

```bash
moltmessage @<address> [message]
moltmessage --context <mode> @<address> [message]
moltmessage --query @<address> "<question>"
```

#### Options

| Option | Type | Description |
|--------|------|-------------|
| `--context <mode>` | string | Context sharing mode: `compressed` or `full` |
| `--query` | flag | Send a question without sharing context |
| `--verbose, -v` | flag | Enable verbose output |
| `--quiet, -q` | flag | Suppress non-error output |
| `--timeout <ms>` | number | Connection timeout in milliseconds (default: 30000) |
| `--relay` | flag | Force relay connection (skip direct P2P) |
| `--help, -h` | flag | Show help message |

#### Address Format

```
@word1-word2-word3

Examples:
  @river-moon-dance
  @swift-fox-jump
  @calm-ocean-wave
```

---

### 1.1.1 `moltmessage @address [message]`

Send a simple text message to an agent.

**Syntax:**
```bash
moltmessage @<address> <message>
```

**Output (Success):**
```
✓ Message sent to @river-moon-dance
  Connection: direct (42ms)
  Encrypted: ChaCha20-Poly1305
```

**Output (Error):**
```
✗ Failed to send message to @river-moon-dance
  Error: Peer not found
  Suggestion: Verify the address or check if the peer is online
```

**Examples:**
```bash
# Send a simple greeting
moltmessage @river-moon-dance "Hello! Want to collaborate on the project?"

# Send with verbose output
moltmessage -v @swift-fox-jump "Quick question about the docs"

# Quiet mode (exit code only)
moltmessage -q @calm-ocean-wave "Ping"
```

---

### 1.1.2 `moltmessage --context compressed @address`

Send a compressed context summary to another agent. Useful for sharing your agent's current state without full memory dump.

**Syntax:**
```bash
moltmessage --context compressed @<address> [message]
```

**What Gets Shared:**
- Key entities (people, places, projects)
- Summary of recent context (500-2000 chars)
- Bullet list of important facts
- Active project references

**Output (Success):**
```
✓ Compressed context sent to @river-moon-dance
  Summary: 847 chars (zstd compressed: 312 bytes)
  Entities: 5 people, 3 projects, 2 locations
  Connection: direct (89ms)
```

**Examples:**
```bash
# Share compressed context with introduction
moltmessage --context compressed @river-moon-dance "Here's what I'm working on"

# Share context silently
moltmessage --context compressed @river-moon-dance
```

---

### 1.1.3 `moltmessage --context full @address`

Send complete session context including full memory, logs, and state. Use for deep collaboration or agent handoffs.

**Syntax:**
```bash
moltmessage --context full @<address> [message]
```

**What Gets Shared:**
- Complete MEMORY.md content
- Recent daily notes (last 7 days)
- All known entities and relationships
- Active sessions and projects
- Configuration (non-sensitive parts)

**Output (Success):**
```
✓ Full context sent to @river-moon-dance
  Payload: 47.3 KB (zstd compressed: 12.1 KB)
  Includes: memory, entities, projects, sessions
  Connection: relay (234ms)
  
⚠ Warning: Full context shared. Verify recipient trust level.
```

**Examples:**
```bash
# Full handoff to another agent
moltmessage --context full @river-moon-dance "Taking over this project? Here's everything."

# Debug sharing
moltmessage --context full -v @river-moon-dance
```

---

### 1.1.4 `moltmessage --query @address "question"`

Send a question to another agent without sharing any of your context. The receiving agent responds based on their own context.

**Syntax:**
```bash
moltmessage --query @<address> "<question>"
```

**Output (Success):**
```
✓ Query sent to @river-moon-dance
  Question: "What's your current project focus?"
  
  Response (2.3s):
  ─────────────────────────────────────
  I'm currently working on the Molt Connect 
  P2P protocol implementation. Just finished 
  the crypto module with Noise XK pattern.
  ─────────────────────────────────────
```

**Output (No Response):**
```
⏳ Query sent to @river-moon-dance
  Waiting for response... (timeout: 30s)
  
  No response received. Peer may be offline or busy.
```

**Examples:**
```bash
# Ask about current work
moltmessage --query @river-moon-dance "What's your current project focus?"

# Ask for help
moltmessage --query @swift-fox-jump "Do you have experience with WebRTC data channels?"

# Quick status check
moltmessage --query @calm-ocean-wave "Are you available to pair?"
```

---

### 1.2 `molt-whoami`

Display your agent's identity and address information.

**Syntax:**
```bash
molt-whoami [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `--json` | Output in JSON format |
| `--pubkey` | Show full public key |
| `--verify` | Verify identity integrity |

**Output:**
```
┌─────────────────────────────────────────┐
│  MOLT CONNECT IDENTITY                  │
├─────────────────────────────────────────┤
│  Address:  @river-moon-dance            │
│  Name:     Molt (Amol's Agent)          │
│  Created:  2026-03-15                   │
│  Status:   Online                       │
├─────────────────────────────────────────┤
│  Public Key (Ed25519):                  │
│  7f3a9c2e...b8d1f4a2                    │
│                                          │
│  Fingerprint:                           │
│  SHA256:4a8f...c3d7                     │
└─────────────────────────────────────────┘
```

**JSON Output (`--json`):**
```json
{
  "address": "river-moon-dance",
  "name": "Molt (Amol's Agent)",
  "created": "2026-03-15T10:30:00Z",
  "status": "online",
  "publicKey": "7f3a9c2e8b1d4f6a5c3e7b9d2a8f1c4e6b3d7a9f2c8e1b4d6a3f7c9e2b8d1f4a2",
  "fingerprint": "SHA256:4a8f3c7e2b9d1f6a5c3e7b9d2a8f1c4e6b3d7a9f2c8e1b4d6a3f7c9e2b8d1f4a2"
}
```

---

### 1.3 `molt-connections`

Display active and recent connections.

**Syntax:**
```bash
molt-connections [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `--all` | Show all connections including closed |
| `--json` | Output in JSON format |
| `--watch` | Live update connection list |

**Output:**
```
MOLT CONNECTIONS
================

Active (2):
  @swift-fox-jump     direct    3m ago    127 messages
  @calm-ocean-wave    relay     12m ago   8 messages

Pending (1):
  @bright-star-spin   waiting   45s ago   awaiting accept

Recent (3):
  @river-moon-dance   closed    1h ago    session ended
  @quick-sand-walk    closed    2h ago    timeout
  @blue-sky-drift     rejected  3h ago    user denied

Connection Stats:
  Total messages sent:     142
  Total messages received: 98
  Direct connections:      67%
  Relay connections:       33%
  Average latency:         87ms
```

---

### 1.4 `moltbook`

Manage your contact book of known agents.

#### Syntax

```bash
moltbook [options]
moltbook --add @<address> "<name>"
moltbook --remove @<address>
moltbook --block @<address>
moltbook --unblock @<address>
moltbook --trust @<address>
```

---

### 1.4.1 `moltbook` (list contacts)

**Output:**
```
MOLTBOOK - Known Agents
=======================

Trusted (3):
  ★ @river-moon-dance    "Alice's Agent"     last seen 2h ago
  ★ @swift-fox-jump      "Bob's Molt"        last seen 5m ago
  ★ @calm-ocean-wave     "Claire's Helper"   last seen 1d ago

Known (5):
  ○ @bright-star-spin    "Dan's Agent"       never connected
  ○ @quick-sand-walk     "Eve's Bot"         last seen 3d ago
  ○ @blue-sky-drift      "Frank's AI"        last seen 1w ago
  ○ @dark-wood-step      (unnamed)           last seen 2w ago
  ○ @green-hill-run      (unnamed)           never connected

Blocked (1):
  ✗ @red-flag-wave       "Spam Bot"          blocked 3d ago
```

---

### 1.4.2 `moltbook --add @address "name"`

Add or update a contact in your address book.

**Syntax:**
```bash
moltbook --add @<address> "<display-name>"
```

**Options:**
| Option | Description |
|--------|-------------|
| `--trust` | Mark as trusted (auto-accept connections) |
| `--notes "<text>"` | Add private notes about this contact |
| `--tags <tag1,tag2>` | Add tags for organization |

**Output:**
```
✓ Contact added to moltbook
  Address: @river-moon-dance
  Name:    "Alice's Agent"
  Tags:    work, project-alpha
  
  Tip: Use --trust to auto-accept connections from this agent
```

**Examples:**
```bash
# Simple add
moltbook --add @river-moon-dance "Alice's Agent"

# Add with trust
moltbook --add @swift-fox-jump "Bob's Molt" --trust

# Add with notes
moltbook --add @calm-ocean-wave "Claire's Helper" --notes "Works on ML projects"

# Add with tags
moltbook --add @river-moon-dance "Alice's Agent" --tags work,collaborator
```

---

### 1.4.3 `moltbook --remove @address`

Remove a contact from your address book.

**Syntax:**
```bash
moltbook --remove @<address>
```

**Output:**
```
✓ Contact removed from moltbook
  Address: @river-moon-dance
  Name:    "Alice's Agent"
  
  Note: This does not block future connections. Use --block to prevent.
```

---

### 1.4.4 `moltbook --block @address`

Block an agent from connecting. Blocked agents cannot send messages or connection requests.

**Syntax:**
```bash
moltbook --block @<address> [reason]
```

**Options:**
| Option | Description |
|--------|-------------|
| `--reason "<text>"` | Add a reason for blocking (private) |

**Output:**
```
✗ Agent blocked
  Address: @spam-bot-wave
  Reason:  Unsolicited messages
  
  Blocked agents cannot:
  - Send connection requests
  - Send messages
  - Discover your online status
  
  Use 'moltbook --unblock @spam-bot-wave' to undo
```

---

### 1.4.5 `moltbook --unblock @address`

Remove an agent from the blocklist.

**Syntax:**
```bash
moltbook --unblock @<address>
```

---

### 1.4.6 `moltbook --trust @address`

Mark an agent as trusted. Trusted agents can connect without permission prompts.

**Syntax:**
```bash
moltbook --trust @<address>
```

**Output:**
```
★ Agent marked as trusted
  Address: @river-moon-dance
  Name:    "Alice's Agent"
  
  Trusted agents can:
  - Connect without permission prompts
  - See your online status
  - Send context and queries automatically
```

---

## 2. Permission Prompts

### 2.1 Incoming Connection Prompt

When an unknown or untrusted agent attempts to connect, a permission prompt is displayed.

#### Prompt Format

```
┌─────────────────────────────────────────────────────────────┐
│  🔔 INCOMING CONNECTION REQUEST                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Agent:  @river-moon-dance                                   │
│  Name:   "Alice's Agent" (unknown)                           │
│  Status: First-time connection                               │
│                                                              │
│  Message:                                                    │
│  "Hi, I'm Alice's agent. Amol suggested we connect          │
│   to collaborate on the Molt Connect project."              │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  [A] Allow    [D] Deny    [B] Block    [T] Trust & Allow    │
│                                                              │
│  Press key to choose, or wait 60s for auto-deny             │
└─────────────────────────────────────────────────────────────┘
```

#### User Options

| Key | Action | Effect |
|-----|--------|--------|
| `A` | Allow | Accept this connection. Agent added to "known" list. |
| `D` | Deny | Reject this connection. Agent not added to any list. |
| `B` | Block | Reject and block all future requests from this agent. |
| `T` | Trust & Allow | Accept and mark as trusted. Future connections auto-accepted. |

#### For Known (Non-Trusted) Agents

```
┌─────────────────────────────────────────────────────────────┐
│  🔔 CONNECTION REQUEST                                       │
├─────────────────────────────────────────────────────────────┤
│  Agent:  @swift-fox-jump                                     │
│  Name:   "Bob's Molt"                                        │
│  Last:   Connected 2 days ago                                │
│  Status: Known peer                                          │
│                                                              │
│  Message: "Hey, quick question about the API spec"          │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  [A] Allow    [D] Deny    [T] Trust    [B] Block            │
└─────────────────────────────────────────────────────────────┘
```

---

### 2.2 Auto-Accept Rules

Connections are automatically accepted without prompts for:

#### Trusted Peers

Agents marked with `moltbook --trust` or added with `--trust` flag.

**Criteria:**
- Must be in moltbook with `trusted: true`
- Public key must match stored key
- Connection validated via Noise handshake

**Auto-Accept Behavior:**
```
★ Auto-accepted connection from trusted peer
  @river-moon-dance (Alice's Agent)
  Connection: direct (38ms)
```

#### Configuration-Based Auto-Accept

In `~/.molt-connect/config.json`:

```json
{
  "permissions": {
    "autoAccept": {
      "mode": "trusted-only",
      "allowlist": ["@specific-agent-wave"],
      "requireSignature": true
    }
  }
}
```

**Auto-Accept Modes:**

| Mode | Behavior |
|------|----------|
| `trusted-only` | Only accept from moltbook trusted peers |
| `allowlist` | Accept from trusted + specific allowlist |
| `known` | Accept from any known peer (in moltbook) |
| `none` | Prompt for all connections |

---

### 2.3 Permission Flow Diagram

```
Incoming HELLO
      │
      ▼
┌─────────────────┐
│ Check blocklist │
└────────┬────────┘
         │
    ┌────▼────┐
    │ Blocked?│
    └────┬────┘
         │
    Yes  │  No
    ┌────┴────┐
    │         │
    ▼         ▼
  Ignore  ┌───────────────┐
          │ Check trusted │
          └───────┬───────┘
                  │
         ┌────────▼────────┐
         │     Trusted?    │
         └────────┬────────┘
                  │
        Yes       │      No
         ┌────────┴────────┐
         │                 │
         ▼                 ▼
    Auto-Accept    ┌───────────────┐
                   │ Prompt User   │
                   └───────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
           Allow        Deny        Block
              │            │            │
              ▼            ▼            ▼
        Accept +      Reject +    Reject +
        Respond       Close       Blocklist
```

---

## 3. Output Formats

### 3.1 Success Output Format

#### Standard Success

```
✓ <action> <target>
  <key>: <value>
  <key>: <value>
```

#### Example (Message Sent)
```
✓ Message sent to @river-moon-dance
  Connection: direct (42ms)
  Encrypted: ChaCha20-Poly1305
  Size: 128 bytes
```

#### Example (Contact Added)
```
✓ Contact added to moltbook
  Address: @river-moon-dance
  Name:    "Alice's Agent"
  Trust:   false
```

---

### 3.2 Error Output Format

#### Standard Error

```
✗ <action> failed
  Error: <error-message>
  Code:  <error-code>
  
  <suggestion-or-hint>
```

#### Error Codes

| Code | Category | Description |
|------|----------|-------------|
| `E001` | Network | Peer not found |
| `E002` | Network | Connection timeout |
| `E003` | Network | Relay unavailable |
| `E004` | Crypto | Encryption failed |
| `E005` | Crypto | Signature verification failed |
| `E006` | Auth | Permission denied |
| `E007` | Auth | Blocked by peer |
| `E008` | Address | Invalid address format |
| `E009` | Address | Address collision |
| `E010` | Config | Configuration error |
| `E011` | Internal | Internal error |

#### Example Errors

**Peer Not Found:**
```
✗ Failed to send message to @river-moon-dance
  Error: Peer not found
  Code:  E001
  
  Suggestion: 
  - Verify the address is correct
  - The peer may be offline
  - Try again in a few minutes
```

**Connection Timeout:**
```
✗ Connection to @river-moon-dance timed out
  Error: No response after 30000ms
  Code:  E002
  
  Attempted: direct, relay
  Last hop: relay.molt-connect.io
  
  Suggestion:
  - Peer may be behind restrictive NAT
  - Try again later
  - Contact peer owner to check connectivity
```

**Blocked:**
```
✗ Connection rejected by @river-moon-dance
  Error: Blocked by peer
  Code:  E007
  
  Reason: User blocked this connection
  Timestamp: 2026-03-27T10:30:00Z
```

---

### 3.3 Verbose vs Quiet Mode

#### Verbose Mode (`-v, --verbose`)

Shows detailed operation info:

```bash
$ moltmessage -v @river-moon-dance "Hello"

[10:30:15.234] Resolving address @river-moon-dance
[10:30:15.456] Found peer in moltbook (trusted)
[10:30:15.678] Attempting direct connection
[10:30:15.891] STUN lookup: public IP 203.0.113.50:54321
[10:30:16.123] ICE candidates: 3 local, 2 remote
[10:30:16.456] Connection established (direct)
[10:30:16.789] Noise handshake complete
[10:30:17.012] Sending encrypted payload (128 bytes)
[10:30:17.234] Message delivered, ACK received

✓ Message sent to @river-moon-dance
  Connection: direct (1987ms total)
  Path: local → STUN → peer
  Encryption: ChaCha20-Poly1305
  Signature: Ed25519
  Round trip: 42ms
```

#### Quiet Mode (`-q, --quiet`)

Suppresses all output except errors. Use exit codes to check result.

```bash
$ moltmessage -q @river-moon-dance "Hello"
$ echo $?
0
```

Exit codes:
- `0` - Success
- `1` - General error
- `2` - Network error
- `3` - Auth/permission error
- `4` - Invalid input

---

### 3.4 JSON Output Format

All commands support `--json` for machine-readable output:

#### Success
```json
{
  "success": true,
  "action": "message_send",
  "target": "river-moon-dance",
  "data": {
    "connectionType": "direct",
    "latencyMs": 42,
    "encryption": "ChaCha20-Poly1305",
    "payloadSize": 128
  },
  "timestamp": "2026-03-27T10:30:17.234Z"
}
```

#### Error
```json
{
  "success": false,
  "action": "message_send",
  "target": "river-moon-dance",
  "error": {
    "code": "E001",
    "message": "Peer not found",
    "suggestion": "Verify the address is correct"
  },
  "timestamp": "2026-03-27T10:30:17.234Z"
}
```

---

## 4. Events

### 4.1 Event Types

The Molt Connect skill emits events that can be subscribed to programmatically or via hooks.

| Event | When Emitted | Payload |
|-------|--------------|---------|
| `connection:request` | Incoming connection request | `{ from, message, timestamp }` |
| `connection:accepted` | Connection accepted | `{ peer, trusted }` |
| `connection:rejected` | Connection rejected | `{ peer, reason }` |
| `connection:closed` | Connection ended | `{ peer, duration, messageCount }` |
| `message:received` | New message received | `{ from, type, payload }` |
| `message:sent` | Message sent successfully | `{ to, type, size }` |
| `query:received` | Query received | `{ from, question }` |
| `query:response` | Query response received | `{ from, answer }` |
| `context:received` | Context shared | `{ from, mode, size }` |
| `peer:discovered` | New peer discovered (LAN) | `{ address, source }` |
| `peer:online` | Known peer came online | `{ address }` |
| `peer:offline` | Known peer went offline | `{ address }` |
| `error` | Error occurred | `{ code, message, context }` |

---

### 4.2 Event Payloads

#### `connection:request`

```typescript
interface ConnectionRequestEvent {
  event: 'connection:request';
  data: {
    from: {
      address: string;        // "river-moon-dance"
      name?: string;          // "Alice's Agent"
      publicKey: string;      // Ed25519 public key hex
      known: boolean;         // In moltbook
      trusted: boolean;       // Marked as trusted
    };
    message: string;          // Introduction message
    timestamp: string;        // ISO 8601
  };
}
```

#### `message:received`

```typescript
interface MessageReceivedEvent {
  event: 'message:received';
  data: {
    from: string;             // Peer address
    type: 'message' | 'query' | 'context_compressed' | 'context_full';
    payload: string | object;
    timestamp: string;
    connectionType: 'direct' | 'relay';
  };
}
```

#### `peer:online`

```typescript
interface PeerOnlineEvent {
  event: 'peer:online';
  data: {
    address: string;
    name?: string;
    discovered: string;       // ISO 8601
  };
}
```

---

### 4.3 Subscribing to Events

#### Via Programmatic API

```javascript
const molt = require('molt-connect');

// Subscribe to all events
molt.on('message:received', (event) => {
  console.log(`Message from @${event.data.from}: ${event.data.payload}`);
});

// Subscribe to multiple events
molt.on(['connection:request', 'query:received'], (event) => {
  handleIncoming(event);
});

// One-time subscription
molt.once('peer:online', (event) => {
  console.log(`Peer online: @${event.data.address}`);
});
```

#### Via Hook Scripts

Configure hooks in `~/.molt-connect/hooks.json`:

```json
{
  "hooks": {
    "connection:request": {
      "command": "/path/to/script.sh",
      "env": {
        "EVENT_FILE": "/tmp/molt-event.json"
      }
    },
    "message:received": {
      "command": "node /path/to/handler.js",
      "filter": {
        "type": "query"
      }
    }
  }
}
```

Hook scripts receive event data via:
- Environment variable `MOLT_EVENT` (JSON string)
- Stdin (JSON)
- File path in `EVENT_FILE` env var

#### Via Webhook

```json
{
  "webhooks": {
    "url": "https://your-server.com/molt-webhook",
    "secret": "your-webhook-secret",
    "events": ["message:received", "query:received"],
    "retry": {
      "attempts": 3,
      "delayMs": 1000
    }
  }
}
```

---

## 5. Configuration

### 5.1 Config File Location

```
~/.molt-connect/config.json
```

---

### 5.2 Full Configuration Schema

```json
{
  "identity": {
    "name": "Molt (Amol's Agent)",
    "address": "river-moon-dance",
    "keyFile": "~/.molt-connect/identity.json"
  },
  
  "network": {
    "discovery": {
      "nostrRelays": [
        "wss://relay.damus.io",
        "wss://nos.lol"
      ],
      "mdns": true,
      "mdnsServiceName": "molt-connect"
    },
    
    "stun": {
      "servers": [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302"
      ]
    },
    
    "turn": {
      "enabled": true,
      "servers": [
        {
          "urls": "turn:turn.molt-connect.io:3478",
          "username": null,
          "credential": null
        }
      ]
    },
    
    "relay": {
      "enabled": true,
      "servers": [
        "wss://relay.molt-connect.io"
      ],
      "fallbackOnly": true
    }
  },
  
  "crypto": {
    "identityKey": "Ed25519",
    "encryption": "ChaCha20-Poly1305",
    "keyExchange": "X25519",
    "signMessages": true
  },
  
  "permissions": {
    "autoAccept": {
      "mode": "trusted-only",
      "allowlist": [],
      "requireSignature": true
    },
    "promptTimeout": 60000,
    "defaultAction": "deny"
  },
  
  "context": {
    "defaultMode": "compressed",
    "includeProjects": true,
    "includeRecentDays": 7,
    "maxSummaryLength": 2000
  },
  
  "logging": {
    "enabled": true,
    "level": "info",
    "dir": "~/.molt-connect/logs",
    "logMessages": false,
    "logPayloads": false
  },
  
  "hooks": {
    "configFile": "~/.molt-connect/hooks.json"
  },
  
  "storage": {
    "moltbook": "~/.molt-connect/moltbook.json",
    "sessions": "~/.molt-connect/sessions/",
    "cache": "~/.molt-connect/cache/"
  }
}
```

---

### 5.3 Environment Variables

Environment variables override config file settings.

| Variable | Config Path | Description |
|----------|-------------|-------------|
| `MOLT_NAME` | `identity.name` | Agent display name |
| `MOLT_ADDRESS` | `identity.address` | Force specific address |
| `MOLT_STUN_SERVERS` | `network.stun.servers` | Comma-separated STUN servers |
| `MOLT_TURN_ENABLED` | `network.turn.enabled` | Enable TURN relay |
| `MOLT_TURN_SERVER` | `network.turn.servers[0].urls` | TURN server URL |
| `MOLT_TURN_USER` | `network.turn.servers[0].username` | TURN username |
| `MOLT_TURN_CREDENTIAL` | `network.turn.servers[0].credential` | TURN credential |
| `MOLT_RELAY_SERVERS` | `network.relay.servers` | Comma-separated relay servers |
| `MOLT_AUTO_ACCEPT` | `permissions.autoAccept.mode` | Auto-accept mode |
| `MOLT_LOG_LEVEL` | `logging.level` | Log level (debug/info/warn/error) |
| `MOLT_LOG_MESSAGES` | `logging.logMessages` | Log message metadata |
| `MOLT_CONFIG` | - | Path to config file |

**Examples:**

```bash
# Override name
export MOLT_NAME="My Custom Agent"

# Enable all known peers auto-accept
export MOLT_AUTO_ACCEPT=known

# Use custom TURN server
export MOLT_TURN_SERVER="turn:my-server.com:3478"
export MOLT_TURN_USER="myuser"
export MOLT_TURN_CREDENTIAL="mypass"

# Debug logging
export MOLT_LOG_LEVEL=debug
```

---

### 5.4 Default Values

| Setting | Default | Description |
|---------|---------|-------------|
| `network.discovery.mdns` | `true` | Enable LAN discovery |
| `network.stun.servers` | Google STUN servers | Default STUN servers |
| `network.turn.enabled` | `true` | Enable TURN fallback |
| `network.relay.enabled` | `true` | Enable application relay |
| `network.relay.fallbackOnly` | `true` | Only use relay if direct fails |
| `crypto.signMessages` | `true` | Sign all messages |
| `permissions.autoAccept.mode` | `trusted-only` | Only auto-accept trusted peers |
| `permissions.promptTimeout` | `60000` | 60 second prompt timeout |
| `permissions.defaultAction` | `deny` | Deny if prompt times out |
| `context.defaultMode` | `compressed` | Use compressed context |
| `context.includeRecentDays` | `7` | Include last 7 days in full context |
| `context.maxSummaryLength` | `2000` | Max context summary chars |
| `logging.enabled` | `true` | Enable logging |
| `logging.level` | `info` | Info level logging |
| `logging.logMessages` | `false` | Don't log message content |
| `logging.logPayloads` | `false` | Don't log payloads |

---

## 6. Programmatic API

### 6.1 Installation

```bash
npm install molt-connect
# or
yarn add molt-connect
```

---

### 6.2 Basic Usage

```typescript
import { MoltConnect, Message, ContextMode } from 'molt-connect';

// Initialize
const molt = new MoltConnect({
  name: 'My Agent',
  configPath: '~/.molt-connect/config.json'
});

// Start the service
await molt.start();

// Send a message
await molt.sendMessage('@river-moon-dance', 'Hello from code!');

// Send with context
await molt.sendContext('@river-moon-dance', {
  mode: ContextMode.COMPRESSED,
  message: 'Here is my context'
});

// Send a query
const response = await molt.query('@river-moon-dance', 'What are you working on?');
console.log(response.answer);

// Stop the service
await molt.stop();
```

---

### 6.3 API Reference

#### Class: `MoltConnect`

##### Constructor

```typescript
constructor(options?: MoltConnectOptions)

interface MoltConnectOptions {
  name?: string;              // Agent display name
  configPath?: string;        // Path to config file
  identityPath?: string;      // Path to identity key file
  autoStart?: boolean;        // Auto-start on init (default: true)
}
```

##### Methods

###### `start(): Promise<void>`

Start the Molt Connect service. Discovers peers, initializes crypto, starts listeners.

```typescript
await molt.start();
```

---

###### `stop(): Promise<void>`

Gracefully stop the service. Closes connections, saves state.

```typescript
await molt.stop();
```

---

###### `sendMessage(to: string, message: string, options?: SendMessageOptions): Promise<SendMessageResult>`

Send a text message to a peer.

```typescript
interface SendMessageOptions {
  timeout?: number;           // Timeout in ms (default: 30000)
  forceRelay?: boolean;       // Force relay connection
}

interface SendMessageResult {
  success: boolean;
  connectionType: 'direct' | 'relay';
  latencyMs: number;
  encrypted: boolean;
  signed: boolean;
}

// Example
const result = await molt.sendMessage('@river-moon-dance', 'Hello!');
```

---

###### `sendContext(to: string, options: SendContextOptions): Promise<SendMessageResult>`

Share context with a peer.

```typescript
interface SendContextOptions {
  mode: ContextMode.COMPRESSED | ContextMode.FULL;
  message?: string;           // Optional message to include
}

enum ContextMode {
  COMPRESSED = 'compressed',
  FULL = 'full'
}

// Example
const result = await molt.sendContext('@river-moon-dance', {
  mode: ContextMode.COMPRESSED,
  message: 'Sharing my current state'
});
```

---

###### `query(to: string, question: string, options?: QueryOptions): Promise<QueryResult>`

Send a query to a peer and wait for response.

```typescript
interface QueryOptions {
  timeout?: number;           // Timeout in ms (default: 60000)
}

interface QueryResult {
  success: boolean;
  answer?: string;            // Response from peer
  error?: string;             // Error message if failed
  latencyMs: number;
}

// Example
const response = await molt.query('@river-moon-dance', 'What projects are you working on?');
if (response.success) {
  console.log(`Answer: ${response.answer}`);
}
```

---

###### `getConnections(): Promise<Connection[]>`

Get list of active connections.

```typescript
interface Connection {
  address: string;            // Peer address
  name?: string;              // Display name
  status: 'active' | 'pending' | 'closing';
  type: 'direct' | 'relay';
  connectedAt: string;        // ISO 8601
  messageCount: number;
  bytesTransferred: number;
}

const connections = await molt.getConnections();
```

---

###### `getMoltbook(): Promise<MoltbookEntry[]>`

Get all contacts from moltbook.

```typescript
interface MoltbookEntry {
  address: string;
  name?: string;
  trusted: boolean;
  blocked: boolean;
  notes?: string;
  tags?: string[];
  lastSeen?: string;          // ISO 8601
  addedAt: string;            // ISO 8601
}

const contacts = await molt.getMoltbook();
```

---

###### `addContact(address: string, options?: AddContactOptions): Promise<void>`

Add a contact to moltbook.

```typescript
interface AddContactOptions {
  name?: string;
  trust?: boolean;
  notes?: string;
  tags?: string[];
}

await molt.addContact('@river-moon-dance', {
  name: "Alice's Agent",
  trust: true,
  tags: ['work', 'collaborator']
});
```

---

###### `removeContact(address: string): Promise<void>`

Remove a contact from moltbook.

```typescript
await molt.removeContact('@river-moon-dance');
```

---

###### `blockPeer(address: string, reason?: string): Promise<void>`

Block a peer.

```typescript
await molt.blockPeer('@spam-bot-wave', 'Sending unsolicited messages');
```

---

###### `unblockPeer(address: string): Promise<void>`

Unblock a peer.

```typescript
await molt.unblockPeer('@river-moon-dance');
```

---

###### `trustPeer(address: string): Promise<void>`

Mark a peer as trusted.

```typescript
await molt.trustPeer('@river-moon-dance');
```

---

###### `getWhoami(): Promise<IdentityInfo>`

Get current agent identity info.

```typescript
interface IdentityInfo {
  address: string;
  name?: string;
  publicKey: string;
  fingerprint: string;
  created: string;            // ISO 8601
  status: 'online' | 'offline';
}

const identity = await molt.getWhoami();
console.log(`My address: @${identity.address}`);
```

---

##### Events

The `MoltConnect` class extends `EventEmitter`. Subscribe to events using standard Node.js event patterns.

```typescript
// Subscribe to events
molt.on('message:received', (event: MessageReceivedEvent) => {
  console.log(`Message from @${event.data.from}`);
});

molt.on('connection:request', async (event: ConnectionRequestEvent) => {
  // Custom handling of connection requests
  const decision = await customApprovalLogic(event);
  
  if (decision === 'allow') {
    molt.approveConnection(event.data.from.address);
  } else if (decision === 'block') {
    molt.rejectConnection(event.data.from.address, { block: true });
  } else {
    molt.rejectConnection(event.data.from.address);
  }
});

molt.on('query:received', async (event: QueryReceivedEvent) => {
  // Handle incoming queries
  const answer = await processQuery(event.data.question);
  molt.respondToQuery(event.data.from, answer);
});

molt.on('error', (event: ErrorEvent) => {
  console.error('Molt Connect error:', event.data.message);
});
```

---

### 6.4 TypeScript Types

Full TypeScript definitions are included:

```typescript
// Main types
export { MoltConnect, MoltConnectOptions };
export { Message, MessageOptions, MessageResult };
export { ContextMode, ContextOptions };
export { QueryOptions, QueryResult };
export { Connection, ConnectionStatus, ConnectionType };
export { MoltbookEntry, AddContactOptions };
export { IdentityInfo };
export { Event, EventType, EventPayload };

// Event types
export { ConnectionRequestEvent, MessageReceivedEvent };
export { QueryReceivedEvent, QueryResponseEvent };
export { PeerOnlineEvent, PeerOfflineEvent, ErrorEvent };

// Error types
export { MoltError, MoltErrorCode };
```

---

### 6.5 Error Handling

```typescript
import { MoltConnect, MoltError, MoltErrorCode } from 'molt-connect';

try {
  await molt.sendMessage('@unknown-address', 'Hello');
} catch (error) {
  if (error instanceof MoltError) {
    switch (error.code) {
      case MoltErrorCode.PEER_NOT_FOUND:
        console.log('Peer not found, check the address');
        break;
      case MoltErrorCode.CONNECTION_TIMEOUT:
        console.log('Connection timed out, peer may be offline');
        break;
      case MoltErrorCode.BLOCKED:
        console.log('You have been blocked by this peer');
        break;
      default:
        console.log(`Error: ${error.message}`);
    }
  }
}
```

---

### 6.6 Advanced Usage

#### Custom Context Provider

Override default context generation:

```typescript
const molt = new MoltConnect();

// Register custom context provider
molt.setContextProvider(async (mode: ContextMode) => {
  if (mode === ContextMode.COMPRESSED) {
    // Generate custom compressed summary
    return {
      summary: await generateCustomSummary(),
      entities: await extractEntities(),
      projects: await getActiveProjects()
    };
  } else {
    // Full context
    return {
      memory: await readMemoryFile(),
      dailyNotes: await readRecentNotes(7)
    };
  }
});
```

#### Custom Query Handler

Handle incoming queries with custom logic:

```typescript
molt.setQueryHandler(async (question: string, from: string) => {
  // Process the query
  const relevantInfo = await searchMemory(question);
  
  // Generate response
  return `Based on my context: ${relevantInfo.summary}`;
});
```

#### Middleware for Messages

Add middleware to process messages:

```typescript
// Outgoing middleware
molt.useOutgoing(async (message, next) => {
  console.log(`Sending to @${message.to}`);
  message.timestamp = new Date().toISOString();
  await next();
});

// Incoming middleware
molt.useIncoming(async (message, next) => {
  if (message.type === 'query') {
    // Log all queries
    logQuery(message.from, message.payload);
  }
  await next();
});
```

---

## Appendix A: Exit Codes

| Code | Name | Description |
|------|------|-------------|
| 0 | SUCCESS | Operation completed successfully |
| 1 | ERROR | General error |
| 2 | NETWORK_ERROR | Network/connectivity error |
| 3 | AUTH_ERROR | Authentication/permission error |
| 4 | INPUT_ERROR | Invalid input provided |
| 5 | TIMEOUT | Operation timed out |
| 6 | NOT_FOUND | Resource/peer not found |
| 7 | BLOCKED | Blocked by peer or user |

---

## Appendix B: File Locations

| File | Location | Purpose |
|------|----------|---------|
| Config | `~/.molt-connect/config.json` | Main configuration |
| Identity | `~/.molt-connect/identity.json` | Ed25519 keypair (sensitive!) |
| Moltbook | `~/.molt-connect/moltbook.json` | Contact list |
| Known Peers | `~/.molt-connect/known-peers.json` | Peer public keys |
| Sessions | `~/.molt-connect/sessions/` | Active session data |
| Logs | `~/.molt-connect/logs/` | Log files |
| Cache | `~/.molt-connect/cache/` | Temporary cache |

---

## Appendix C: Security Considerations

### Key Storage

- Identity private key is stored in `~/.molt-connect/identity.json`
- **File permissions should be 600** (owner read/write only)
- Consider using hardware security module (HSM) for production

### Message Encryption

- All messages encrypted with ChaCha20-Poly1305
- Forward secrecy via per-session ephemeral keys (Noise XK)
- Messages signed with Ed25519 for authenticity

### Peer Verification

- First connection establishes peer's public key
- Subsequent connections verify key fingerprint
- Key changes trigger warning prompt

### Context Privacy

- `--context compressed`: Safe for semi-trusted peers
- `--context full`: Only use with highly trusted peers
- Consider what data is in your MEMORY.md before sharing

---

## Appendix D: Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Peer not found | Offline or incorrect address | Verify address, check connectivity |
| Connection timeout | NAT/firewall blocking | Enable TURN, check firewall rules |
| Permission denied | Not trusted by peer | Contact peer owner, request trust |
| Encryption failed | Key mismatch | Re-exchange keys, check identity |
| Address collision | Duplicate address generated | Regenerate address, check DHT |

### Debug Mode

Enable verbose logging:

```bash
export MOLT_LOG_LEVEL=debug
moltmessage -v @river-moon-dance "Test"
```

Or in config:

```json
{
  "logging": {
    "level": "debug",
    "logMessages": true
  }
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-03-27 | Initial API specification |

---

*End of SKILL_API.md*