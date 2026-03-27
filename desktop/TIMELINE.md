# Molt Connect Desktop — Timeline

**Version:** 1.0
**Created:** 2025-03-27
**Duration:** 4 Weeks
**Target Ship:** End of Week 4

---

## Overview

This timeline maps the 4-week development sprint from kickoff to DMG distribution. Each week has specific goals, deliverables, and checkpoints.

```
Week 1: Research & Design     Week 2: MVP Development
┌─────────────────────┐       ┌─────────────────────┐
│ Competitor analysis │       │ Electron setup      │
│ UI/UX design        │       │ SDK integration     │
│ Wireframes          │       │ Core features       │
│ Icon design         │       │ Working prototype   │
└─────────────────────┘       └─────────────────────┘

Week 3: Testing & Polish      Week 4: Distribution
┌─────────────────────┐       ┌─────────────────────┐
│ QA testing          │       │ DMG packaging       │
│ Bug fixes           │       │ Code signing        │
│ Performance tuning  │       │ Auto-update server  │
│ P1 features         │       │ Release & launch    │
└─────────────────────┘       └─────────────────────┘
```

---

## Week 1: Research & Design

**Goal:** Understand the problem, design the solution.

### Day 1-2: Research

**Research Agent:**
| Task | Time | Output |
|------|------|--------|
| Competitor analysis | 4h | Matrix of Telegram, Signal, Slack desktop features |
| UX patterns research | 3h | Best practices for menu bar apps |
| User interviews | 2h | Pain points with CLI experience |
| Security review | 2h | Desktop-specific security concerns |

**Deliverables:**
- [ ] Competitor feature matrix
- [ ] UX recommendations doc
- [ ] Security considerations doc

### Day 3-4: Design

**Design Agent:**
| Task | Time | Output |
|------|------|--------|
| Wireframes (all screens) | 4h | Figma wireframes |
| High-fidelity mockups | 4h | Figma designs |
| Icon concepts | 2h | 3-5 icon variations |
| Design system | 2h | Colors, typography, spacing |

**Deliverables:**
- [ ] Wireframes: Menu bar, Quick send, Contacts, Settings
- [ ] High-fidelity mockups
- [ ] Icon candidates (SVG)
- [ ] Design system doc

### Day 5: Handoff

**Design Agent:**
- Finalize designs
- Export assets
- Design review with team

**Build Agent:**
- Review designs
- Estimate implementation effort
- Flag technical constraints

**Research Agent:**
- Compile research findings
- Present to team

**End of Week 1 Checkpoint:**
- [ ] Designs approved and handed off
- [ ] Research findings documented
- [ ] Build agent ready to start

---

## Week 2: MVP Development

**Goal:** Working prototype with core features.

### Day 1: Project Setup

**Build Agent:**
| Task | Time | Output |
|------|------|--------|
| Initialize Electron project | 1h | `npm init`, folder structure |
| Configure TypeScript | 1h | `tsconfig.json`, build pipeline |
| Add molt-connect SDK dependency | 0.5h | `package.json` updated |
| Set up dev environment | 1h | Hot reload, debugging |
| Create menu bar skeleton | 2h | Tray icon, basic window |

**Deliverables:**
- [ ] Electron project structure
- [ ] TypeScript configured
- [ ] Menu bar icon appears on launch

### Day 2: Connection & Status

**Build Agent:**
| Task | Time | Output |
|------|------|--------|
| Implement relay connection | 3h | WebSocket client |
| Add connection status tracking | 2h | State management |
| Create settings window | 2h | Basic settings UI |

**Deliverables:**
- [ ] App connects to relay on launch
- [ ] Menu bar icon shows status
- [ ] Settings window with relay URL

### Day 3: Notifications

**Build Agent:**
| Task | Time | Output |
|------|------|--------|
| Implement message listener | 2h | Receive from SDK |
| Add macOS notifications | 3h | Notification API |
| Handle notification click | 1h | Open app to message |

**Deliverables:**
- [ ] Notifications appear for incoming messages
- [ ] Clicking notification opens app

### Day 4: Quick Send

