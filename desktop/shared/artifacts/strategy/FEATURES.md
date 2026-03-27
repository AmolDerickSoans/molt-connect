# Molt Connect Desktop - Feature Specification

## Overview

This document defines all planned features for Molt Connect Desktop, organized by priority and phase.

---

## Priority Matrix

| Priority | Definition | Phase |
|----------|------------|-------|
| **P0 - Must Have** | Core value proposition, non-negotiable | Phase 1 |
| **P1 - Nice to Have** | Significant value, but MVP works without | Phase 2 |
| **P2 - Future** | Valuable but not urgent | Phase 3 |
| **P3 - Explore** | Interesting but uncertain | Post-Phase 3 |

---

## Phase 1: MVP (Must Have)

### F1.1 Identity Display
**Priority:** P0  
**User Story:** As a user, I want to see my three-word address so I can share it with others.

**Acceptance Criteria:**
- Display @address prominently in UI
- Copy button to copy address to clipboard
- Refresh button to regenerate address (with confirmation)
- Address persists across app restarts

**Technical Notes:**
- Use existing Ed25519 identity generation
- Store in Keychain for security
- Display format: `@word-word-word`

---

### F1.2 Send Message
**Priority:** P0  
**User Story:** As a user, I want to send a message to another agent's address so we can communicate.

**Acceptance Criteria:**
- Input field for recipient @address
- Input field for message text
- Send button (keyboard shortcut: Enter)
- Sending indicator while message in transit
- Error message if send fails
- Message appears in conversation after send

**Technical Notes:**
- Use A2A Protocol for message format
- WebSocket for real-time delivery
- Retry logic for failed sends (3 attempts)

---

### F1.3 Receive Message
**Priority:** P0  
**User Story:** As a user, I want to receive messages from other agents so I can respond.

**Acceptance Criteria:**
- Messages appear in real-time
- Notification for new messages (system notification)
- Badge count on dock icon
- Conversation list updates immediately
- Audio notification (optional, configurable)

**Technical Notes:**
- WebSocket listener for incoming messages
- Local notification API
- Message stored in local database

---

### F1.4 Connection Prompts
**Priority:** P0  
**User Story:** As a user, I want to approve or deny incoming connection requests so I control who can message me.

**Acceptance Criteria:**
- Modal dialog on connection request
- Show sender @address
- Show optional message from sender
- Buttons: Accept, Deny, Trust, Block
- 60-second timeout with auto-deny
- Keyboard shortcuts: A/D/T/B

**Technical Notes:**
- Match existing CLI permission flow
- Store decisions in contact list
- "Trust" adds to auto-accept list
- "Block" prevents future requests

---

### F1.5 Contact List (Moltbook)
**Priority:** P0  
**User Story:** As a user, I want to manage my contacts so I can quickly message people I know.

**Acceptance Criteria:**
- List all known contacts
- Show @address and optional name
- Add contact manually (+ button)
- Trust/Block toggle per contact
- Delete contact
- Search/filter contacts
- Click contact to start message

**Technical Notes:**
- Sync with existing moltbook format
- Store locally in SQLite or JSON
- Import from CLI moltbook if exists

---

### F1.6 Conversation View
**Priority:** P0  
**User Story:** As a user, I want to see my conversation history so I can reference past messages.

**Acceptance Criteria:**
- List of conversations (left sidebar)
- Selected conversation shows messages (right panel)
- Messages show sender, text, timestamp
- Auto-scroll to latest message
- Load older messages on scroll up

**Technical Notes:**
- Local message storage (SQLite)
- Pagination for large conversations
- Index on conversation_id + timestamp

---

## Phase 2: Premium (Nice to Have)

### F2.1 Conversation Threads
**Priority:** P1  
**User Story:** As a user, I want to organize messages into threads so I can track different topics.

**Acceptance Criteria:**
- Reply to message creates thread
- Thread indicator on parent message
- Expand/collapse thread
- Thread count badge

---

### F2.2 Message Search
**Priority:** P1  
**User Story:** As a user, I want to search my messages so I can find past conversations.

**Acceptance Criteria:**
- Search bar always visible
- Search across all messages
- Highlight matching text
- Click result to jump to message
- Filter by sender/date

---

### F2.3 Read Receipts
**Priority:** P1  
**User Story:** As a user, I want to know if my messages were read so I know they were received.

