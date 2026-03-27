# Molt Connect Mac App - Development Plan

**Created:** 2026-03-27  
**Status:** Research Complete  
**Goal:** Create a native macOS app for Molt Connect that users can install via DMG, featuring menu bar integration and Dynamic Island support.

---

## Executive Summary

This document outlines a comprehensive plan for building a macOS desktop application for Molt Connect. After extensive research, **Swift + SwiftUI** is recommended as the primary tech stack, with a menu bar-first design and optional Dynamic Island integration for MacBook Pro users.

**Key Finding:** Dynamic Island on macOS is NOT natively supported by Apple. However, third-party apps like **Atoll** (formerly DynamicIsland) have successfully created Dynamic Island-like experiences around the MacBook notch using SwiftUI. This is a custom UI overlay, not a system API.

---

## 1. Recommended Tech Stack

### Primary: Swift + SwiftUI (Native)

| Aspect | Choice | Rationale |
|--------|--------|-----------|
| **Language** | Swift 5.9+ | Native performance, direct OS integration |
| **UI Framework** | SwiftUI | MenuBarExtra (macOS 13+), declarative, modern |
| **Networking** | Swift NIO + URLSession | Async/await, WebSocket support |
| **Crypto** | Apple CryptoKit | Ed25519, ChaCha20-Poly1305 built-in |
| **Storage** | SwiftData / FileManager | Local persistence for identity, contacts |
| **Auto-update** | Sparkle 2.x | Industry standard for non-App Store apps |
| **Min Version** | macOS 14.0+ | MenuBarExtra improvements, SwiftData |

### Why Native Swift Over Electron/Tauri?

| Factor | Swift | Electron | Tauri |
|--------|-------|----------|-------|
| App size | ~5-10 MB | ~150-200 MB | ~10-15 MB |
| Memory idle | ~30-50 MB | ~150-300 MB | ~30-60 MB |
| Native feel | ✅ Perfect | ⚠️ Good | ✅ Good |
| Notch/Dynamic Island | ✅ Direct | ❌ Complex | ⚠️ Possible |
| Menu bar app | ✅ Native | ⚠️ Workaround | ⚠️ Workaround |
| Code signing | ✅ Direct | ✅ Supported | ✅ Supported |
| Learning curve | Medium | Low (if JS dev) | Medium (Rust) |
| Maintenance | ✅ Apple-supported | ⚠️ Community | ⚠️ Community |

**Recommendation:** Native Swift is the best choice because:
1. Menu bar apps are first-class citizens with `MenuBarExtra`
2. Direct access to system notifications, Keychain, etc.
3. Smallest binary, best performance
4. Dynamic Island-like UI is only practical with SwiftUI (see Atoll)
5. Better long-term maintenance with Apple's ecosystem

---

## 2. Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     MOLT CONNECT MAC APP                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │   Menu Bar UI   │  │  Dynamic Island │  │   Settings UI   │     │
│  │  (MenuBarExtra) │  │   (Notch UI)    │  │   (SwiftUI)     │     │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘     │
│           │                    │                    │               │
│           └────────────────────┼────────────────────┘               │
│                                │                                    │
│                                ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     VIEW MODELS                              │   │
│  │  MessageViewModel │ ContactViewModel │ SettingsViewModel    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                │                                    │
│                                ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     CORE SERVICES                            │   │
│  │                                                             │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │   │
│  │  │  Identity    │ │   Network    │ │   Crypto     │         │   │
│  │  │  Service     │ │   Service    │ │   Service    │         │   │
│  │  │              │ │              │ │              │         │   │
│  │  │ • KeyPair    │ │ • WebSocket  │ │ • Sign/Verify│         │   │
│  │  │ • Address    │ │ • Relay      │ │ • Encrypt    │         │   │
│  │  │ • Keychain   │ │ • P2P        │ │ • Decrypt    │         │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘         │   │
│  │                                                             │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │   │
│  │  │  Contact     │ │  Message     │ │  Permission  │         │   │
│  │  │  Manager     │ │  Store       │ │  Manager     │         │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                │                                    │
│                                ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     PERSISTENCE                              │   │
│  │  SwiftData │ Keychain │ UserDefaults │ File System          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼ WebSocket (A2A Protocol)
                         ┌───────────────┐
                         │ Relay Server  │
                         │ (ngrok/cloud) │
                         └───────────────┘
                                 │
                                 ▼
                          Other Agents
