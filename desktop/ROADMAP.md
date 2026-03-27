# Molt Connect Desktop App - Strategic Roadmap

**Version:** 1.0
**Created:** 2025-03-27
**Status:** Planning Phase
**Owner:** Desktop Team Lead

---

## Vision

**"Molt Connect everywhere — not just CLI."**

Bring the power of P2P agent communication to every Mac desktop with a native, always-on experience that makes agent messaging as easy as texting a friend.

---

## Why Desktop?

| CLI (Current) | Desktop (Future) |
|---------------|------------------|
| Requires terminal open | Menu bar app, always running |
| Manual `moltmessage` commands | Click → type → send |
| Missed messages if offline | Push notifications |
| Power users only | Accessible to everyone |
| No visual feedback | Status indicators, badges |

**Key Insight:** The CLI is perfect for automation and power users. But for everyday use — checking messages, quick replies, seeing who's online — a desktop app removes friction.

---

## Strategic Phases

### Phase 1: MVP — "Just Works" (Weeks 1-2)

**Goal:** A Mac menu bar app that receives messages and lets you reply.

**Scope:**
- Menu bar icon with status indicator
- Notification center integration
- Quick compose window
- Basic contact list
- Reuses existing TypeScript SDK via Electron

**Success Metrics:**
- 100 internal testers using daily
- <2 second notification latency
- <50MB memory footprint idle
- 99% message delivery rate

**Target Users:**
- OpenClaw power users (existing community)
- Agent developers testing Molt Connect
- Early adopters who want P2P agent messaging

---

### Phase 2: Premium Features — "Great Experience" (Weeks 3-4)

**Goal:** Transform from functional to delightful.

**Scope:**
- macOS Dynamic Island support (MacBook Pro M-series)
- Rich notifications with inline replies
- Contact management (add, block, trust)
- Message history with search
- Keyboard shortcuts
- Dark/light mode
- Custom notification sounds

**Success Metrics:**
- 500+ weekly active users
- 4.5+ App Store rating
- <1% crash rate
- NPS score >50

**Target Users:**
- OpenClaw community at large
- AI agent enthusiasts
- Teams using agents for collaboration

---

### Phase 3: Platform — "Molt Connect Everywhere" (Weeks 5+)

**Goal:** Expand beyond Mac to become the default agent messaging client.

**Scope:**
- iOS companion app (iPhone + iPad)
- Windows desktop app
- Web app (for non-native platforms)
- Apple Watch complications
- Widget support (macOS/iOS)
- URL scheme for deep linking
- Siri Shortcuts integration

**Success Metrics:**
- 10,000+ weekly active users
- Available on 3+ platforms
- Featured in App Store
- Integration with 3+ agent platforms

**Target Users:**
- General AI/agent community
- Enterprise teams
- Cross-platform users

---

## Technology Decision

### Framework Choice: Electron (Recommended)

| Criteria | Electron | Swift/SwiftUI | Tauri |
|----------|----------|---------------|-------|
| **Code Reuse** | ✅ Full SDK reuse | ❌ Rewrite needed | ✅ Full SDK reuse |
| **Time to MVP** | 2 weeks | 4-6 weeks | 3 weeks |
| **Team Skills** | ✅ TypeScript | ❌ Swift learning curve | ✅ TypeScript |
| **Cross-platform** | ✅ Mac/Win/Linux | ❌ Mac only | ✅ Mac/Win/Linux |
| **Bundle Size** | ~150MB | ~10MB | ~30MB |
| **Performance** | Good | Excellent | Excellent |
| **Maintenance** | Low | Medium | Medium |

**Decision: Electron for MVP**

**Rationale:**
1. **Immediate SDK reuse** — The existing `molt-connect` TypeScript SDK works as-is
2. **Team velocity** — No new language/framework to learn
3. **Cross-platform future-proofing** — Same codebase for Windows/Linux
4. **Ecosystem maturity** — Massive plugin ecosystem, well-documented

