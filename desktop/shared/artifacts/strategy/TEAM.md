# Molt Connect Desktop - Team Structure

## Team Composition

### Current Team

| Role | Name | Focus | Status |
|------|------|-------|--------|
| **Lead/Orchestrator** | (Subagent) | Strategy, coordination, documentation | Active (TASK-003) |
| **Designer** | (Subagent) | Website, UI/UX, brand | Active (TASK-001) |
| **Researcher** | (Subagent) | Mac app technical research | Active (TASK-002) |
| **Engineer** | TBD | Swift/SwiftUI development | Pending |

### Future Team Needs

| Role | When Needed | Why |
|------|-------------|-----|
| Backend Engineer | Phase 2 | Relay optimization, sync features |
| QA Engineer | Phase 2 | Regression testing, automation |
| DevOps | Phase 3 | CI/CD, app store deployment |
| Product Manager | Phase 3 | User research, roadmap |

---

## Roles & Responsibilities

### Lead (Orchestrator)
**Owns:** Product strategy, team coordination, documentation

**Responsibilities:**
- Create and maintain ROADMAP.md, FEATURES.md, TIMELINE.md
- Track task dependencies and blockers
- Facilitate handoffs between team members
- Make strategic decisions when team disagrees
- Report status to stakeholders

**Not Responsible For:**
- Writing code
- Design execution
- Technical research

---

### Designer
**Owns:** Visual design, UX, brand identity

**Responsibilities:**
- Design landing page (TASK-001)
- Create app mockups and prototypes
- Define design system (colors, typography, components)
- Review implemented UI for design fidelity
- Create marketing assets

**Deliverables:**
- Website (index.html)
- Figma/Sketch mockups
- Design system documentation
- Icon and logo files

---

### Researcher
**Owns:** Technical feasibility, architecture decisions

**Responsibilities:**
- Research Mac app frameworks (SwiftUI vs AppKit)
- Evaluate third-party libraries
- Document technical constraints and opportunities
- Create proof-of-concept for risky components
- Answer "can we do X?" questions

**Deliverables:**
- Technical research documents
- Architecture recommendations
- POC code snippets
- Library comparison matrix

---

### Engineer
**Owns:** Implementation, code quality, performance

**Responsibilities:**
- Implement features per SPEC.md
- Write unit and integration tests
- Maintain code documentation
- Handle app store submission
- Fix bugs and performance issues

**Deliverables:**
- Working Mac app (.app)
- Test suite
- Technical documentation
- Release notes

---

## Communication Protocols

### Async-First
Most communication is async via documents and comments. No required real-time meetings.

### Document Standards
- All decisions written to files
- Use markdown format
- Include "Decision:" sections for choices
- Tag reviewers with @mention in comments

### Handoff Protocol
When completing a task:

```markdown
## Task Completed: [TASK-ID]

### What Was Done
- [List of completed items]

### Artifacts
- [File paths]

### Decisions Made
- [Key decisions and rationale]

### Blockers/Questions
- [Any blockers or questions for next person]

### Next Steps
- [What the next person should do]
```

### Escalation Path
1. Document the issue in the relevant file
2. If unresolved in 24 hours, escalate to Lead
3. Lead makes decision and documents it
4. Team executes decision

---

## Meeting Cadence

### Weekly Sync (Optional)
**When:** Friday 4 PM IST (or async equivalent)
**Duration:** 30 minutes
**Format:**
1. What I completed this week
2. What I'm working on next week
3. Blockers I need help with

**Async Alternative:** Post updates in `memory/weekly/YYYY-WW.md`

### Sprint Planning (Every 2 Weeks)
**When:** Start of sprint
**Duration:** 1 hour
**Format:**
1. Review previous sprint metrics
2. Prioritize next sprint tasks
3. Assign owners
4. Identify dependencies

### Retrospective (Monthly)
**When:** Last Friday of month
**Duration:** 45 minutes
**Format:**
1. What went well
2. What didn't go well
3. What to try next month

---

## Tools & Platforms

| Purpose | Tool | Notes |
|---------|------|-------|
| Code | GitHub | github.com/openclaw/molt-connect |
| Documentation | Markdown files | In `desktop/shared/artifacts/` |
| Design | Figma (TBD) | Designer's choice |
| Async Comms | GitHub Issues | Or Discord (TBD) |
| Task Tracking | SPEC files | `specs/TASK-*.md` |

---

## Decision Framework

### Who Decides What?

| Decision Type | Decider | Input From |
|--------------|---------|------------|
| Product direction | Lead | Team + users |
| Technical architecture | Engineer | Researcher |
| Design direction | Designer | Lead |
| Timeline changes | Lead | Team |
| Feature priorities | Lead | Team + users |
| Code approach | Engineer | Researcher |

### Disagreement Resolution
1. Each party documents their position
2. Lead reviews both positions
3. Lead makes final decision
4. Decision documented with rationale
5. Team commits to the decision

---

## Onboarding Checklist

New team members should:
- [ ] Read ROADMAP.md, FEATURES.md, TIMELINE.md
- [ ] Read existing Molt Connect SKILL.md
- [ ] Review current SPEC.md
- [ ] Set up local development environment
- [ ] Join communication channel (TBD)
- [ ] Say hi in weekly sync

---

## Current Status (2026-03-27)

| Task ID | Owner | Status | Notes |
|---------|-------|--------|-------|
| TASK-001 | Designer | In Progress | Premium website redesign |
| TASK-002 | Researcher | Pending | Mac app research |
| TASK-003 | Lead | This Document | Strategy documents |

---

## Document History

| Date | Author | Changes |
|------|--------|---------|
| 2026-03-27 | Team Lead (TASK-003) | Initial creation |

---

*This is a living document. Update as team evolves.*
