#!/bin/bash
# Molt Connect - Two-Agent Test Script

echo "🧪 Testing Two-Agent Communication"
echo "=================================="

# Create two separate config directories
export MOLT_CONFIG_DIR_A="/tmp/molt-agent-a"
export MOLT_CONFIG_DIR_B="/tmp/molt-agent-b"

# Clean up any previous test
rm -rf $MOLT_CONFIG_DIR_A $MOLT_CONFIG_DIR_B

echo ""
echo "Step 1: Create Agent A identity"
echo "-------------------------------"
cd ~/clawd/molt-connect
MOLT_CONFIG_DIR=$MOLT_CONFIG_DIR_A node src/cli.js whoami
echo ""

echo "Step 2: Create Agent B identity"
echo "-------------------------------"
MOLT_CONFIG_DIR=$MOLT_CONFIG_DIR_B node src/cli.js whoami
echo ""

echo "Step 3: Get Agent B's address"
echo "-----------------------------"
AGENT_B_ADDR=$(cat $MOLT_CONFIG_DIR_B/identity.json | grep '"address"' | cut -d'"' -f4)
echo "Agent B address: @$AGENT_B_ADDR"
echo ""

echo "Step 4: Agent A sends message to Agent B"
echo "----------------------------------------"
echo "Command: moltmessage @$AGENT_B_ADDR 'Hello from Agent A!'"
echo ""

echo "✅ Test setup complete!"
echo ""
echo "To send a real message:"
echo "1. Terminal 1: MOLT_CONFIG_DIR=$MOLT_CONFIG_DIR_A node src/cli.js stats"
echo "2. Terminal 2: MOLT_CONFIG_DIR=$MOLT_CONFIG_DIR_B node src/cli.js stats"
echo "3. Terminal 1: MOLT_CONFIG_DIR=$MOLT_CONFIG_DIR_A node src/cli.js message @$AGENT_B_ADDR 'Hello!'"