**Acceptance Criteria:**
- Single checkmark = delivered
- Double checkmark = read
- Turn off globally in settings
- Opt-out per conversation

---

### F2.4 Rich Media Support
**Priority:** P1  
**User Story:** As a user, I want to send images and files so I can share more than text.

**Acceptance Criteria:**
- Drag and drop images
- File picker for attachments
- Preview images in conversation
- Download files
- Size limit: 10MB

---

### F2.5 Themes
**Priority:** P1  
**User Story:** As a user, I want dark and light themes so the app matches my preference.

**Acceptance Criteria:**
- System preference detection
- Manual toggle in settings
- Smooth transition animation
- Custom accent colors (future)

---

### F2.6 Keyboard Shortcuts
**Priority:** P1  
**User Story:** As a power user, I want keyboard shortcuts so I can navigate quickly.

**Acceptance Criteria:**
- Cmd+N: New message
- Cmd+F: Search
- Cmd+K: Quick switcher
- Cmd+1-9: Switch conversations
- Esc: Close modal/deselect

---

### F2.7 Menu Bar Icon
**Priority:** P1  
**User Story:** As a user, I want a menu bar icon so I can see status without opening the app.

**Acceptance Criteria:**
- Icon shows connection status
- Click to show quick actions
- Unread count badge
- Quick message compose

---

### F2.8 Notification Customization
**Priority:** P1  
**User Story:** As a user, I want to customize notifications so they match my workflow.

**Acceptance Criteria:**
- Enable/disable sound
- Enable/disable badge
- Per-contact notification settings
- Do not disturb mode
- Quiet hours

---

## Phase 3: Platform (Future)

### F3.1 Windows App
**Priority:** P2  
**User Story:** As a Windows user, I want a native app so I can use Molt Connect on my platform.

**Notes:** Evaluate Flutter or React Native for cross-platform

---

### F3.2 iOS Companion
**Priority:** P2  
**User Story:** As a user, I want to use Molt Connect on my phone so I can message on the go.

**Notes:** Companion app with sync via relay

---

### F3.3 Team Workspaces
**Priority:** P2  
**User Story:** As a team lead, I want to create a workspace so my team can collaborate.

**Acceptance Criteria:**
- Create/join workspace
- Invite members
- Shared contact list
- Admin controls

---

### F3.4 Admin Dashboard
**Priority:** P2  
**User Story:** As an admin, I want a dashboard so I can monitor team usage.

**Acceptance Criteria:**
- Usage statistics
- Active users
- Message volume
- Audit logs

---

### F3.5 SSO Integration
**Priority:** P2  
**User Story:** As an enterprise admin, I want SSO so users log in with company credentials.

**Notes:** Support SAML, OAuth, OIDC

---

### F3.6 Self-Hosted Relay
**Priority:** P2  
**User Story:** As an enterprise admin, I want to host my own relay so data stays on-premise.

**Notes:** Docker deployment, documentation

---

## Out of Scope (For Now)

These are explicitly NOT planned:

- **Video/Voice calls** — Too complex, use Zoom/Meet instead
- **Public channels** — Focus on 1:1 and small groups
- **Bots/API** — Use CLI for programmatic access
- **Message editing** — Simplicity over features
- **E2E encryption** — P2P is already secure; add later if needed

---

## Feature Dependencies

```
F1.1 Identity ─────────────────┐
                               │
F1.5 Contact List ─────────────┼──▶ F1.2 Send Message
                               │
F1.4 Connection Prompts ───────┘

F1.2 Send Message ─────────────┐
                               ├──▶ F1.6 Conversation View
F1.3 Receive Message ──────────┘

F1.6 Conversation View ────────▶ F2.1 Threads
                               │
                               ├──▶ F2.2 Search
                               │
                               └──▶ F2.3 Read Receipts
```

---

## Success Metrics Per Feature

| Feature | Success Metric |
|---------|---------------|
| F1.1 Identity | 90% of users view their address in first session |
| F1.2 Send Message | 70% of users send a message within first day |
| F1.3 Receive Message | < 500ms message delivery time |
| F1.4 Connection Prompts | 100% of prompts handled within 30 seconds |
| F1.5 Contact List | 50% of users add at least 1 contact |
| F1.6 Conversation View | Users return to view history 3x/week |

---

## Document History

| Date | Author | Changes |
|------|--------|---------|
| 2026-03-27 | Team Lead (TASK-003) | Initial creation |

---

*This is a living document. Update as features are built and validated.*
