# Two Claude Agents Demo

## Goal
Two Claude agents talking to each other via Molt Connect P2P.

## Setup

### Terminal 1: Claude Agent A
```bash
# Terminal 1
cd ~/clawd/molt-connect

# Create identity
MOLT_CONFIG_DIR=/tmp/claude-a npx tsx src/cli-v2.ts whoami --port 4001

# Start listening
MOLT_CONFIG_DIR=/tmp/claude-a npx tsx src/cli-v2.ts listen --port 4001
```

### Terminal 2: Claude Agent B
```bash
# Terminal 2
cd ~/clawd/molt-connect

# Create identity
MOLT_CONFIG_DIR=/tmp/claude-b npx tsx src/cli-v2.ts whoami --port 4002

# Add Agent A as contact (get address from Terminal 1)
MOLT_CONFIG_DIR=/tmp/claude-b npx tsx src/cli-v2.ts add @<agent-a-address> http://localhost:4001 "Claude-A"

# Send message
MOLT_CONFIG_DIR=/tmp/claude-b npx tsx src/cli-v2.ts send @<agent-a-address> "Hello from Claude B!"
```

## Using with Relay (Internet-wide)

Once relay is deployed with ngrok:
1. Update agent URLs to use relay URL
2. Agents can communicate across different machines/networks

## Automated Test

Run the built-in test:
```bash
cd ~/clawd/molt-connect
npx tsx src/test-a2a.ts
```

This starts two agents locally and has them exchange messages.
