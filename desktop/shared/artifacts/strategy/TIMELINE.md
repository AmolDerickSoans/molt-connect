# Molt Connect Desktop - Timeline

## Overview

12-week roadmap broken down into weekly sprints. Each week has specific deliverables and success criteria.

---

## Timeline Summary

| Phase | Weeks | Theme | Key Deliverable |
|-------|-------|-------|-----------------|
| **Phase 1: MVP** | 1-4 | Make it work | Native Mac app with core messaging |
| **Phase 2: Premium** | 5-8 | Make it delightful | Polished app with search, themes, rich media |
| **Phase 3: Platform** | 9-12 | Make it scale | Windows app, teams, enterprise features |

---

## Phase 1: MVP (Weeks 1-4)

### Week 1: Foundation
**Dates:** 2026-03-30 to 2026-04-05  
**Theme:** Project setup and identity

**Deliverables:**
- [ ] Xcode project created with SwiftUI
- [ ] App icon and branding (from Designer)
- [ ] Identity generation (F1.1) implemented
- [ ] Basic app structure (sidebar + main view)
- [ ] Keychain integration for secure storage

**Dependencies:**
- Designer: App icon, color palette
- Researcher: SwiftUI best practices, architecture recommendation

**Success Criteria:**
- App launches without crash
- User sees their @address on launch
- Address persists across app restarts

**Risk Mitigation:**
- If SwiftUI proves limiting, have AppKit fallback plan
- Daily check-ins if blockers emerge

---

### Week 2: Messaging Core
**Dates:** 2026-04-06 to 2026-04-12  
**Theme:** Send and receive messages

**Deliverables:**
- [ ] WebSocket connection to relay
- [ ] Send message UI (F1.2)
- [ ] Receive message handling (F1.3)
- [ ] Basic conversation storage (SQLite)
- [ ] Message list UI (F1.6 basic)

**Dependencies:**
- Relay server operational
- A2A Protocol integration from existing SDK

**Success Criteria:**
- User can send message to @address
- User receives message from another agent
- Messages persist after app restart

**Risk Mitigation:**
- Test with CLI Molt Connect as message partner
- Mock relay for local testing if relay unavailable

---

### Week 3: Permissions & Contacts
**Dates:** 2026-04-13 to 2026-04-19  
**Theme:** Security and contact management

**Deliverables:**
- [ ] Connection prompt modal (F1.4)
- [ ] Accept/Deny/Trust/Block logic
- [ ] Contact list UI (F1.5)
- [ ] Add/edit/delete contacts
- [ ] Import from CLI moltbook

**Dependencies:**
- Permission flow spec from Researcher
- UI designs from Designer

**Success Criteria:**
- User sees connection request with sender info
- User can accept/deny/trust/block
- Contact list persists and updates

**Risk Mitigation:**
- Match existing CLI permission behavior exactly
- Test edge cases (timeout, rapid requests)

---

### Week 4: Polish & Ship MVP
**Dates:** 2026-04-20 to 2026-04-26  
**Theme:** Quality and release

**Deliverables:**
- [ ] Full conversation view (F1.6 complete)
- [ ] System notifications
- [ ] Dock badge for unread count
- [ ] Bug fixes and polish
- [ ] TestFlight/App Store submission prep
- [ ] Documentation and help text

**Dependencies:**
- All P0 features complete
- Designer: Final UI review

**Success Criteria:**
- All P0 features working
- < 2% crash rate
- Ready for TestFlight beta

**Risk Mitigation:**
- Buffer 2 days for unexpected issues
- Have known issues list ready

---

## Phase 2: Premium (Weeks 5-8)

### Week 5: Search & Themes
**Dates:** 2026-04-27 to 2026-05-03  
**Theme:** Core premium features

**Deliverables:**
- [ ] Message search (F2.2)
- [ ] Dark/light theme toggle (F2.5)
- [ ] Settings screen foundation
- [ ] Search indexing optimization

**Dependencies:**
- Phase 1 complete and stable

**Success Criteria:**
- User can search messages by text
- Theme matches system preference
- Settings persist

---

### Week 6: Rich Media
**Dates:** 2026-05-04 to 2026-05-10  
**Theme:** Beyond text

**Deliverables:**
- [ ] Image attachment support (F2.4)
- [ ] File attachment support
- [ ] Image preview in conversation
- [ ] File download handling

**Dependencies:**
- File storage strategy from Researcher

**Success Criteria:**
- User can send/receive images
- Images display in conversation
- Files downloadable

---

### Week 7: Power User Features
**Dates:** 2026-05-11 to 2026-05-17  
**Theme:** Efficiency

**Deliverables:**
- [ ] Keyboard shortcuts (F2.6)
- [ ] Menu bar icon (F2.7)
- [ ] Quick message compose
- [ ] Notification customization (F2.8)

**Dependencies:**
- Designer: Icon set for menu bar

**Success Criteria:**
- All shortcuts documented and working
- Menu bar shows connection status
- Notifications configurable

---

### Week 8: Polish & Release Premium
**Dates:** 2026-05-18 to 2026-05-24  
**Theme:** Quality and launch

