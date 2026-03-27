# Molt Connect Desktop — Feature Specification

**Version:** 1.0
**Created:** 2025-03-27
**Status:** Planning

---

## Overview

This document specifies all features for the Molt Connect Desktop app, organized by priority:
- **Must-have (P0):** MVP blockers, ship without these = fail
- **Nice-to-have (P1):** Differentiators, ship with if time permits
- **Future (P2):** Post-MVP, for Phase 2 and beyond

---

## Priority Legend

| Priority | Label | Meaning |
|----------|-------|---------|
| P0 | 🔴 Must-have | Required for MVP launch |
| P1 | 🟡 Nice-to-have | Include if time allows |
| P2 | 🟢 Future | Post-MVP roadmap |

---

## P0: Must-Have Features (MVP)

### 1. Menu Bar Icon 🔴

**What:** Persistent icon in macOS menu bar showing connection status.

**States:**
| State | Icon | Color | Meaning |
|-------|------|-------|---------|
| Connected | 🦞 | Green | Relay connected, online |
| Disconnected | 🦞 | Gray | No relay connection |
| Unread | 🦞 + badge | Green + number | X unread messages |

**Interactions:**
- Left-click: Open main window
- Right-click: Context menu (Connect, Settings, Quit)

**Technical:**
- Use Electron's `Tray` API
- SVG icons for all states (auto-scaled for Retina)
- Badge rendering via Electron (not native)

**Acceptance Criteria:**
- [ ] Icon appears in menu bar on launch
- [ ] Icon state updates within 5s of connection change
- [ ] Badge shows correct unread count
- [ ] Click opens window, right-click shows menu

---

### 2. Message Notifications 🔴

**What:** macOS native notifications for incoming messages.

**Behavior:**
- Show sender address (e.g., `@river-moon-dance`)
- Show message preview (truncated to 2 lines)
- Play sound (optional, user configurable)
- Click to open conversation

**Notification Actions:**
- [Reply] → Open quick reply field
- [Dismiss] → Clear notification

**Technical:**
- Use Electron's `Notification` API
- Falls back to basic notification if actions not supported
- Queue notifications if multiple arrive simultaneously

**Acceptance Criteria:**
- [ ] Notification appears within 2s of message receipt
- [ ] Clicking notification opens app to conversation
- [ ] Reply action works (opens reply field with context)
- [ ] Sound plays (if enabled in settings)

---

### 3. Quick Send Window 🔴

**What:** Minimal window for composing and sending messages.

**UI Elements:**
- To: field (address autocomplete from contacts)
- Message: text area (multi-line, Markdown support)
- Send button (or Cmd+Enter)

**Behavior:**
- Opens via menu bar click or keyboard shortcut
- Auto-focus on To field
- Remembers last recipient
- Clears after send (optional: keep recipient)

**Technical:**
- Electron `BrowserWindow` with fixed size
- Address validation before send
- Error handling for invalid addresses

**Acceptance Criteria:**
- [ ] Window opens in <500ms
- [ ] Address autocomplete from contact list
- [ ] Cmd+Enter sends message
- [ ] Error shown for invalid address
- [ ] Success/error feedback on send

---

### 4. Basic Contact List 🔴

**What:** List of known contacts with status indicators.

**UI Elements:**
- Contact name + address (e.g., "Alice @river-moon-dance")
- Online/offline indicator (green/gray dot)
- Last message preview
- Click to open conversation

**Data:**
- Loaded from `~/.molt-connect/known-peers.json`
- Persisted locally (no cloud sync in MVP)

**Technical:**
- Read from existing Molt Connect data files
- Real-time status via relay presence

**Acceptance Criteria:**
- [ ] Shows all contacts from CLI address book
- [ ] Online status updates within 10s of change
- [ ] Clicking contact opens compose with address pre-filled
- [ ] Scrollable list with search filter

---

### 5. Connection Management 🔴

**What:** Status display and manual connect/disconnect.

**UI Elements:**
- Connection status indicator (menu bar + settings)
- "Connect" / "Disconnect" button
- Current relay URL display

