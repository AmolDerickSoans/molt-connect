# Architecture Decision: Molt Connect Desktop Tech Stack

**Decision Date:** 2026-03-27  
**Decision ID:** ARCH-001  
**Status:** Recommended (Pending Stakeholder Approval)  
**Deciders:** Research Team → Product Owner

---

## Decision

**We recommend Electron as the tech stack for Molt Connect Desktop MVP.**

---

## Context

Molt Connect is building a desktop app with the following requirements:

### Functional Requirements
- Menu bar icon with status indicator
- macOS native notifications
- Quick send window
- Contact list with online status
- Connection management
- Settings persistence

### Non-Functional Requirements
- Native macOS feel
- Small distribution size (preferred)
- Low memory footprint (preferred)
- Easy maintenance

### Constraints
- Molt SDK is TypeScript/Node.js
- Team is primarily JavaScript/TypeScript skilled
- Timeline: 3-4 weeks for MVP

---

## Options Considered

### Option A: Swift/SwiftUI

**Pros:**
- Best native experience
- Smallest bundle (~5-15 MB)
- Best performance and battery life
- Direct access to all Apple frameworks

**Cons:**
- ❌ Cannot use Molt SDK directly
- ❌ Would require rewriting core logic in Swift
- ❌ Maintains separate codebase from Molt SDK
- ❌ Team lacks Swift expertise
- ❌ No cross-platform path

**Effort:** High (4-6 weeks for team new to Swift)

---

### Option B: Electron

**Pros:**
- ✅ Direct import of Molt SDK (both TypeScript)
- ✅ Team has existing JavaScript/TypeScript skills
- ✅ Fastest development time
- ✅ Cross-platform future (Windows, Linux)
- ✅ Mature ecosystem and documentation
- ✅ Built-in tray, notification, auto-update support

**Cons:**
- Large bundle size (~150-170 MB)
- Higher memory usage (~150-300 MB)
- Not truly "native" look and feel
- Battery impact on laptops

**Effort:** Low (2-3 weeks for experienced JS team)

---

### Option C: Tauri

**Pros:**
- Small bundle size (~1-10 MB)
- Lower memory usage than Electron
- Security-focused architecture
- Cross-platform
- Native webview (WebKit on macOS)

**Cons:**
- ❌ Molt SDK is Node.js, not browser-compatible
- ❌ Requires sidecar process or Rust rewrite for SDK integration
- ❌ Team lacks Rust experience
- ❌ Less mature ecosystem than Electron
- ❌ Additional complexity for SDK integration

**Effort:** Medium-High (3-5 weeks including SDK integration)

---

## Decision Matrix

| Criterion | Weight | Swift | Electron | Tauri |
|-----------|--------|-------|----------|-------|
| Molt SDK Integration | 30% | 2/10 | 10/10 | 5/10 |
| Development Speed | 20% | 4/10 | 10/10 | 6/10 |
| Team Skills Match | 20% | 3/10 | 10/10 | 7/10 |
| Bundle Size | 10% | 10/10 | 3/10 | 9/10 |
| Memory Usage | 10% | 10/10 | 3/10 | 7/10 |
| Native Feel | 5% | 10/10 | 5/10 | 7/10 |
| Cross-Platform | 5% | 2/10 | 10/10 | 10/10 |
| **Weighted Score** | **100%** | **4.7** | **8.4** | **6.7** |

**Winner: Electron (8.4/10)**

---

## Decision Rationale

### Primary Factor: Molt SDK Integration

The Molt SDK is written in TypeScript with Node.js dependencies:
- `libsodium-wrappers` (crypto)
- `wrtc` (WebRTC P2P)
- `zstd-codec` (compression)
- Native Node.js modules

**Electron wins decisively here:**
- Direct import, no rewriting
- Full Node.js runtime included
- Native modules work out of the box

**Swift would require:**
- Rewriting entire SDK in Swift, OR
- Embedding Node.js runtime (complex), OR
- IPC to separate Node process (architecture change)

**Tauri would require:**
- Sidecar process for Node.js SDK
- Additional IPC complexity
- Managing separate process lifecycle