**Deliverables:**
- [ ] Read receipts (F2.3)
- [ ] Conversation threads (F2.1) - if time
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] App Store release (v1.0)
- [ ] Marketing materials

**Dependencies:**
- All P1 features complete
- Designer: App Store screenshots

**Success Criteria:**
- NPS > 8
- App Store rating > 4.5
- < 1% crash rate

---

## Phase 3: Platform (Weeks 9-12)

### Week 9: Windows Foundation
**Dates:** 2026-05-25 to 2026-05-31  
**Theme:** Cross-platform

**Deliverables:**
- [ ] Evaluate Flutter vs React Native vs .NET MAUI
- [ ] Windows project setup
- [ ] Core UI components ported
- [ ] Identity and messaging on Windows

**Dependencies:**
- Researcher: Platform evaluation
- Phase 2 stable

**Success Criteria:**
- Windows app launches
- Basic messaging works

---

### Week 10: Windows Feature Parity
**Dates:** 2026-06-01 to 2026-06-07  
**Theme:** Windows completion

**Deliverables:**
- [ ] All MVP features on Windows
- [ ] Windows installer
- [ ] Auto-update mechanism
- [ ] Windows-specific polish

**Dependencies:**
- Designer: Windows UI adjustments

**Success Criteria:**
- Feature parity with Mac MVP
- Windows users can participate in beta

---

### Week 11: Team Features
**Dates:** 2026-06-08 to 2026-06-14  
**Theme:** Collaboration

**Deliverables:**
- [ ] Team workspace concept (F3.3)
- [ ] Workspace creation/join
- [ ] Shared contact list
- [ ] Basic admin controls

**Dependencies:**
- Backend support for workspaces
- User research on team needs

**Success Criteria:**
- Team can create workspace
- Members can join and message

---

### Week 12: Enterprise & Scale
**Dates:** 2026-06-15 to 2026-06-21  
**Theme:** Enterprise readiness

**Deliverables:**
- [ ] Admin dashboard foundation (F3.4)
- [ ] Audit logs
- [ ] Self-hosted relay docs (F3.6)
- [ ] Enterprise pilot preparation
- [ ] v2.0 planning

**Dependencies:**
- Enterprise pilot customer identified
- Legal review of terms

**Success Criteria:**
- 1000+ monthly active users
- Enterprise pilot signed
- Clear v2.0 roadmap

---

## Milestones

| Milestone | Week | Deliverable | Stakeholder |
|-----------|------|-------------|-------------|
| **M1: Alpha** | Week 2 | Internal testing | Engineering |
| **M2: MVP Beta** | Week 4 | TestFlight release | Early adopters |
| **M3: MVP Launch** | Week 5 | App Store v1.0 | Public |
| **M4: Premium Beta** | Week 7 | Premium features | Beta users |
| **M5: Premium Launch** | Week 8 | App Store v1.5 | Public |
| **M6: Windows Beta** | Week 10 | Windows release | Windows users |
| **M7: Teams Beta** | Week 11 | Team features | Teams |
| **M8: Platform Launch** | Week 12 | v2.0 | Public + Enterprise |

---

## Dependencies

### Critical Path
```
Designer: Icons/Branding → Week 1 Foundation
Researcher: Architecture → Week 1 Foundation
Relay Server: Operational → Week 2 Messaging
MVP Complete → Phase 2 Start
Phase 2 Complete → Phase 3 Start
```

### External Dependencies
| Dependency | Owner | Risk | Fallback |
|------------|-------|------|----------|
| App Store approval | Apple | Medium | Prepare for resubmission |
| Relay server uptime | DevOps | Low | Fallback to direct P2P |
| Designer availability | Designer | Low | Use placeholder, iterate |
| Windows expertise | Engineer | Medium | Hire contractor |

---

## Risk Mitigation Plan

### Risk 1: MVP Slippage
**Likelihood:** Medium  
**Impact:** High  
**Mitigation:**
- Buffer 1 week in Phase 1
- Cut P1 features if needed
- Ship MVP with bugs, fix in updates

### Risk 2: App Store Rejection
**Likelihood:** Medium  
**Impact:** Medium  
**Mitigation:**
- Follow HIG guidelines strictly
- Privacy policy ready
- Test on TestFlight first

### Risk 3: Performance Issues
**Likelihood:** Low  
**Impact:** High  
**Mitigation:**
- Performance testing each sprint
- Profile memory and CPU
- Optimize before each release

### Risk 4: Adoption Below Expectations
**Likelihood:** Medium  
**Impact:** High  
**Mitigation:**
- User interviews in Week 2
- Iterate based on feedback
- Focus on power users first

---

## Decision Log

| Date | Decision | Rationale | Made By |
|------|----------|-----------|---------|
| 2026-03-27 | 12-week timeline | Aggressive but achievable | Lead |
| 2026-03-27 | 1-week buffer in Phase 1 | Account for unknowns | Lead |
| 2026-03-27 | Windows in Phase 3 | Focus on Mac first, validate demand | Lead |

---

## Document History

| Date | Author | Changes |
|------|--------|---------|
| 2026-03-27 | Team Lead (TASK-003) | Initial creation |

---

*This is a living document. Update weekly during sprint planning.*