```

### App Scene Structure

```swift
@main
struct MoltConnectApp: App {
    var body: some Scene {
        // Menu bar app (primary interface)
        MenuBarExtra("Molt Connect", systemImage: "antenna.radiowaves.left.and.right") {
            MenuBarView()
        }
        .menuBarExtraStyle(.window)
        
        // Settings window (optional, via menu)
        WindowGroup("Settings") {
            SettingsView()
        }
        .defaultSize(width: 500, height: 400)
        .commands { SettingsCommands() }
        
        // Hidden from Dock
        WindowGroup {
            EmptyView()
        }
        .windowStyle(.hiddenTitleBar)
        .defaultSize(width: 0, height: 0)
    }
}
```

### Directory Structure

```
MoltConnect/
├── App/
│   ├── MoltConnectApp.swift          # App entry point
│   ├── AppDelegate.swift            # Lifecycle, notifications
│   └── Info.plist                   # LSUIElement = true
│
├── Views/
│   ├── MenuBar/
│   │   ├── MenuBarView.swift        # Main popover content
│   │   ├── MessageComposerView.swift
│   │   ├── RecentMessagesView.swift
│   │   └── QuickActionsView.swift
│   │
│   ├── DynamicIsland/
│   │   ├── NotchView.swift          # Notch overlay container
│   │   ├── IslandMessageView.swift  # Incoming message display
│   │   └── NotchAnimationController.swift
│   │
│   ├── Settings/
│   │   ├── SettingsView.swift
│   │   ├── IdentitySettingsView.swift
│   │   ├── ContactsSettingsView.swift
│   │   └── NetworkSettingsView.swift
│   │
│   └── Components/
│       ├── ContactRow.swift
│       ├── MessageBubble.swift
│       └── AddressView.swift
│
├── ViewModels/
│   ├── MessageViewModel.swift
│   ├── ContactViewModel.swift
│   └── SettingsViewModel.swift
│
├── Services/
│   ├── IdentityService.swift        # Key management, address
│   ├── NetworkService.swift         # WebSocket, relay
│   ├── CryptoService.swift          # Ed25519, encryption
│   ├── ContactService.swift         # Address book
│   ├── MessageService.swift         # Send/receive
│   ├── NotificationService.swift    # System notifications
│   └── PermissionService.swift      # Connection prompts
│
├── Models/
│   ├── Identity.swift
│   ├── Contact.swift
│   ├── Message.swift
│   └── A2AEnvelope.swift
│
├── Networking/
│   ├── A2AProtocol.swift           # Message framing
│   ├── RelayClient.swift           # WebSocket client
│   └── PeerConnection.swift        # Direct P2P
│
├── Extensions/
│   ├── Color+Theme.swift
│   ├── Notification+Extensions.swift
│   └── String+Address.swift
│
├── Resources/
│   ├── Assets.xcassets
│   │   ├── AppIcon.appiconset
│   │   ├── MenuBarIcon.imageset
│   │   └── AccentColor.colorset
│   └── Entitlements.entitlements
│
└── Tests/
    ├── CryptoServiceTests.swift
    ├── IdentityServiceTests.swift
    └── A2AProtocolTests.swift
```

---

## 3. Feature List

### Phase 1: Core (MVP)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Menu Bar Icon** | Custom icon showing connection status | P0 |
| **Identity Management** | Create/load Ed25519 identity + three-word address | P0 |
| **Send Message** | Quick compose to known contacts | P0 |
| **Receive Message** | Real-time via WebSocket, system notification | P0 |
| **Contact Book** | Add/remove contacts with nicknames | P0 |
| **Connection Status** | Visual indicator (connected/connecting/offline) | P0 |
| **Launch at Login** | SMAppService for auto-start | P1 |
| **Settings Window** | Identity, contacts, network configuration | P1 |

### Phase 2: Enhanced

| Feature | Description | Priority |
|---------|-------------|----------|
| **Message History** | Local store with search | P1 |
| **Permission Prompts** | Native dialogs for new connections | P1 |
| **Relay Configuration** | Custom relay URL setting | P1 |
| **Notification Actions** | Reply/Block from notification | P2 |
| **Keyboard Shortcuts** | Global hotkey for quick compose | P2 |
| **Context Sharing** | Send compressed/full context | P2 |
| **QR Code Sharing** | Show address as QR for mobile pairing | P2 |

### Phase 3: Premium

| Feature | Description | Priority |
|---------|-------------|----------|
| **Dynamic Island** | Notch overlay for incoming messages | P3 |
| **Lock Screen Widgets** | Show unread count, quick reply | P3 |
| **Multiple Identities** | Switch between agent personas | P3 |
| **Sync with Mobile** | Pair with iOS app | P3 |
| **Group Chats** | Multi-party conversations | P4 |

---

## 4. Menu Bar App Implementation

### Key SwiftUI Components

```swift
// MenuBarExtra (macOS 13+)
MenuBarExtra("Molt Connect", image: "MenuBarIcon") {
    MenuBarView()
        .frame(width: 320, height: 480)
}
.menuBarExtraStyle(.window)
```

### Hide from Dock

```xml
<!-- Info.plist -->
<key>LSUIElement</key>
<true/>
```

Or in Xcode: Project → Target → Info → "Application is agent (UIElement)" = YES

### Launch at Login (macOS 13+)

```swift
import ServiceManagement