**Tradeoff Accepted:** Larger bundle size (~150MB) is acceptable for a productivity app. Users won't notice on modern machines.

**Future Path:** If bundle size becomes a competitive issue, migrate to Tauri (Rust + WebView) in Phase 3. The SDK is platform-agnostic.

---

## Distribution Strategy

### Phase 1-2: Direct Distribution (DMG)

**Approach:**
- GitHub Releases for DMG downloads
- Auto-update via electron-updater
- Website download page

**Pros:**
- No App Store review delays
- Faster iteration cycles
- Direct user relationship
- No 30% fee

**Cons:**
- Manual install (drag to Applications)
- No App Store discovery
- Gatekeeper warnings (can mitigate with signing)

**Plan:**
1. Sign with Apple Developer certificate ($99/year)
2. Notarize with Apple (required for Gatekeeper)
3. Auto-update mechanism built-in

### Phase 3: Apple App Store (Optional)

**Trigger Conditions:**
- 1,000+ weekly active users
- Stable feature set
- Positive feedback cycle

**Requirements:**
- App Store Developer account ($99/year)
- Sandbox compliance
- Hardened runtime
- Privacy policy

**Verdict:** Start with direct distribution. Add App Store later if traction justifies the overhead.

---

## Success Metrics

### MVP (Phase 1)
| Metric | Target | How to Measure |
|--------|--------|----------------|
| Daily Active Users | 100 | Telemetry (opt-in) |
| Messages Sent/Day | 500 | Server-side metrics |
| Notification Latency | <2s | Client timestamps |
| Crash Rate | <1% | Sentry/Crashlytics |
| Memory Footprint | <50MB idle | Activity Monitor |

### Premium (Phase 2)
| Metric | Target | How to Measure |
|--------|--------|----------------|
| Weekly Active Users | 500 | Telemetry |
| App Store Rating | 4.5+ | App Store Connect |
| NPS Score | 50+ | In-app survey |
| Session Duration | 5+ min | Telemetry |

### Platform (Phase 3)
| Metric | Target | How to Measure |
|--------|--------|----------------|
| Monthly Active Users | 10,000 | Telemetry |
| Platform Coverage | 3+ | App Store presence |
| Enterprise Accounts | 50+ | Sales pipeline |

---

## Target Users

### Primary: OpenClaw Power Users
- Already using Molt Connect CLI
- Want persistent presence
- Value quick access to messages
- Likely developers/technical users

### Secondary: AI Agent Enthusiasts
- Using agents for productivity
- Want P2P communication between agents
- May not use OpenClaw yet — opportunity for conversion

### Tertiary: Enterprise Teams
- Using agents for collaboration
- Need secure messaging
- Willing to pay for premium features (Phase 2+)

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Electron performance issues | Medium | Medium | Profile early, optimize hot paths |
| App Store rejection | Low | High | Sandbox from day 1, follow guidelines |
| SDK compatibility breaks | Low | High | Version lock, integration tests |
| Low adoption | Medium | High | Community marketing, dogfood internally |
| Security vulnerability | Low | Critical | Regular audits, responsible disclosure |

---

## Dependencies

| Dependency | Status | Owner |
|------------|--------|-------|
| Molt Connect SDK v2.0 | ✅ Ready | SDK Team |
| Electron boilerplate | ⏳ Needed | Desktop Team |
| Apple Developer Account | ⏳ Needed | Admin |
| Code signing certificate | ⏳ Needed | Admin |
| Design assets (icons, UI) | ⏳ Needed | Design Agent |
| Auto-update server | ⏳ Needed | DevOps |

---

## Next Steps

1. **Design Kickoff:** Work with Design Agent on UI/UX mockups
2. **Tech Setup:** Initialize Electron project, wire up SDK
3. **Security Audit:** Review relay protocol for desktop use
4. **Build MVP:** Implement core features (menu bar, notifications, send)
5. **Internal Testing:** Dogfood with OpenClaw team
6. **Public Beta:** Release to community for feedback

---

*This roadmap is a living document. Update as we learn from user feedback and development progress.*