**Build Agent:**
| Task | Time | Output |
|------|------|--------|
| Create quick send window | 2h | Compose UI |
| Add address autocomplete | 2h | Contact lookup |
| Implement send logic | 2h | SDK message send |

**Deliverables:**
- [ ] Quick send window opens
- [ ] Can send message to address
- [ ] Success/error feedback

### Day 5: Contact List + Integration

**Build Agent:**
| Task | Time | Output |
|------|------|--------|
| Create contact list UI | 3h | List view |
| Load contacts from SDK | 1h | Data loading |
| Wire everything together | 2h | End-to-end flow |

**Deliverables:**
- [ ] Contact list shows all contacts
- [ ] Clicking contact opens send window
- [ ] Full message send/receive flow works

**End of Week 2 Checkpoint:**
- [ ] Can receive message (notification + menu bar badge)
- [ ] Can send message (quick send window)
- [ ] Contact list visible
- [ ] Settings configurable

---

## Week 3: Testing & Polish

**Goal:** Bug-free, performant, polished app.

### Day 1: QA Setup

**QA Agent:**
| Task | Time | Output |
|------|------|--------|
| Create test plan | 2h | Test cases document |
| Set up automated tests | 3h | Playwright/Spectron setup |
| Write smoke tests | 1h | Basic flow tests |

**Deliverables:**
- [ ] Test plan written
- [ ] Automated test framework ready

### Day 2-3: Testing

**QA Agent:**
| Task | Time | Output |
|------|------|--------|
| Manual testing | 8h | Bug reports |
| Automated testing | 4h | Test coverage |
| Performance testing | 2h | Memory, CPU benchmarks |
| Regression testing | 2h | Verify fixes |

**Build Agent:**
| Task | Time | Output |
|------|------|--------|
| Fix reported bugs | 8h | Bug fixes |
| Performance optimizations | 4h | Improved metrics |

**Deliverables:**
- [ ] All P0 bugs fixed
- [ ] Test coverage >70%
- [ ] Performance targets met

### Day 4: P1 Features

**Build Agent:**
| Task | Time | Output |
|------|------|--------|
| Add keyboard shortcuts | 2h | Global shortcuts |
| Implement dark mode | 2h | Dark/light themes |
| Add message history | 2h | Local storage |

**Deliverables:**
- [ ] 2-3 P1 features implemented

### Day 5: Polish

**Build Agent:**
| Task | Time | Output |
|------|------|--------|
| UI polish | 2h | Visual refinements |
| Error handling | 2h | Better error messages |
| Edge case fixes | 2h | Robustness |

**Design Agent:**
| Task | Time | Output |
|------|------|--------|
| Visual QA | 2h | Design review |
| Polish designs | 2h | Minor adjustments |

**End of Week 3 Checkpoint:**
- [ ] All P0 features working
- [ ] No critical bugs
- [ ] 2+ P1 features implemented
- [ ] Performance acceptable

---

## Week 4: Distribution

**Goal:** Ship it.

### Day 1: Packaging

**Build Agent:**
| Task | Time | Output |
|------|------|--------|
| Configure electron-builder | 2h | Build config |
| Create DMG build | 2h | DMG file |
| Test DMG install | 1h | Install verification |
| Create auto-update config | 1h | Update mechanism |

**Deliverables:**
- [ ] DMG builds successfully
- [ ] DMG installs on test Mac

### Day 2: Code Signing

**Build Agent:**
| Task | Time | Output |
|------|------|--------|
| Set up Apple Developer account | 1h | Account ready |
| Create signing certificate | 1h | Certificate installed |
| Sign the app | 1h | Signed app |
| Notarize with Apple | 2h | Notarization complete |

**Note:** Notarization can take 10-60 minutes. Plan accordingly.

**Deliverables:**
- [ ] App signed with Developer ID
- [ ] App notarized by Apple
- [ ] Gatekeeper accepts the app

### Day 3: Auto-Update Server

**Build Agent:**
| Task | Time | Output |
|------|------|--------|
| Set up update server | 2h | Simple HTTP server |
| Configure update endpoint | 1h | Update URL |
| Test auto-update flow | 2h | Update works |
| Deploy to production | 1h | Server live |

**Options for update server:**
- GitHub Releases (free, easy)
- S3 bucket + CloudFront
- Dedicated update service

