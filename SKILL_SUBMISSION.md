# Molt Connect - ClawHub Submission Guide

This document provides step-by-step instructions for publishing Molt Connect to ClawHub (skill.sh).

## Prerequisites

1. **ClawHub CLI** - Install if not already:
   ```bash
   npm install -g clawhub
   ```

2. **GitHub Account** - Required for ClawHub authentication

3. **Skill Package Ready** - Ensure all files are in place:
   - `SKILL.md` (required)
   - `skill.json` (metadata)
   - `package.json` (Node.js deps)
   - `src/` (source files)

## Pre-Submission Checklist

- [x] SKILL.md has valid YAML frontmatter with `name` and `description`
- [x] skill.json contains accurate metadata
- [x] All text files use allowed extensions (.md, .ts, .js, .json)
- [x] Total bundle size < 50MB
- [x] No symlinks in skill folder
- [x] License is MIT-0 (ClawHub default)

## Submission Steps

### Step 1: Authenticate with ClawHub

```bash
clawhub login
```

This opens GitHub OAuth. Authorize ClawHub to proceed.

Verify authentication:
```bash
clawhub whoami
```

### Step 2: Validate the Skill

Check skill structure:
```bash
cd ~/clawd/molt-connect
clawhub publish . --dry-run
```

This validates:
- YAML frontmatter format
- Required fields present
- File extensions allowed
- Bundle size within limits

### Step 3: Publish to ClawHub

```bash
clawhub publish . \
  --slug molt-connect \
  --name "Molt Connect" \
  --version 2.0.0 \
  --tags latest \
  --changelog "Initial ClawHub release. P2P agent communication with three-word addresses."
```

**Alternative: Using sync**

If you have multiple skills:
```bash
clawhub sync --all
```

### Step 4: Verify Publication

```bash
# Search for your skill
clawhub search molt-connect

# View skill details
clawhub inspect molt-connect

# Install to test
clawhub install molt-connect --workdir /tmp/test-molt
```

### Step 5: Test Installation

```bash
cd /tmp/test-molt
npx clawhub install molt-connect

# Test commands
molt-whoami
```

## Updating the Skill

For future versions:

```bash
# Make changes, then republish
clawhub publish . \
  --slug molt-connect \
  --version 2.1.0 \
  --tags latest \
  --changelog "Description of changes"
```

## ClawHub Metadata Fields

Your `skill.json` includes:

| Field | Value | Description |
|-------|-------|-------------|
| name | molt-connect | Skill identifier |
| version | 2.0.0 | Semver version |
| description | P2P agent communication... | Searchable summary |
| keywords | openclaw, agent, p2p... | Discovery tags |
| openclaw.commands | moltmessage, molt-whoami... | CLI commands |
| openclaw.events | connection-request... | Emitted events |
| openclaw.emoji | 🦞 | Display emoji |

## Troubleshooting

### "Slug already exists"

The slug `molt-connect` may be taken. Options:
1. Use a different slug: `--slug your-molt-connect`
2. If you own it, use update flow instead

### "Validation failed"

Check the error message. Common issues:
- Missing required frontmatter fields
- File extension not in allowlist
- Bundle too large (>50MB)

### "Authentication required"

Run `clawhub login` again to refresh your session.

## Useful Commands

```bash
# List your published skills
clawhub list

# View skill page
open https://clawhub.ai/skills/molt-connect

# Check install counts
clawhub inspect molt-connect

# Delete skill (soft delete)
clawhub delete molt-connect
```

## Files Submitted

```
molt-connect/
├── SKILL.md              # Main skill documentation
├── skill.json            # ClawHub metadata
├── package.json          # Node.js package info
├── src/
│   ├── skill.ts          # OpenClaw skill entry point
│   ├── molt.ts           # Main integration
│   ├── molt-a2a.ts       # A2A SDK wrapper
│   ├── permissions.ts    # Permission manager
│   ├── registry.ts       # Peer address book
│   ├── relay.ts          # Discovery relay
│   ├── cli-v2.ts         # CLI interface
│   └── index.ts          # Module exports
└── README.md             # Project README
```

## Next Steps After Publishing

1. **Test installation** from a fresh environment
2. **Share the skill** - Link: https://clawhub.ai/skills/molt-connect
3. **Gather feedback** from users
4. **Iterate** based on usage patterns
5. **Document** common workflows in SKILL.md

## Support

- ClawHub Discord: https://discord.gg/clawd
- ClawHub GitHub: https://github.com/openclaw/clawhub
- OpenClaw Docs: https://openclaw.ai/docs

---

*Generated: 2026-03-27*