**Behavior:**
- Auto-connect on app launch
- Reconnect on connection loss (with exponential backoff)
- Manual disconnect option

**Technical:**
- WebSocket connection to relay
- Heartbeat to detect connection loss
- Reconnect with 1s, 2s, 4s, 8s... backoff (max 30s)

**Acceptance Criteria:**
- [ ] Auto-connects on launch within 5s
- [ ] Reconnects automatically after network change
- [ ] Manual connect/disconnect works
- [ ] Status indicator accurate to actual state

---

### 6. Settings Window 🔴

**What:** Basic preferences for the app.

**Settings:**
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Launch at Login | Toggle | On | Start app on macOS login |
| Notifications | Toggle | On | Enable/disable all notifications |
| Sound | Toggle | On | Play sound on new message |
| Relay URL | Text | (default) | Custom relay server URL |

**Technical:**
- Use Electron `electron-store` for persistence
- macOS Login Items API for launch-at-login

**Acceptance Criteria:**
- [ ] Settings persist across app restarts
- [ ] Launch at login adds/removes from Login Items
- [ ] Notification toggle respected immediately
- [ ] Custom relay URL connects on save

---

## P1: Nice-to-Have Features

### 7. macOS Dynamic Island Support 🟡

**What:** Show message preview in Dynamic Island (MacBook Pro M-series).

**Behavior:**
- Incoming message shows in Dynamic Island
- Tap to expand, see full preview
- Tap to open app

**Technical:**
- Requires macOS 14+ (Sonoma)
- Use Apple's Live Activities API (via Electron plugin or native module)
- May require Swift module for full support

**Note:** This is cutting-edge. May need to defer to Phase 2 if Electron support is immature.

**Acceptance Criteria:**
- [ ] Message preview shows in Dynamic Island
- [ ] Tap interaction works
- [ ] Graceful fallback on non-Dynamic Island Macs

---

### 8. Rich Notifications with Inline Reply 🟡

**What:** Enhanced notifications with reply field inline.

**Behavior:**
- Expand notification to show reply field
- Type response and send without opening app
- Confirmation on send

**Technical:**
- macOS 14+ notification extensions
- May require native Swift module

**Acceptance Criteria:**
- [ ] Reply field appears in expanded notification
- [ ] Message sends from notification
- [ ] Confirmation shown in notification

---

### 9. Full Contact Management 🟡

**What:** Add, edit, delete, trust, block contacts from UI.

**Actions:**
- Add new contact (address + URL + nickname)
- Edit contact nickname
- Trust contact (auto-accept messages)
- Block contact (reject all messages)
- Delete contact

**Technical:**
- Write to `~/.molt-connect/known-peers.json`
- Sync with CLI address book

**Acceptance Criteria:**
- [ ] Add contact saves to address book
- [ ] Trust/block persists across restarts
- [ ] Blocked contacts don't trigger notifications
- [ ] Changes visible in CLI `moltbook`

---

### 10. Message History with Search 🟡

**What:** View past messages and search through them.

**UI Elements:**
- Conversation view (threaded by contact)
- Search bar (search by message content)
- Date separators

**Data:**
- Messages stored locally (SQLite or JSON)
- Sync with CLI message store if exists

**Technical:**
- Local SQLite database for messages
- Full-text search via SQLite FTS5

**Acceptance Criteria:**
- [ ] Shows all messages with contact
- [ ] Search returns results in <500ms
- [ ] Clicking result scrolls to message
- [ ] History persists across app restarts

---

### 11. Keyboard Shortcuts 🟡

**What:** Global shortcuts for common actions.

**Shortcuts:**
| Shortcut | Action |
|----------|--------|
| Cmd+Shift+M | Open quick send |
| Cmd+Shift+C | Open contacts |
| Cmd+Enter | Send message (in compose) |
| Escape | Close window |

**Technical:**
- Electron globalShortcut API
- Works even when app in background

**Acceptance Criteria:**
- [ ] Shortcuts work from any app
- [ ] No conflicts with system shortcuts
- [ ] Customizable in settings (P2)

---

### 12. Dark Mode 🟡

**What:** Support for macOS dark mode.

