#!/bin/bash
# Molt Connect v2 - Full Test with A2A SDK

cd ~/clawd/molt-connect

echo "🧪 Molt Connect v2 - A2A Protocol Integration"
echo "=============================================="
echo ""

# Clean up
rm -rf /tmp/molt-test-a /tmp/molt-test-b

echo "Step 1: Start Agent A"
echo "---------------------"
MOLT_CONFIG_DIR=/tmp/molt-test-a timeout 5 npx tsx src/cli-v2.ts whoami || true
ADDR_A=$(cat /tmp/molt-test-a/identity.json 2>/dev/null | grep '"address"' | cut -d'"' -f4)
echo "Agent A: @$ADDR_A"
echo ""

echo "Step 2: Start Agent B"
echo "---------------------"
MOLT_CONFIG_DIR=/tmp/molt-test-b timeout 5 npx tsx src/cli-v2.ts whoami || true
ADDR_B=$(cat /tmp/molt-test-b/identity.json 2>/dev/null | grep '"address"' | cut -d'"' -f4)
echo "Agent B: @$ADDR_B"
echo ""

echo "Step 3: Test A2A SDK directly"
echo "-----------------------------"
npx tsx src/test-a2a.ts
