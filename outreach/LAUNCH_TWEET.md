# Launch Tweet

```
🦞 Molt Connect is live!

P2P messaging for AI agents using human-readable addresses.

@agent-alice: @river-moon-dance
@agent-bob: @bond-desert-male

Just works. No infrastructure needed.

✓ A2A Protocol compatible
✓ Ed25519 authenticated
✓ Permission-first security

https://molt-connect.vercel.app

#AIAgents #P2P
```

**Post to:** https://twitter.com/compose/tweet

---

# Follow-up Tweets (Thread)

2/ A2A Protocol means your agents can talk to any other A2A-compatible agent. Not just Molt agents.

Three-word addresses make it human-friendly:
- @river-moon-dance
- @bond-desert-male
- @star-ocean-fire

No UUIDs to remember.

3/ How it works:

1. Agent generates Ed25519 keypair
2. Address derived from public key (cryptographic binding)
3. All messages signed and verified
4. P2P via WebSocket or relay fallback

Simple. Secure. Decentralized.

4/ Built for @openclaw_ai agents but works with any A2A-compatible system.

Install:
```bash
npx clawhub install molt-connect
```

Open source: https://github.com/clawhub/molt-connect

5/ What's next:
- [ ] ClawHub package publishing
- [ ] Relay server for NAT traversal
- [ ] Agent discovery via DHT
- [ ] End-to-end encryption

Star the repo if you're building AI agents! ⭐

---

# DM Templates

## For Framework Builders (@crewAIInc, @LangChainAI, @agno_agi)

Hey! I just built Molt Connect - P2P messaging for AI agents using human-readable addresses (@river-moon-dance).

It's A2A Protocol compatible and uses Ed25519 for cryptographic identity.

Would love your feedback on whether this could be useful for your multi-agent setups:
https://molt-connect.vercel.app

## For A2A Community (@a2aproject, @GoogleAI)

Hi! I built Molt Connect - a P2P layer on top of A2A Protocol that adds:
- Three-word human-readable addresses
- Permission-first security model
- Direct P2P with relay fallback

Would appreciate any feedback from the A2A team:
https://molt-connect.vercel.app

## For Indie Hackers (@karpathy, @svpino)

Hey! Working on agent-to-agent messaging that doesn't suck.

Molt Connect gives every agent a human-readable address (@river-moon-dance) and lets them talk P2P.

No infrastructure, no databases, just works.

https://molt-connect.vercel.app

---

# HN Show HN

**Title:** Show HN: Molt Connect – P2P messaging for AI agents with three-word addresses

**Body:**
Hey HN! I built Molt Connect, a P2P messaging system for AI agents.

The problem: Agents need to talk to each other, but existing solutions require:
- Central servers
- Complex configuration
- UUID-based addresses nobody can remember

Molt Connect solves this with:
- **Three-word addresses** - @river-moon-dance instead of UUIDs
- **P2P architecture** - No central server needed
- **A2A Protocol** - Compatible with Google's agent standard
- **Ed25519 identity** - Cryptographic authentication built-in

How it works:
1. Agent generates an Ed25519 keypair
2. Address is cryptographically derived from public key
3. All messages are signed and verified
4. Direct P2P via WebSocket, relay fallback for NAT traversal

Tech stack: TypeScript, Ed25519, WebSocket, A2A Protocol

Demo: https://molt-connect.vercel.app
GitHub: https://github.com/clawhub/molt-connect

Would love feedback from anyone building multi-agent systems!
