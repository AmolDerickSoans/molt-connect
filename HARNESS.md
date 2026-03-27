# Molt Connect Execution Harness

## Purpose

Automated execution framework ensuring product completion without manual intervention.

---

## Cron Jobs

### 1. Status Check (Every 30 minutes)
```json
{
  "name": "molt-connect-status",
  "schedule": { "kind": "every", "everyMs": 1800000 },
  "payload": {
    "kind": "agentTurn",
    "message": "Check ~/clawd/molt-connect/STATUS.md. Report progress, blockers, next actions. If stuck, propose solutions. Keep building.",
    "thinking": "medium"
  },
  "sessionTarget": "session:molt-connect-builder"
}
```

### 2. Compaction (Every 4 hours)
```json
{
  "name": "molt-connect-compact",
  "schedule": { "kind": "every", "everyMs": 14400000 },
  "payload": {
    "kind": "agentTurn",
    "message": "Run context compaction: 1) Read all research files, 2) Update RESEARCH.md with key findings, 3) Archive completed tasks from STATUS.md, 4) Update memory/",
    "thinking": "low"
  },
  "sessionTarget": "session:molt-connect-builder"
}
```

### 3. Test Runner (Every 2 hours during build phase)
```json
{
  "name": "molt-connect-tests",
  "schedule": { "kind": "every", "everyMs": 7200000 },
  "payload": {
    "kind": "agentTurn",
    "message": "If tests exist in ~/clawd/molt-connect/tests/, run them. Report failures. Fix if possible.",
    "thinking": "medium"
  },
  "sessionTarget": "session:molt-connect-builder"
}
```

### 4. Dependency Check (Daily)
```json
{
  "name": "molt-connect-deps",
  "schedule": { "kind": "cron", "expr": "0 9 * * *" },
  "payload": {
    "kind": "agentTurn",
    "message": "Check for outdated dependencies in ~/clawd/molt-connect/package.json. Update if safe. Test after update.",
    "thinking": "low"
  },
  "sessionTarget": "session:molt-connect-builder"
}
```

---

## Session Binding

Create persistent session for continuous building:

```
session:molt-connect-builder
```

This session will:
- Receive all cron notifications
- Continue building across multiple turns
- Maintain context via memory files
- Not require user intervention

---

## Quality Gates

### Before Phase Transition:
1. All design docs complete?
2. All tests passing?
3. STATUS.md updated?
4. No blockers?

### Before Ship:
1. SUCCESS_CRITERIA.md all checked?
2. Two agents communicating?
3. Documentation complete?
4. ClawHub listing ready?

---

## Failure Recovery

If build fails:
1. Cron job reports failure
2. Session attempts fix
3. If unfixable, escalates to user
4. User provides guidance
5. Continue building

---

## Memory Management

### Daily Log Format
```
~/clawd/molt-connect/memory/YYYY-MM-DD.md

## Progress
- [x] Task 1
- [ ] Task 2

## Blockers
- Description of blocker

## Decisions
- Decision made and rationale

## Next
- What to do next
```

### Context Compaction Rules
- Keep: decisions, key code, working tests
- Archive: research details, failed attempts
- Summarize: long conversations

---

## Auto-Healing

### If tests fail:
1. Read error
2. Fix code
3. Re-run tests
4. Repeat until pass

### If build fails:
1. Read error
2. Check dependencies
3. Fix configuration
4. Retry

### If design blocked:
1. Consult "Elders" (spawn specialist agent)
2. Research alternatives
3. Make decision
4. Document in DECISIONS.md
5. Continue

---

## Completion Criteria

**Don't stop until:**
1. ✅ Two agents can discover each other
2. ✅ Two agents can exchange messages
3. ✅ E2E encryption working
4. ✅ Permission flow working
5. ✅ Tests passing
6. ✅ Installable from ClawHub
7. ✅ Documentation complete

---

*This harness ensures completion. No manual intervention needed.*