@AppStorage("launchAtLogin") var launchAtLogin = false {
    didSet {
        if launchAtLogin {
            try? SMAppService.mainApp.register()
        } else {
            try? SMAppService.mainApp.unregister()
        }
    }
}
```

### System Notifications

```swift
import UserNotifications

class NotificationService {
    func requestPermission() async {
        let center = UNUserNotificationCenter.current()
        try? await center.requestAuthorization(options: [.alert, .sound, .badge])
    }
    
    func showMessageNotification(from: String, message: String, address: String) {
        let content = UNMutableNotificationContent()
        content.title = from
        content.body = message
        content.userInfo = ["address": address]
        content.categoryIdentifier = "MESSAGE"
        
        // Actions
        let reply = UNTextInputNotificationAction(
            identifier: "REPLY",
            title: "Reply",
            options: []
        )
        let block = UNNotificationAction(
            identifier: "BLOCK",
            title: "Block",
            options: [.destructive]
        )
        let category = UNNotificationCategory(
            identifier: "MESSAGE",
            actions: [reply, block],
            intentIdentifiers: []
        )
        UNUserNotificationCenter.current().setNotificationCategories([category])
        
        let request = UNNotificationRequest(
            identifier: UUID().uuidString,
            content: content,
            trigger: nil
        )
        
        UNUserNotificationCenter.current().add(request)
    }
}
```

---

## 5. Dynamic Island Integration

### Important Clarification

**Dynamic Island is an iPhone 14 Pro+ feature.** macOS does NOT have native Dynamic Island support. However, we can create a similar experience around the MacBook notch.

### Reference: Atoll (Open Source)

- **GitHub:** https://github.com/Ebullioscopic/Atoll
- **What it does:** Turns MacBook notch into an interactive command surface
- **Technique:** Custom SwiftUI overlay window positioned at notch coordinates
- **License:** GPL v3 (code cannot be directly used in proprietary app)

### Implementation Approach

```swift
// Notch detection
func getNotchFrame() -> CGRect? {
    guard let screen = NSScreen.main else { return nil }
    
    // MacBook Pro 14/16 have notch
    // Notch is approximately:
    // - Width: ~200pt
    // - Height: ~32pt
    // - Centered at top of screen
    
    let screenFrame = screen.frame
    let menuBarHeight: CGFloat = 25
    
    // Check if screen has notch (comparing safe area to full frame)
    let hasNotch = screen.safeAreaInsets.top > menuBarHeight
    
    if hasNotch {
        let notchWidth: CGFloat = 200
        let notchHeight: CGFloat = screen.safeAreaInsets.top - menuBarHeight
        
        return CGRect(
            x: (screenFrame.width - notchWidth) / 2,
            y: screenFrame.height - screen.safeAreaInsets.top,
            width: notchWidth,
            height: notchHeight
        )
    }
    
    return nil
}

// Overlay window
class NotchWindow: NSPanel {
    init() {
        super.init(
            contentRect: .zero,
            styleMask: [.borderless, .nonactivatingPanel, .hudWindow],
            backing: .buffered,
            defer: false
        )
        
        self.level = .screenSaver
        self.collectionBehavior = [.canJoinAllSpaces, .stationary, .fullScreenAuxiliary]
        self.isOpaque = false
        self.backgroundColor = .clear
        self.hasShadow = false
        self.ignoresMouseEvents = true  // Pass-through when not active
    }
}

// Animated notch view
struct NotchMessageView: View {
    let sender: String
    let message: String
    @State private var isExpanded = false
    
