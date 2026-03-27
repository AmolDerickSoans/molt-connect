# Mac App Research Findings

**Research Date:** 2026-03-27  
**Task ID:** TASK-002  
**Researcher:** Subagent (Researcher - TASK-002)

---

## Table of Contents
1. [Menu Bar App Development](#1-menu-bar-app-development)
2. [Dynamic Island on macOS](#2-dynamic-island-on-macos)
3. [DMG Distribution, Code Signing, Notarization](#3-dmg-distribution-code-signing-notarization)
4. [Tech Stack Comparison](#4-tech-stack-comparison)
5. [Molt SDK Integration Considerations](#5-molt-sdk-integration-considerations)
6. [Summary & Recommendations](#6-summary--recommendations)

---

## 1. Menu Bar App Development

### Question
How to create macOS menu bar apps that provide always-visible status and quick actions?

### Options

#### Option A: Native Swift (MenuBarExtra) — Recommended for native apps

**Pros:**
- Native SwiftUI API since macOS 13 (Ventura)
- Smallest memory footprint (~20-50MB RAM)
- Best macOS integration (notifications, shortcuts, Login Items)
- No runtime overhead
- Direct access to Apple frameworks
- Best performance and battery life

**Cons:**
- Requires Swift/SwiftUI knowledge
- Cannot reuse existing web/JS code
- Separate codebase from potential web/mobile apps
- Xcode required for development

**Effort:** Medium (2-3 weeks for experienced Swift dev)

**Code Example:**
```swift
import SwiftUI

@main
struct MoltConnectApp: App {
    var body: some Scene {
        MenuBarExtra("Molt Connect", systemImage: "ant.circle") {
            MenuBarView()
        }
        .menuBarExtraStyle(.window) // or .menu for dropdown
    }
}

struct MenuBarView: View {
    var body: some View {
        VStack {
            Text("Status: Connected")
            Button("Send Message") { /* action */ }
            Divider()
            Button("Settings") { /* action */ }
            Button("Quit") { NSApp.terminate(nil) }
        }
        .frame(width: 300, height: 400)
    }
}
```

**Key APIs:**
- `MenuBarExtra` (macOS 13+) — SwiftUI native menu bar
- `NSStatusBar` (older macOS) — AppKit fallback
- `UNUserNotificationCenter` — Notifications
- `ServiceManagement` — Login Items

---

#### Option B: Electron Tray API — Recommended for cross-platform

**Pros:**
- Cross-platform (Mac, Windows, Linux)
- Reuse existing web skills (JS/TS/React)
- Rich ecosystem of npm packages
- Easy to integrate with Molt SDK (TypeScript)
- Extensive documentation

**Cons:**
- Large bundle size (~150MB+ for minimal app)
- Higher memory usage (~150-300MB RAM)
- Battery drain on laptops
- Slower startup time
- Requires Chromium runtime

**Effort:** Low (1-2 weeks for JS dev)

**Code Example:**
```javascript
const { app, Tray, Menu, BrowserWindow, Notification } = require('electron')
const path = require('path')

let tray = null
let window = null

function createTray() {
  tray = new Tray(path.join(__dirname, 'icon.png'))
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Connected', enabled: false },
    { type: 'separator' },
    { label: 'Send Message', click: () => openQuickSend() },
    { label: 'Settings', click: () => openSettings() },
    { type: 'separator' },
    { label: 'Quit', role: 'quit' }
  ])
  
  tray.setToolTip('Molt Connect')
  tray.setContextMenu(contextMenu)
  
  tray.on('click', () => {
    openQuickSend()
  })
}

function showNotification(title, body) {
  new Notification({
    title: title,
    body: body,
    silent: false
  }).show()
}
```

---

#### Option C: Tauri Tray Icon — Best balance of size and dev experience

**Pros:**
- Small bundle size (~600KB-5MB)
- Native webview (uses system WebKit on macOS)
- Lower memory usage than Electron (~50-100MB RAM)
- Can use any frontend framework (React, Vue, Svelte)
- Good tray/notification APIs
- Security-focused architecture
- Can call Rust for native operations

**Cons:**
- Requires Rust for backend logic (learning curve)
- Smaller community than Electron
- Some native features require Rust plugins
- Less mature than Electron

**Effort:** Medium (2-3 weeks for JS dev + Rust basics)

**Code Example:**
```typescript
import { TrayIcon } from '@tauri-apps/api/tray'
import { Menu } from '@tauri-apps/api/menu'
import { defaultWindowIcon } from '@tauri-apps/api/app'

async function createTray() {
  const menu = await Menu.new({
    items: [
      { id: 'connected', text: 'Connected', enabled: false },
      { type: 'separator' },
      { id: 'send', text: 'Send Message' },
      { id: 'settings', text: 'Settings' },
      { type: 'separator' },
      { id: 'quit', text: 'Quit' }
    ]
  })

  const tray = await TrayIcon.new({
    icon: await defaultWindowIcon(),
    menu,
    menuOnLeftClick: true,
    action: (event) => {
      if (event.type === 'Click' && event.button === 'Left') {
        // Open quick send window
      }
    }
  })
}
```

---

## 2. Dynamic Island on macOS

### Question
Is Dynamic Island available on macOS? If not, what are alternatives?

### Finding: Dynamic Island is NOT available on macOS

**Status: NOT POSSIBLE**

Dynamic Island is an **iPhone 14 Pro and later exclusive feature**. It is a hardware-software combination that relies on:
1. **Hardware:** Pill-shaped cutout in OLED display with surrounding pixels for animations
2. **Software:** iOS 16.1+ Live Activities API

**Why not on macOS:**
- MacBook displays do not have the Dynamic Island hardware
- macOS does not expose the Live Activities API
- Apple has not announced plans for Dynamic Island on Mac

### Alternatives for Always-Visible Status on macOS

#### Option A: Menu Bar Icon (Standard)
**Best option for macOS.** This is what most Mac apps use.

**Features:**
- Persistent icon with status indicator
- Badge for unread count (Electron supports this)
- Dropdown menu or popover window on click
- Native macOS experience

**Examples:** Slack, Discord, Dropbox, Spotify

---

#### Option B: Notification Center Widgets
**macOS 14+ supports interactive widgets in Notification Center.**

**Features:**
- Show status, unread count, quick actions
- User can add to desktop (macOS 14 Sonoma)
- SwiftUI-only (no cross-platform)

**Requirements:**
- macOS 14+ (Sonoma)
- Swift/SwiftUI development
- Widget Extension target

---

#### Option C: Dock Icon with Badge
**Standard macOS pattern for unread indicators.**

**Features:**
- Badge on dock icon for unread count
- Menu on right-click
- Less prominent than menu bar

**Implementation:**
```swift
// SwiftUI
NSApplication.shared.dockTile.badgeLabel = "3"
```

```javascript
// Electron
app.dock.setBadge('3')
```

---

#### Option D: Desktop Floating Widget
**Custom always-on-top window.**

**Features:**
- Always visible on desktop
- Can show rich content
- Can be dragged anywhere

**Cons:**
- Not native macOS experience
- Can be annoying to users
- Requires careful UX design

---

### Recommendation
Use **Menu Bar Icon** as the primary always-visible status. This is the standard macOS pattern and matches user expectations. For a more prominent presence, add **Notification Center Widget** as a P1/P2 feature.

---

## 3. DMG Distribution, Code Signing, Notarization

### Question
What is the process for distributing macOS apps outside the App Store?

### Overview

```
Development → Build → Code Sign → Notarize → Staple → DMG → Distribute
```

### Step 1: Apple Developer Account

**Required:** Yes, for distribution outside App Store  
**Cost:** $99/year (Individual) or $299/year (Organization)  
**URL:** https://developer.apple.com

**What you get:**
- Developer ID Application certificate (for code signing)
- Developer ID Installer certificate (for pkg installers)
- Access to notarization service

---

### Step 2: Code Signing

**Purpose:** Proves the app is from a verified developer.

**Requirements:**
- Mac with Xcode installed
- Developer ID Application certificate from Apple
- App bundle (.app) to sign

**Process:**
```bash
# List available certificates
security find-identity -v -p codesigning

# Sign the app
codesign --deep --force --verify --verbose \
  --sign "Developer ID Application: Your Name (TEAM_ID)" \
  --options runtime \
  /path/to/YourApp.app

# Verify signature
codesign --verify --deep --strict --verbose=2 /path/to/YourApp.app
```

**For Electron Apps:**
```bash
# Use electron-builder
electron-builder --mac --publish never

# Or electron-forge
electron-forge make
```

**For Tauri Apps:**
```bash
# Tauri handles signing via cargo-bundle
cargo tauri build
```

---

### Step 3: Notarization

**Purpose:** Apple scans the app for malware. Required for macOS 10.15+ (Catalina).

**Process:**
```bash
# 1. Create a ZIP of the signed app
ditto -c -k --keepParent YourApp.app YourApp.zip

# 2. Submit for notarization
xcrun notarytool submit YourApp.zip \
  --apple-id "your@email.com" \
  --password "@keychain:AC_PASSWORD" \
  --team-id "TEAM_ID" \
  --wait

# 3. Check status (if not using --wait)
xcrun notarytool info <submission-id> \
  --apple-id "your@email.com" \
  --password "@keychain:AC_PASSWORD" \
  --team-id "TEAM_ID"

# 4. Staple the ticket to the app
xcrun stapler staple YourApp.app
```

**App Store Connect API Key (Recommended):**
```bash
# Create API key at App Store Connect → Users → Keys
xcrun notarytool submit YourApp.zip \
  --key <API_KEY_ID> \
  --key-profile <PROFILE_NAME> \
  --issuer <ISSUER_ID> \
  --wait
```

**Typical Timeline:** 1-5 minutes for small apps

---

### Step 4: DMG Creation

**Purpose:** Disk image for easy installation.

**Tools:**

| Tool | Type | Pros | Cons |
|------|------|------|------|
| `hdiutil` | CLI | Built-in macOS | Limited customization |
| `create-dmg` | CLI | Open source, customizable | External dependency |
| `electron-builder` | CLI | Auto DMG for Electron | Electron-only |
| `cargo-bundle` | CLI | Rust/Tauri native | Rust-specific |
| DropDMG | GUI | User-friendly | Paid ($24) |

**Using `hdiutil` (Native):**
```bash
# Create a temporary folder for DMG contents
mkdir -p dmg-temp
cp -r YourApp.app dmg-temp/

# Create DMG
hdiutil create -volname "Molt Connect" \
  -srcfolder dmg-temp \
  -ov -format UDZO \
  MoltConnect.dmg

# Clean up
rm -rf dmg-temp
```

**Using `create-dmg` (Recommended for CI):**
```bash
# Install
brew install create-dmg

# Create DMG with background and icon positioning
create-dmg \
  --volname "Molt Connect" \
  --volicon "icon.icns" \
  --background "background.png" \
  --window-pos 200 120 \
  --window-size 660 400 \
  --icon-size 100 \
  --icon "Molt Connect.app" 180 170 \
  --hide-extension "Molt Connect.app" \
  --app-drop-link 480 170 \
  "MoltConnect.dmg" \
  "Molt Connect.app"
```

---

### Step 5: Auto-Update

**Options:**

| Framework | Solution | Notes |
|-----------|----------|-------|
| Electron | `electron-updater` | Built into electron-builder |
| Tauri | Built-in updater | Requires Rust backend |
| Swift | Sparkle | Industry standard for Mac apps |

**Sparkle (for Swift apps):**
- Open source, MIT license
- Supports delta updates (smaller downloads)
- Handles signature verification
- Background updates

**Implementation:**
```swift
import Sparkle

// Check for updates
SUUpdater.shared().checkForUpdatesInBackground()
```

**Electron Auto-Update:**
```javascript
const { autoUpdater } = require('electron-updater')

app.on('ready', () => {
  autoUpdater.checkForUpdatesAndNotify()
})
```

---

### CI/CD Integration

**GitHub Actions Example:**
```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build-mac:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Sign and Notarize
        env:
          CSC_LINK: ${{ secrets.MAC_CERT }}
          CSC_KEY_PASSWORD: ${{ secrets.MAC_CERT_PASSWORD }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_ID_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
          TEAM_ID: ${{ secrets.TEAM_ID }}
        run: npm run release
        
      - name: Upload DMG
        uses: actions/upload-artifact@v3
        with:
          name: MoltConnect-mac
          path: release/*.dmg
```

---

## 4. Tech Stack Comparison

### Question
Which tech stack is best for the Molt Connect Desktop app?

### Detailed Comparison

| Factor | Swift/SwiftUI | Electron | Tauri |
|--------|---------------|----------|-------|
| **Bundle Size** | 5-15 MB | 150-300 MB | 1-10 MB |
| **Memory Usage** | 20-50 MB | 150-300 MB | 50-100 MB |
| **Startup Time** | Instant | 1-3 seconds | <1 second |
| **Battery Impact** | Minimal | High | Low |
| **Native Feel** | ★★★★★ | ★★★☆☆ | ★★★★☆ |
| **Development Speed** | ★★★☆☆ | ★★★★★ | ★★★★☆ |
| **Team Skills Match** | Needs Swift dev | JS/TS team | JS/TS + Rust basics |
| **Molt SDK Integration** | Complex | Easy (TypeScript) | Medium (JS bridge) |
| **Cross-Platform** | No (Mac only) | Yes | Yes |
| **Learning Curve** | High | Low | Medium |
| **Ecosystem** | Apple-only | Very large | Growing |
| **Security** | Native | Medium | High (Rust) |

---

### Option A: Native Swift (SwiftUI)

**Best For:**
- Mac-only app (no cross-platform needs)
- Maximum performance and battery efficiency
- Smallest bundle size
- Best native experience

**Integration with Molt SDK:**
- Molt SDK is TypeScript/Node.js
- Would need to:
  1. Rewrite Molt SDK in Swift, OR
  2. Embed Node.js runtime (complex), OR
  3. Use IPC to communicate with a separate Node process

**Recommendation:** Only choose Swift if:
- Planning Mac-only app
- Team has Swift experience
- Willing to maintain separate logic from Molt SDK

**Effort Estimate:**
- Learning Swift/SwiftUI: 2-4 weeks (for JS dev)
- Building MVP: 3-4 weeks
- Maintaining separate codebase: Ongoing

---

### Option B: Electron

**Best For:**
- Cross-platform desktop app (Mac, Windows, Linux)
- Team with strong JavaScript/TypeScript skills
- Reusing existing web code/knowledge
- Fastest development time

**Integration with Molt SDK:**
- **Direct import** — Molt SDK is TypeScript, works natively
- Can share code with web/mobile versions
- Node.js runtime included in Electron

**Bundle Size Considerations:**
- Base Electron app: ~150MB
- With Molt SDK dependencies: ~160MB
- With native modules (libsodium, etc.): ~170MB

**Recommendation:** Choose Electron if:
- Need cross-platform support
- Team is JS/TS focused
- Bundle size is acceptable for target users
- Want fastest time to market

**Effort Estimate:**
- Setup: 1 day
- Building MVP: 2-3 weeks
- Cross-platform testing: 1 week

---

### Option C: Tauri

**Best For:**
- Small bundle size requirement
- Cross-platform with native performance
- Security-focused architecture
- Team willing to learn some Rust

**Integration with Molt SDK:**
- Frontend: JavaScript/TypeScript (same as Electron)
- Backend: Rust for native operations
- **Challenge:** Molt SDK is Node.js, not browser-compatible
- **Solution Options:**
  1. Run Molt SDK as sidecar process
  2. Rewrite core logic in Rust
  3. Use Tauri's shell plugin to call Node.js

**Sidecar Approach:**
```rust
// tauri.conf.json
{
  "bundle": {
    "externalBin": ["../node-sidecar"]
  }
}
```

```typescript
// Frontend calls sidecar
import { Command } from '@tauri-apps/plugin-shell'
const result = await Command.create('node-sidecar', ['molt', 'send']).execute()
```

**Recommendation:** Choose Tauri if:
- Bundle size is critical
- Team comfortable with some Rust
- Willing to solve Molt SDK integration challenge
- Want better security story

**Effort Estimate:**
- Learning Tauri + Rust basics: 1-2 weeks
- Building MVP: 3-4 weeks
- Molt SDK integration: 1 week
- Cross-platform testing: 1 week

---

## 5. Molt SDK Integration Considerations

### Current Molt SDK Stack
Based on `~/clawd/molt-connect/ARCHITECTURE.md`:

```
Dependencies:
- libsodium-wrappers (crypto)
- wrtc (WebRTC for P2P)
- zstd-codec (compression)
- multicast-dns (mDNS)
- stun (NAT traversal)
```

### Integration Matrix

| Tech Stack | Integration Approach | Effort | Maintenance |
|------------|---------------------|--------|-------------|
| **Swift** | Rewrite in Swift | High | High (dual codebase) |
| **Electron** | Direct import | Low | Low (shared code) |
| **Tauri** | Sidecar process | Medium | Medium |

### Recommendation: Electron for MVP, Consider Tauri for v2

**Why Electron first:**
1. Molt SDK is TypeScript — works directly
2. `wrtc` is native Node module — Electron supports it
3. Fastest development time
4. Team can use existing skills

**Tauri consideration:**
1. Bundle size may be a concern for some users
2. Tauri is more complex to integrate with Node.js SDK
3. Consider Tauri for v2 if bundle size is a top user complaint

---

## 6. Summary & Recommendations

### Key Findings

| Question | Finding |
|----------|---------|
| Menu Bar App | All three stacks support it. Swift is native, Electron/Tauri have good APIs. |
| Dynamic Island | **Not available on macOS.** Use Menu Bar Icon instead. |
| Distribution | Requires Apple Developer account ($99/yr), code signing, notarization. Sparkle for auto-update. |
| Tech Stack | Electron recommended for MVP due to TypeScript compatibility. Tauri for v2 if size matters. |

### Recommended Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MOLT CONNECT DESKTOP                      │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                   ELECTRON APP                          ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  ││
│  │  │ Main Process│  │ Tray Icon   │  │ Notifications   │  ││
│  │  │ (Node.js)   │  │ (Electron)  │  │ (Electron API)  │  ││
│  │  └──────┬──────┘  └─────────────┘  └─────────────────┘  ││
│  │         │                                                 ││
│  │         ▼                                                 ││
│  │  ┌─────────────────────────────────────────────────────┐││
│  │  │              MOLT SDK (TypeScript)                   │││
│  │  │  ┌───────────┐ ┌───────────┐ ┌───────────────────┐  │││
│  │  │  │ Address   │ │ Crypto    │ │ Network (P2P)     │  │││
│  │  │  │ Module    │ │ Module    │ │ Module            │  │││
│  │  │  └───────────┘ └───────────┘ └───────────────────┘  │││
│  │  └─────────────────────────────────────────────────────┘││
│  │         │                                                 ││
│  │         ▼                                                 ││
│  │  ┌─────────────────────────────────────────────────────┐││
│  │  │              Renderer Process (UI)                   │││
│  │  │  ┌─────────────────────────────────────────────────┐│││
│  │  │  │  React / Vue / Svelte (Web Technologies)        ││││
│  │  │  │  - Quick Send Window                            ││││
│  │  │  │  - Contact List                                 ││││
│  │  │  │  - Settings                                     ││││
│  │  │  │  - Message History                              ││││
│  │  │  └─────────────────────────────────────────────────┘│││
│  │  └─────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Distribution: DMG (signed, notarized) + Sparkle auto-update │
└─────────────────────────────────────────────────────────────┘
```

### Decision Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Tech Stack** | Electron | Direct Molt SDK integration, fastest MVP, JS team skills |
| **Menu Bar** | Electron Tray API | Native enough, well documented |
| **Dynamic Island** | N/A (not possible) | Use Menu Bar Icon with badge |
| **Distribution** | DMG + Sparkle | Standard for Mac apps outside App Store |
| **Code Signing** | Required | Apple Developer account needed |
| **Auto-Update** | Sparkle | Industry standard, handles signatures |

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Bundle size too large | Medium | Low | Acceptable for developer tools; consider Tauri for v2 |
| Electron performance issues | Low | Medium | Use native modules for critical paths |
| Apple notarization delays | Low | Medium | Submit early, use CI/CD |
| wrtc compatibility issues | Medium | Medium | Test early, use electron-rebuild |

---

## Sources

- [Tauri Documentation](https://tauri.app/start/)
- [Electron Tray Tutorial](https://www.electronjs.org/docs/latest/tutorial/tray)
- [Apple Code Signing Guide](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [Sparkle Framework](https://sparkle-project.org/)
- [Molt Connect Architecture](~/clawd/molt-connect/ARCHITECTURE.md)
- [Molt Connect Features](~/clawd/molt-connect/desktop/FEATURES.md)

---

*Research completed: 2026-03-27*