**Deliverables:**
- [ ] Update server deployed
- [ ] Auto-update tested end-to-end

### Day 4: Final Testing & Docs

**QA Agent:**
| Task | Time | Output |
|------|------|--------|
| Final regression test | 3h | Test results |
| Install test on clean Mac | 1h | Fresh install works |
| Sign-off | 1h | Go/no-go decision |

**Team Lead:**
| Task | Time | Output |
|------|------|--------|
| Write README | 1h | User documentation |
| Create CHANGELOG | 0.5h | Version history |
| Prepare release notes | 0.5h | Release post |

**Deliverables:**
- [ ] Final test pass complete
- [ ] Sign-off from QA
- [ ] Documentation ready

### Day 5: Launch

**Team Lead:**
| Task | Time | Output |
|------|------|--------|
| Create GitHub Release | 0.5h | Release page |
| Upload DMG | 0.5h | Download available |
| Announce to community | 1h | Post on Moltbook, Discord |
| Monitor for issues | 2h | First responder |

**Deliverables:**
- [ ] DMG downloadable from GitHub
- [ ] Community notified
- [ ] Support channels monitored

**End of Week 4 Checkpoint:**
- [ ] App downloadable
- [ ] Installs on clean Mac
- [ ] Auto-update works
- [ ] Community using it

---

## Milestones

| Week | Milestone | Date | Deliverable |
|------|-----------|------|-------------|
| 1 | Design Complete | End of Week 1 | Mockups, icons, research |
| 2 | MVP Working | End of Week 2 | Core features functional |
| 3 | QA Complete | End of Week 3 | All bugs fixed, P1 features |
| 4 | Ship | End of Week 4 | DMG released |

---

## Risk Buffer

**Built-in buffer:**
- Week 3 has Friday for catch-up
- Week 4 has Day 5 flexible for last issues

**If behind schedule:**
1. Cut P1 features (keep MVP scope)
2. Skip auto-update for v1.0 (add in v1.1)
3. Defer notarization (ship unsigned, warn users)

**If ahead of schedule:**
1. Add more P1 features
2. Start on Dynamic Island
3. Begin Windows port planning

---

## Daily Schedule (Example)

```
09:00 - Daily standup (15 min)
09:15 - Deep work block 1 (2.5h)
12:00 - Lunch break
13:00 - Deep work block 2 (2.5h)
15:30 - Review/sync with team
16:00 - Deep work block 3 (1.5h)
17:30 - End of day
```

**Async-friendly:** All updates via chat, standup optional.

---

## Communication Cadence

| Cadence | When | Who | What |
|---------|------|-----|------|
| Daily standup | 9:00 AM | All | Blockers, progress |
| Weekly demo | Friday PM | All | Demo completed work |
| Sprint planning | Monday AM | All | Week's priorities |
| Release review | End of Week 4 | All | Retrospective |

---

## Success Metrics (by Week)

| Week | Metric | Target |
|------|--------|--------|
| 1 | Designs approved | 100% |
| 2 | Core features working | 5/5 P0 |
| 3 | Bugs fixed | All critical |
| 4 | Downloads | 100+ first week |

---

## Launch Checklist

**Technical:**
- [ ] DMG builds
- [ ] App signed
- [ ] App notarized
- [ ] Auto-update works
- [ ] All tests pass

**Documentation:**
- [ ] README.md
- [ ] CHANGELOG.md
- [ ] Release notes
- [ ] Installation instructions

**Marketing:**
- [ ] Announcement post written
- [ ] Screenshots taken
- [ ] Demo video (optional)

**Support:**
- [ ] Issue template created
- [ ] Support channel monitored
- [ ] FAQ written

---

## Post-Launch (Week 5+)

**Immediate (Week 5):**
- Monitor GitHub issues
- Respond to user feedback
- Fix critical bugs (patch releases)

**Short-term (Weeks 6-8):**
- Collect feature requests
- Prioritize P1 features
- Plan v1.1 release

**Long-term (Weeks 9+):**
- Evaluate App Store distribution
- Start Windows port
- Begin iOS planning

---

*This timeline is aggressive but achievable. Update daily as we learn what works.*