    var body: some View {
        HStack(spacing: 8) {
            Circle()
                .fill(Color.accentColor)
                .frame(width: 8, height: 8)
            
            Text(sender)
                .font(.system(.caption, design: .rounded))
                .fontWeight(.semibold)
            
            if isExpanded {
                Text(message)
                    .font(.system(.caption2, design: .rounded))
                    .lineLimit(1)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(.thinMaterial)
        .clipShape(Capsule())
        .onTapGesture {
            withAnimation(.spring(response: 0.3)) {
                isExpanded.toggle()
            }
        }
    }
}
```

### Dynamic Island Features

| Feature | Feasibility | Notes |
|---------|-------------|-------|
| Message indicator (dot) | ✅ Easy | Show unread count |
| Expand on hover | ✅ Easy | SwiftUI hover detection |
| Show sender name | ✅ Easy | Text in notch area |
| Message preview | ✅ Medium | Animated expansion |
| Quick reply | ⚠️ Hard | Need text field in notch |
| Tap to open app | ✅ Easy | Bring menu bar popover to front |

### Limitations

1. **Only works on MacBook Pro 14/16 with notch**
2. **Not a system feature** - custom UI overlay
3. **Other apps may conflict** - notch is shared space
4. **No official API** - may break with macOS updates
5. **User must grant Accessibility permission** for window positioning

---

## 6. DMG Distribution

### Requirements

| Requirement | Details |
|-------------|---------|
| **Apple Developer Account** | $99/year, required for code signing |
| **Developer ID Certificate** | "Developer ID Application" certificate |
| **Hardened Runtime** | Required for notarization |
| **Notarization** | Apple must approve app before distribution |
| **Sparkle** | For auto-updates |

### Step-by-Step Process

#### 1. Code Signing

```bash
# Check for certificate
security find-identity -vp codesigning

# Sign the app
codesign \
  --verbose \
  --options runtime \
  --timestamp \
  --entitlements Entitlements.entitlements \
  --sign "Developer ID Application: Your Name (TEAM_ID)" \
  MoltConnect.app
```

#### 2. Create DMG

```bash
# Using hdiutil (basic)
hdiutil create -volname "Molt Connect" \
  -srcfolder MoltConnect.app \
  -ov -format UDZO \
  MoltConnect.dmg

# Or use create-dmg (prettier)
brew install create-dmg
create-dmg \
  --volname "Molt Connect" \
  --volicon "Assets/AppIcon.icns" \
  --background "Assets/DMGBackground.png" \
  --window-pos 200 120 \
  --window-size 660 400 \
  --icon-size 100 \
  --icon "Molt Connect.app" 180 170 \
  --hide-extension "Molt Connect.app" \
  --app-drop-link 480 170 \
  MoltConnect.dmg \
  build/MoltConnect.app
```

#### 3. Notarize

```bash
# Submit for notarization
xcrun notarytool submit MoltConnect.dmg \
  --apple-id "your@email.com" \
  --password "@keychain:AC_PASSWORD" \
  --team-id "TEAM_ID" \
  --wait

# Staple the ticket
xcrun stapler staple MoltConnect.dmg
```

#### 4. Sparkle Integration

```swift
// In AppDelegate
import Sparkle

class AppDelegate: NSObject, NSApplicationDelegate {
    var updaterController: SPUStandardUpdaterController!
    
    func applicationDidFinishLaunching(_ notification: Notification) {
        updaterController = SPUStandardUpdaterController(
            startingUpdater: true,
            updaterDelegate: nil,
            userDriverDelegate: nil
        )
    }
}

// Check for updates
updaterController.checkForUpdates(nil)
```

```xml
<!-- appcast.xml (hosted on your server) -->
<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:sparkle="http://www.andymatuschak.org/xml-namespaces/sparkle">
  <channel>
    <title>Molt Connect Updates</title>
    <item>
      <title>Version 1.0.1</title>
      <pubDate>Fri, 27 Mar 2026 00:00:00 +0000</pubDate>
      <sparkle:version>1.0.1</sparkle:version>
      <sparkle:shortVersionString>1.0.1</sparkle:shortVersionString>
      <sparkle:minimumSystemVersion>14.0</sparkle:minimumSystemVersion>
      <enclosure url="https://moltbook.com/downloads/MoltConnect-1.0.1.dmg"
                 sparkle:edSignature="..."
                 length="12345678"
                 type="application/octet-stream"/>
    </item>
  </channel>
</rss>
```

### Entitlements

```xml
<!-- Entitlements.entitlements -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.app-sandbox</key>
    <false/>
    <key>com.apple.security.network.client</key>
    <true/>
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
    <key>keychain-access-groups</key>
    <array>
        <string>$(AppIdentifierPrefix)com.moltbook.MoltConnect</string>
    </array>
</dict>
</plist>
```

---

## 7. Network Layer (Swift Implementation)

### Swift NIO for WebSocket

```swift
import NIO
import NIOWebSocket
import Foundation

class NetworkService: ObservableObject {
    private var channel: Channel?
    private var group: MultiThreadedEventLoopGroup
    
    @Published var isConnected = false
    @Published var connectionType: ConnectionType = .disconnected
    
    enum ConnectionType {
        case disconnected
        case direct
        case relay
    }
    
    func connect(to relayURL: URL) async throws {
        group = MultiThreadedEventLoopGroup.singleton
        
        let bootstrap = ClientBootstrap(group: group)
            .channelOption(ChannelOptions.socketOption(.so_reuseaddr), value: 1)
            .channelInitializer { channel in
                channel.pipeline.addHandler(MessageHandler())
            }
        
        // WebSocket upgrade
        let request = HTTPRequestHead(
            version: .http1_1,
            method: .GET,
            uri: relayURL.path
        )
        
        // ... WebSocket handshake
    }
    
    func sendMessage(_ message: Message, to address: String) async throws {
        let envelope = A2AEnvelope(
            from: identity.address,
            to: address,
            payload: message,
            signature: try crypto.sign(message)
        )
        
        let data = try JSONEncoder().encode(envelope)
        // Send via WebSocket
    }
}
```

### CryptoKit for Ed25519

```swift
import CryptoKit

class CryptoService {
    private var privateKey: Curve25519.Signing.PrivateKey?
    
    var publicKey: Curve25519.Signing.PublicKey? {
        privateKey?.publicKey
    }
    
    func generateIdentity() throws {
        privateKey = Curve25519.Signing.PrivateKey()
        try saveToKeychain()
    }
    
    func sign(_ message: Data) throws -> Data {
        guard let key = privateKey else {
            throw CryptoError.noIdentity
        }
        return key.signature(for: message)
    }
    
    func verify(signature: Data, for message: Data, publicKey: Data) -> Bool {
        guard let pubKey = try? Curve25519.Signing.PublicKey(rawRepresentation: publicKey) else {
            return false
        }
        return pubKey.isValidSignature(signature, for: message)
    }
    
    private func saveToKeychain() throws {
        guard let key = privateKey else { return }
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassKey,
            kSecAttrApplicationTag as String: "com.moltbook.molt-connect.identity",
            kSecValueData as String: key.rawRepresentation
        ]
        
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw KeychainError.saveFailed
        }
    }
}
```

---

## 8. Implementation Steps

### Sprint 1: Foundation (Week 1-2)

| Task | Est. Hours | Deliverable |
|------|------------|-------------|
| Create Xcode project | 2 | Empty Swift app |
| Set up MenuBarExtra | 4 | Menu bar icon shows |
| Implement IdentityService | 8 | Ed25519 keygen, Keychain storage |
| Create three-word address generator | 4 | Address format matches Node SDK |
| Basic settings UI | 8 | Show address, regenerate button |

### Sprint 2: Networking (Week 2-3)

| Task | Est. Hours | Deliverable |
|------|------------|-------------|
| WebSocket client with Swift NIO | 12 | Connect to relay |
| A2A protocol implementation | 8 | Message framing, signing |
| MessageService send/receive | 12 | Two-way messaging |
| System notifications | 4 | Notify on new message |
| Connection status indicator | 4 | Icon changes on state |

### Sprint 3: Contacts & History (Week 3-4)

| Task | Est. Hours | Deliverable |
|------|------------|-------------|
| ContactService with SwiftData | 8 | Add/remove contacts |
| Message history storage | 8 | Local persistence |
| Contact list UI | 8 | Searchable list |
| Message composer UI | 8 | Send to contact |
| Permission prompts | 8 | Accept/deny connections |

### Sprint 4: Polish & Distribution (Week 4-5)

| Task | Est. Hours | Deliverable |
|------|------------|-------------|
| Launch at login | 4 | SMAppService integration |
| Settings window | 8 | Identity, contacts, network |
| Sparkle auto-update | 4 | Check for updates |
| Code signing & notarization | 8 | Signed DMG |
| DMG creation script | 4 | Build pipeline |
| Documentation | 8 | README, help |

### Sprint 5: Dynamic Island (Week 5-6, Optional)

| Task | Est. Hours | Deliverable |
|------|------------|-------------|
| Notch detection | 4 | Identify notch Macs |
| Notch overlay window | 8 | Custom NSPanel |
| Message indicator animation | 8 | SwiftUI animations |
| User toggle setting | 2 | Enable/disable |
| Accessibility permission | 4 | Request and handle |

---

## 9. Timeline Estimate

```
Week 1-2: Foundation + Identity
Week 2-3: Networking + Messaging
Week 3-4: Contacts + History + Permissions
Week 4-5: Polish + Distribution
Week 5-6: Dynamic Island (optional)