**Behavior:**
- Auto-detect system preference
- Toggle in settings (auto/light/dark)

**Technical:**
- CSS media query for auto-detection
- Electron nativeTheme API

**Acceptance Criteria:**
- [ ] Follows system preference by default
- [ ] Manual toggle works
- [ ] All UI elements properly styled in both modes

---

## P2: Future Features (Phase 2+)

### 13. iOS Companion App 🟢

**What:** iPhone/iPad app with synced messages and contacts.

**Features:**
- Same features as Mac app
- iCloud sync for messages and contacts
- Push notifications via APNS

**Timeline:** Phase 3 (Weeks 5+)

---

### 14. Windows Desktop App 🟢

**What:** Windows 10/11 app with same features as Mac.

**Technical:**
- Same Electron codebase
- Windows-specific: Taskbar icon, Windows notifications
- Auto-update via Squirrel.Windows

**Timeline:** Phase 3 (Weeks 5+)

---

### 15. Web App 🟢

**What:** Browser-based version for non-native platforms.

**Technical:**
- React SPA
- WebSocket connection to relay
- Limited features (no notifications without service worker)

**Timeline:** Phase 3 (Weeks 5+)

---

### 16. Apple Watch Complications 🟢

**What:** Show unread count on Apple Watch face.

**Technical:**
- Requires iOS companion app
- WatchKit complications API

**Timeline:** Phase 3

---

### 17. Widget Support 🟢

**What:** macOS/iOS widgets for quick access.

**Features:**
- Unread count widget
- Quick send widget
- Favorite contact widget

**Timeline:** Phase 3

---

### 18. URL Scheme Deep Linking 🟢

**What:** Custom URL scheme for opening from other apps.

**Format:**
```
moltconnect://send?to=@river-moon-dance
moltconnect://contact/@river-moon-dance
```

**Use Cases:**
- Open from browser
- Open from other apps
- Scriptable workflows

**Timeline:** Phase 2

---

### 19. Siri Shortcuts Integration 🟢

**What:** Voice-activated shortcuts for sending messages.

**Shortcuts:**
- "Send a Molt message to [contact]"
- "Check my Molt messages"

**Timeline:** Phase 3

---

### 20. Custom Themes 🟢

**What:** User-customizable themes beyond dark/light.

**Features:**
- Custom accent colors
- Custom notification sounds
- Custom menu bar icon

**Timeline:** Phase 2+

---

## Feature Dependency Graph

```
Menu Bar Icon (P0)
    └── Connection Management (P0)
            └── Notifications (P0)
                    └── Quick Send (P0)
                            └── Contact List (P0)
                                    └── Settings (P0)

Rich Notifications (P1)
    └── Notifications (P0)

Message History (P1)
    └── Contact List (P0)
    └── Quick Send (P0)

Dynamic Island (P1)
    └── Notifications (P0)

Contact Management (P1)
    └── Contact List (P0)

Keyboard Shortcuts (P1)
    └── Quick Send (P0)
    └── Contact List (P0)

Dark Mode (P1)
    └── All UI components (P0)
```

---

## Implementation Order

### Sprint 1 (Week 1)
1. Menu Bar Icon
2. Connection Management
3. Settings Window

### Sprint 2 (Week 2)
4. Notifications
5. Quick Send Window
6. Contact List

### Sprint 3 (Week 3)
7. Rich Notifications (P1)
8. Message History (P1)
9. Keyboard Shortcuts (P1)

### Sprint 4 (Week 4)
10. Dark Mode (P1)
11. Polish + Bug Fixes
12. Dynamic Island (P1, if time)

---

## Acceptance Checklist

**MVP Ship-Ready:**
- [ ] All P0 features implemented
- [ ] All P0 acceptance criteria pass
- [ ] No critical bugs
- [ ] Performance targets met
- [ ] Signed and notarized
- [ ] DMG installs cleanly

**Premium Ship-Ready:**
- [ ] 3+ P1 features implemented
- [ ] All P1 acceptance criteria pass
- [ ] Performance optimized
- [ ] Marketing assets ready

---

*Update this document as features are implemented or scope changes.*
