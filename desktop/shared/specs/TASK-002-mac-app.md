# TASK-002: Mac App Architecture Research

## Priority: HIGH

## Objective
Research and document the best approach for a native Mac app with menu bar and Dynamic Island integration.

## Research Questions

### 1. Menu Bar App
- How to create macOS menu bar apps with SwiftUI?
- Background execution requirements?
- Notification integration?
- Best practices for quick actions?

### 2. Dynamic Island
- Is Dynamic Island available on macOS?
- If yes: How to integrate?
- If no: What are alternatives for always-visible status?

### 3. Distribution
- DMG creation process
- Code signing requirements
- Notarization steps
- Auto-update mechanisms (Sparkle?)

### 4. Tech Stack Options
Evaluate these options:

**Option A: Native Swift (SwiftUI)**
- Pros/Cons
- Learning curve
- Integration with Molt SDK (TypeScript)

**Option B: Electron**
- Pros/Cons
- Bundle size
- Native features

**Option C: Tauri**
- Pros/Cons
- Bundle size
- Rust requirements

## Artifacts Output
Write to: `~/clawd/molt-connect/desktop/shared/artifacts/research/`

Files:
- `mac-app-research.md` — Complete research findings
- `architecture-decision.md` — Recommended approach with reasoning

## Verification
- All research questions answered
- Sources cited
- Clear recommendation provided

## Deadline
Complete within 1 hour.