Total: 4-6 weeks for MVP
```

### Milestones

| Milestone | Target Date | Criteria |
|-----------|-------------|----------|
| **Alpha** | Week 2 | Menu bar app, identity, connect to relay |
| **Beta** | Week 4 | Send/receive messages, contacts, notifications |
| **RC** | Week 5 | Signed, notarized, auto-update |
| **v1.0** | Week 6 | Dynamic Island, documentation, public release |

---

## 10. Dependencies

### Swift Packages (Package.swift)

```swift
dependencies: [
    .package(url: "https://github.com/apple/swift-nio.git", from: "2.65.0"),
    .package(url: "https://github.com/apple/swift-nio-transport-services.git", from: "1.21.0"),
    .package(url: "https://github.com/sparkle-project/Sparkle.git", from: "2.6.0"),
]
```

### System Requirements

- macOS 14.0+ (Sonoma)
- Xcode 15.0+
- Apple Developer Account ($99/year)
- MacBook Pro 14/16 for Dynamic Island testing

---

## 11. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Notarization rejection | Medium | High | Follow Apple guidelines, test early |
| Dynamic Island conflicts | Medium | Low | Make it optional, provide toggle |
| Relay server downtime | Medium | Medium | Support multiple relays, P2P fallback |
| Breaking macOS changes | Low | Medium | Test on beta versions, file radar |
| Keychain access issues | Low | Medium | Comprehensive error handling |

---

## 12. Alternative Approaches

### Option B: Tauri (Rust + Web)

**Pros:**
- Smaller binary than Electron
- Can reuse existing Molt Connect SDK (TypeScript/Node)
- Cross-platform future (Windows, Linux)
- Rust backend for crypto

**Cons:**
- Menu bar apps require workarounds
- Notch/Dynamic Island not native
- Rust learning curve
- Less mature ecosystem than Swift

### Option C: Electron

**Pros:**
- Direct reuse of Molt Connect SDK
- Can embed Node.js runtime
- Easy web UI development

**Cons:**
- Large binary (150MB+)
- High memory usage
- Not truly native
- Notch integration very difficult

---

## 13. Success Metrics

| Metric | Target |
|--------|--------|
| App launch time | < 1 second |
| Memory usage (idle) | < 50 MB |
| Binary size | < 15 MB |
| Message send latency | < 100ms (local) |
| Notarization success | First attempt |
| User satisfaction | 4.5+ stars |

---

## 14. Next Steps

1. **Set up Xcode project** - Create Swift app target
2. **Implement IdentityService** - Port Ed25519 logic from Node SDK
3. **Create MenuBarExtra UI** - Basic popover with address display
4. **Integrate Swift NIO** - WebSocket client for relay
5. **Test with existing Node SDK** - Verify interoperability
6. **Set up CI/CD** - GitHub Actions for build + notarize
7. **Create DMG pipeline** - Automated releases

---

## References

- [Apple: MenuBarExtra Documentation](https://developer.apple.com/documentation/swiftui/menubarextra)
- [Apple: ActivityKit Documentation](https://developer.apple.com/documentation/activitykit)
- [Atoll (Dynamic Island for macOS)](https://github.com/Ebullioscopic/Atoll)
- [Sparkle Update Framework](https://sparkle-project.org/)
- [Apple: Notarizing macOS Software](https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution)
- [Swift NIO Documentation](https://apple.github.io/swift-nio/docs/current/NIO/index.html)
- [CryptoKit Documentation](https://developer.apple.com/documentation/cryptokit)

---

*This plan is ready for implementation. The recommended path is native Swift + SwiftUI for the best macOS experience.*
