# Success Criteria

## Definition of Done

**Molt Connect is "done" when all of the following are true.**

---

## Functional Requirements

### ✅ Addressing
- [ ] Agents can generate unique three-word addresses
- [ ] Addresses are validated for correct format
- [ ] Address book stores known peers with metadata
- [ ] `molt-whoami` shows current agent's address

### ✅ Discovery & Connection
- [ ] Agent A can discover Agent B by address
- [ ] Direct P2P connection works on same LAN
- [ ] NAT traversal works for most common NAT types
- [ ] Relay fallback works when direct connection fails
- [ ] Connection survives brief network interruptions

### ✅ Security
- [ ] All messages are end-to-end encrypted
- [ ] Identity is verified via Ed25519 signatures
- [ ] Key exchange produces unique session keys
- [ ] Forward secrecy optional but supported
- [ ] MITM attack is detected and blocked

### ✅ Permission System
- [ ] Incoming connections show permission prompt
- [ ] User sees sender address and optional message
- [ ] Allow, Deny, Block options work correctly
- [ ] Blocked addresses are rejected silently
- [ ] Permission decisions are logged

### ✅ Communication Modes
- [ ] Quick message: single text message sent and received
- [ ] Compressed context: summary + key facts transferred
- [ ] Full context: complete session state transferred
- [ ] Query mode: question sent, response received

### ✅ User Experience
- [ ] `moltmessage @addr [msg]` works as documented
- [ ] Incoming messages display clearly in TUI
- [ ] Error messages are actionable and clear
- [ ] Logs are viewable and understandable

---

## Technical Requirements

### ✅ Code Quality
- [ ] All modules have unit tests (>80% coverage)
- [ ] Integration tests cover happy paths
- [ ] Error paths are tested
- [ ] Code is linted and formatted

### ✅ Documentation
- [ ] README.md explains installation, usage, troubleshooting
- [ ] SKILL.md documents skill interface for OpenClaw
- [ ] PROTOCOL.md documents wire format for implementers
- [ ] Code has JSDoc comments for public APIs

### ✅ Installation
- [ ] Installable via `openclaw skill install molt-connect`
- [ ] Dependencies are minimal and well-justified
- [ ] First-run initialization works (generates keys, address)
- [ ] Works on macOS, Linux (Windows optional)

### ✅ Performance
- [ ] Message delivery < 500ms on same LAN
- [ ] Message delivery < 2s across NAT with relay
- [ ] Context compression reduces size by >50%
- [ ] Memory usage < 100MB idle

---

## Testing Requirements

### ✅ Automated Tests
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Test coverage report generated

### ✅ Manual Tests (performed by QA team)
- [ ] Two agents on same machine communicate
- [ ] Two agents on same LAN communicate
- [ ] Two agents across internet communicate
- [ ] Connection works through common NAT types
- [ ] Permission prompt appears and works
- [ ] Block list prevents connection
- [ ] Graceful handling of: offline peer, timeout, malformed messages

### ✅ Security Tests
- [ ] Replay attack is detected and rejected
- [ ] Tampered message is detected and rejected
- [ ] Unknown sender is rejected without permission
- [ ] Keys are properly isolated per session

---

## Shipping Requirements

### ✅ Package
- [ ] package.json is complete and correct
- [ ] All files are included in package
- [ ] .npmignore excludes dev files
- [ ] Version is set to 1.0.0

### ✅ ClawHub
- [ ] Skill is submitted to ClawHub
- [ ] Listing includes: name, description, tags
- [ ] Screenshot or demo available
- [ ] Installation tested from ClawHub

### ✅ Community
- [ ] Announcement posted to Moltbook
- [ ] Announcement posted to X
- [ ] Community can find, install, use independently

---

## Stretch Goals (Not Required for 1.0)

- [ ] Group conversations (3+ agents)
- [ ] File transfer
- [ ] Voice/audio messages
- [ ] Mobile node support (iOS/Android)
- [ ] Self-hosted relay documentation
- [ ] Plugin system for custom message types

---

## Acceptance Test

**The final acceptance test:**

1. Fresh OpenClaw instance (no prior molt-connect)
2. Install skill: `openclaw skill install molt-connect`
3. Initialize: `molt-whoami` → generates address
4. Second fresh instance on different machine
5. Install and initialize
6. Agent A sends: `moltmessage @agent-b-address "Hello from A"`
7. Agent B sees permission prompt, accepts
8. Agent B receives message
9. Agent B replies: `moltmessage @agent-a-address "Hi back!"`
10. Agent A receives reply
11. Both agents view connection history
12. Disconnect, reconnect — works
13. Block address — blocked
14. All logs present and readable

**If this passes, we ship.**

---

*Update this file as criteria are met. Check boxes when done.*
