# Molt Connect Desktop — Team Structure

**Version:** 1.0
**Created:** 2025-03-27
**Team Size:** 5-7 agents (parallel execution)

---

## Team Overview

We're building a Mac desktop app in 4 weeks using parallel agent workstreams. Each agent owns a vertical slice of functionality.

```
┌─────────────────────────────────────────────────────────┐
│                    TEAM LEAD                             │
│              (Coordination + Architecture)               │
└───────────────────────┬─────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
   │ DESIGN  │    │  BUILD  │    │ RESEARCH│
   │  AGENT  │    │  AGENT  │    │  AGENT  │
   └─────────┘    └─────────┘    └─────────┘
        │               │               │
   UI/UX Design    Electron App    Market + UX
   Assets          SDK Integration  Competitor Analysis
```

---

## Roles

### 1. Team Lead (You)
**Responsibilities:**
- Overall coordination and decision-making
- Architecture decisions (Electron vs alternatives)
- Code review and merge authority
- Timeline management
- Blocking issue resolution

**Time Commitment:** Full-time for 4 weeks

**Deliverables:**
- ROADMAP.md ✅
- TEAM.md ✅
- FEATURES.md
- TIMELINE.md
- Architecture decisions log
- Final app review and sign-off

---

### 2. Design Agent
**Responsibilities:**
- UI/UX design for all app screens
- Menu bar icon design (multiple states)
- Notification styling
- Onboarding flow design
- Dark/light mode assets
- Marketing screenshots for App Store

**Time Commitment:** Week 1 (full-time), Weeks 2-4 (review/iterate)

**Deliverables:**
- Wireframes (Day 1-2)
- High-fidelity mockups (Day 3-4)
- Design system (colors, typography, spacing)
- Icon assets (SVG + PNG @1x, @2x, @3x)
- Figma file for collaboration

**Skills Needed:**
- Figma/Sketch proficiency
- macOS HIG familiarity
- Icon design experience

---

### 3. Build Agent
**Responsibilities:**
- Electron app implementation
- SDK integration (reuse molt-connect SDK)
- Menu bar app architecture
- Notification system
- Auto-update mechanism
- Code signing setup

**Time Commitment:** Full-time for 4 weeks

**Deliverables:**
- Electron project structure
- Menu bar + window implementation
- Notification integration (macOS)
- Settings/preferences UI
- DMG packaging
- Auto-update system
- CI/CD pipeline

**Skills Needed:**
- Electron.js
- TypeScript
- macOS native APIs (via Electron)
- electron-builder for packaging

---

### 4. Research Agent
**Responsibilities:**
- Competitor analysis (Telegram Desktop, Signal, Slack)
- User research (interviews, surveys)
- UX best practices research
- Electron performance profiling
- Security review of SDK integration

**Time Commitment:** Week 1-2 (full-time), Week 3-4 (support)

**Deliverables:**
- Competitor analysis report
- User personas
- UX recommendations document
- Security audit report
- Performance benchmark results

**Skills Needed:**
- UX research methods
- Competitive analysis
- Security review

---

### 5. QA Agent (Weeks 3-4)
**Responsibilities:**
- Manual testing on multiple Mac configurations
- Automated test writing (Playwright/Spectron)
- Bug triage and reporting
- Regression testing after each build
- Performance testing (memory, CPU, battery)

**Time Commitment:** Weeks 3-4 (full-time)

**Deliverables:**
- Test plan
- Automated test suite
- Bug reports (GitHub issues)
- Regression test results
- Performance report

---

## Parallel Workstreams

### Week 1: Research + Design (Parallel)

```
Day 1-2                Day 3-4                Day 5
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  RESEARCH   │       │   DESIGN    │       │   SYNC      │
│   AGENT     │       │   AGENT     │       │   POINT     │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ Competitor  │       │ Wireframes  │       │ Design      │
│ analysis    │──────▶│ + Mockups   │──────▶│ Review      │
│             │       │             │       │             │
│ User        │       │ Icon        │       │ Handoff     │
│ research    │       │ concepts    │       │ to Build    │
└─────────────┘       └─────────────┘       └─────────────┘
```

**Research Agent Output:**
- Competitor feature matrix
- UX patterns that work
- User pain points with CLI

**Design Agent Output:**
- Complete UI mockups
- Menu bar icons (all states)
- Design system

---

### Week 2: MVP Build (Parallel + Handoff)

