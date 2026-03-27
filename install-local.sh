#!/bin/bash
# Install Molt Connect skill locally for testing

cd ~/clawd/molt-connect

# Build the package
echo "Building package..."
npm run build

# Pack it
echo "Packing..."
npm pack

# Install globally
echo "Installing globally..."
npm install -g molt-connect-2.0.0.tgz

echo "✅ Installed! Test with: molt-whoami"
