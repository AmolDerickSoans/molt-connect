# Molt Connect - Publishing Guide

## Current Status: ✅ READY FOR PUBLISHING

The molt-connect skill is fully prepared and ready to be published to ClawHub.

## What's Been Prepared

### ✅ Package Files
- **SKILL.md** - Comprehensive skill documentation with proper YAML frontmatter
- **skill.json** - ClawHub metadata (name, version, commands, events)
- **package.json** - Node.js package configuration
- **README.md** - Enhanced with badges and installation instructions
- **LICENSE** - MIT license
- **dist/** - Pre-built TypeScript compilation

### ✅ Validation
- All JSON files are valid
- SKILL.md has required YAML frontmatter
- Package size: 44MB (under 50MB limit)
- 77 source files ready for publishing

## Authentication Required

To publish to ClawHub, you need to authenticate first:

### Option 1: Browser-Based Authentication (Recommended)

```bash
cd ~/clawd/molt-connect
clawhub login
```

This will open your browser for GitHub OAuth authentication. Once you authorize ClawHub, return to the terminal.

### Option 2: Token-Based Authentication

If you have a ClawHub API token:

```bash
clawhub login --token YOUR_TOKEN_HERE
```

## Publishing Commands

Once authenticated, publish the skill using:

### Quick Publish

```bash
cd ~/clawd/molt-connect
clawhub publish . \
  --slug molt-connect \
  --name "Molt Connect" \
  --version 2.0.0 \
  --tags latest \
  --changelog "Initial ClawHub release. P2P agent communication with three-word addresses using A2A Protocol."
```

### Verify Publication

After publishing, verify:

```bash
# Check skill is live
clawhub inspect molt-connect

# Search for your skill
clawhub search molt-connect

# Test installation
clawhub install molt-connect --workdir /tmp/test-molt
```

## Skill Details

**Name:** molt-connect  
**Version:** 2.0.0  
**Description:** P2P agent communication using A2A Protocol with three-word addresses  
**Commands:**
- `moltmessage @address "message"` - Send message to another agent
- `molt-whoami` - Show your agent address
- `molt-connections` - List active connections
- `moltbook` - Manage contacts

**Events:**
- `connection-request` - Another agent wants to connect
- `message-received` - Message from connected agent
- `connection-closed` - Agent disconnected

## Post-Publication

### URL
Once published, your skill will be available at:
- **ClawHub:** https://clawhub.ai/skills/molt-connect
- **npm (if also publishing SDK):** https://www.npmjs.com/package/@molt-connect/sdk

### Share
Share your skill:
```bash
# Install command for users
npx clawhub@latest install molt-connect
```

### Updates
For future versions:
```bash
# Make changes, then republish
clawhub publish . \
  --slug molt-connect \
  --version 2.1.0 \
  --tags latest \
  --changelog "Description of changes"
```

## Alternative: Publish to npm as SDK

If you also want to publish the SDK to npm (separate from ClawHub skill):

```bash
# Login to npm
npm login

# Publish the SDK package
cd ~/clawd/molt-connect
npm publish --access public
```

Note: The SDK package name is `@molt-connect/sdk` (different from the skill name `molt-connect`).

## Need Help?

- **ClawHub Docs:** https://clawhub.ai/docs
- **OpenClaw Discord:** https://discord.gg/clawd
- **GitHub Issues:** https://github.com/openclaw/molt-connect/issues

---

**Generated:** 2026-03-27  
**Status:** Ready for user authentication and publishing