```
┌─────────────────────────────────────────────────────┐
│                    BUILD AGENT                       │
├─────────────────────────────────────────────────────┤
│  Day 1-2           Day 3-4           Day 5          │
│  Electron          Menu Bar          SDK            │
│  Setup             + Windows         Integration    │
│  ────────          ─────────         ────────       │
│  Project           Main UI           Connect        │
│  structure         Tray icon         to relay       │
│                    Notifications     Send/receive   │
└─────────────────────────────────────────────────────┘

┌─────────────┐       ┌─────────────┐
│   DESIGN    │       │  RESEARCH   │
│   AGENT     │       │   AGENT     │
├─────────────┤       ├─────────────┤
│ Support     │       │ Security    │
│ Design      │       │ review      │
│ tweaks      │       │ Performance │
│             │       │ benchmarks  │
└─────────────┘       └─────────────┘
```

**Build Agent Focus:**
- Day 1-2: Electron project setup, build system
- Day 3-4: Menu bar icon, main window, notifications
- Day 5: SDK integration, message send/receive

---

### Week 3: Polish + Testing (Parallel)

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│    BUILD    │  │     QA      │  │   DESIGN    │
│   AGENT     │  │   AGENT     │  │   AGENT     │
├─────────────┤  ├─────────────┤  ├─────────────┤
│ Settings    │  │ Test plan   │  │ Polish      │
│ UI          │  │ Writing     │  │ designs     │
│             │  │ tests       │  │             │
│ Auto-update │  │ Bug         │  │ Marketing   │
│ system      │  │ hunting     │  │ assets      │
│             │  │             │  │             │
│ Bug fixes   │  │ Reporting   │  │ Screenshots │
└─────────────┘  └─────────────┘  └─────────────┘
```

**All agents working in parallel:**
- Build: Feature completion, bug fixes
- QA: Testing, bug reporting
- Design: Polish, marketing assets

---

### Week 4: Distribution + Launch (Parallel)

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│    BUILD    │  │     QA      │  │   TEAM      │
│   AGENT     │  │   AGENT     │  │   LEAD      │
├─────────────┤  ├─────────────┤  ├─────────────┤
│ DMG         │  │ Final       │  │ Release     │
│ packaging   │  │ testing     │  │ planning    │
│             │  │             │  │             │
│ Code        │  │ Regression  │  │ Docs        │
│ signing     │  │ tests       │  │ writing     │
│             │  │             │  │             │
│ Auto-update │  │ Sign-off    │  │ Launch      │
│ server      │  │             │  │ execution   │
└─────────────┘  └─────────────┘  └─────────────┘
```

---

## Dependencies

### Dependency Graph

```
Week 1
├── Design Agent ──────┐
│                      │
└── Research Agent     │
                       ▼
Week 2            Build Agent (needs designs)
                       │
                       ▼
Week 3            QA Agent (needs build)
                       │
                       ▼
Week 4            Launch (needs sign-off)
```

### Critical Dependencies

| From | To | What | When |
|------|-----|------|------|
| Design Agent | Build Agent | UI mockups, icons | End of Week 1 |
| Research Agent | Build Agent | Security review, UX patterns | Mid Week 1 |
| Build Agent | QA Agent | Testable build | Start of Week 3 |
| QA Agent | Team Lead | Sign-off | End of Week 4 |

### Blocking Risks

| Risk | Mitigation |
|------|------------|
| Design delays | Use placeholder UI, iterate |
| Build blocked on SDK | Test SDK integration early |
| QA finds critical bugs | Reserve Week 4 for fixes |
| Code signing issues | Test signing in Week 3 |

---

## Communication

### Daily Sync (Optional)
- 15-minute standup
- What I did, what I'm doing, blockers
- Async via chat is fine

### Weekly Review
- Demo completed work
- Adjust timeline if needed
- Decision log updates

### Handoff Protocol
- Design → Build: Figma link + assets folder
- Build → QA: DMG download link
- QA → Lead: Test report + sign-off

---

## Decision Log

| Date | Decision | Rationale | Owner |
|------|----------|-----------|-------|
| 2025-03-27 | Electron over Swift | SDK reuse, team skills, cross-platform | Team Lead |
| 2025-03-27 | Direct distribution (DMG) | Faster iteration, no App Store overhead | Team Lead |
| 2025-03-27 | 4-week timeline | Aggressive but achievable for MVP | Team Lead |

---

## Success Criteria

**MVP Ready When:**
- [ ] Menu bar icon shows status (connected/disconnected)
- [ ] Notifications appear for incoming messages
- [ ] Can send message from compose window
- [ ] Can view contact list
- [ ] App auto-updates
- [ ] Signed and notarized
- [ ] DMG downloads and installs cleanly

**Team Working When:**
- [ ] Daily commits to main branch
- [ ] No blockers >1 day
- [ ] All agents productive in parallel
- [ ] Weekly demos show progress

---

*Update this document as team structure evolves.*