### Secondary Factor: Time to Market

**Electron:** 2-3 weeks for MVP
- Team already knows JavaScript/TypeScript
- Electron APIs are well-documented
- Can reuse Molt SDK immediately

**Tauri:** 3-5 weeks for MVP
- Learning Rust basics
- Setting up sidecar architecture
- Additional testing complexity

**Swift:** 4-6 weeks for MVP
- Learning Swift/SwiftUI
- Rewriting or bridging Molt SDK
- Testing Apple-specific code paths

### Bundle Size Concern

**Reality Check:**
- 150-170 MB is acceptable for developer tools
- Slack: ~200 MB
- VS Code: ~300 MB
- Discord: ~250 MB

**Target users (developers) likely have:**
- Fast internet connections
- Modern hardware with plenty of storage
- Other Electron apps already installed

**Mitigation for v2:**
- If bundle size is a top complaint, evaluate Tauri migration
- Consider code splitting and lazy loading
- Remove unnecessary dependencies

---

## Decision

**Use Electron for MVP.**

### Implementation Plan

#### Phase 1: Foundation (Week 1)
- [ ] Initialize Electron project with TypeScript
- [ ] Set up build pipeline (electron-builder)
- [ ] Create menu bar icon with status
- [ ] Implement basic window management

#### Phase 2: Core Features (Week 2)
- [ ] Integrate Molt SDK
- [ ] Implement notifications
- [ ] Build quick send window
- [ ] Create contact list view

#### Phase 3: Polish & Distribution (Week 3)
- [ ] Settings persistence
- [ ] Dark mode support
- [ ] Code signing setup
- [ ] Notarization pipeline
- [ ] DMG creation
- [ ] Sparkle auto-update integration

#### Phase 4: Testing & Release (Week 4)
- [ ] Integration testing
- [ ] User acceptance testing
- [ ] Bug fixes
- [ ] Release v1.0

---

## Consequences

### Positive
- Fastest time to market
- Team can work in familiar stack
- Molt SDK works without modification
- Cross-platform path available
- Mature ecosystem and tooling

### Negative
- Large bundle size
- Higher memory usage than native
- Not as "native" feeling as Swift
- Battery impact on laptops

### Neutral
- Future Tauri migration possible but not planned
- Will need Apple Developer account regardless of stack

---

## Alternatives Considered

### Why Not Swift?
- Primary blocker: Cannot use Molt SDK
- Would require complete rewrite or complex bridging
- Team lacks Swift experience
- No cross-platform future

### Why Not Tauri Now?
- SDK integration complexity
- Rust learning curve
- Sidecar adds distribution complexity
- Accept Electron for MVP, evaluate Tauri for v2

### Hybrid Approach (Swift UI + Node Backend)?
- Possible but adds complexity
- Two runtimes to manage
- IPC overhead for all SDK calls
- Not worth the added complexity

---

## Future Considerations

### v2 Evaluation Criteria
If after MVP release we see:
1. Bundle size is top user complaint → Evaluate Tauri migration
2. Memory usage is problematic → Optimize Electron or consider Tauri
3. Users demand more native feel → Consider Swift for UI layer

### Cross-Platform Path
Electron enables:
- Windows app with minimal changes
- Linux app with minimal changes
- Shared codebase across platforms

---

## References

- [Full Research Findings](./mac-app-research.md)
- [Molt Connect Architecture](~/clawd/molt-connect/ARCHITECTURE.md)
- [Molt Connect Features](~/clawd/molt-connect/desktop/FEATURES.md)
- [Tauri Documentation](https://tauri.app/)
- [Electron Documentation](https://www.electronjs.org/docs/latest/)
- [Sparkle Auto-Update](https://sparkle-project.org/)

---

## Approval

| Role | Name | Status | Date |
|------|------|--------|------|
| Researcher | Subagent | Recommended | 2026-03-27 |
| Product Owner | TBD | Pending | - |
| Tech Lead | TBD | Pending | - |

---

*This decision is binding once approved by stakeholders.*
