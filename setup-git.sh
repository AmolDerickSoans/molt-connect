#!/bin/bash

# Molt Connect - Git Repository Setup Script
# Run this script to initialize the git repository

set -e

echo "╔════════════════════════════════════════╗"
echo "║   Molt Connect - Git Setup Script      ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install git first."
    exit 1
fi

# Check if already a git repository
if [ -d ".git" ]; then
    echo "⚠️  Git repository already exists."
    read -p "Reinitialize? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi
    rm -rf .git
fi

# Initialize git repository
echo "📦 Initializing git repository..."
git init

# Configure git for private repo (no need for upstream if not pushing yet)
echo "📝 Setting up git configuration..."
git config user.name "Molt Connect" 2>/dev/null || true

# Add all files
echo "➕ Staging files..."
git add .

# Show what will be committed
echo ""
echo "📋 Files to be committed:"
git status --short
echo ""

# Count files
FILE_COUNT=$(git diff --cached --numstat | wc -l | tr -d ' ')
echo "Total files: $FILE_COUNT"
echo ""

# Confirm commit
read -p "Create initial commit? (Y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
    echo "Aborted. Files are staged but not committed."
    echo "Run 'git commit -m \"Initial commit\"' when ready."
    exit 0
fi

# Create initial commit
git commit -m "chore: initial commit

Molt Connect v2 - P2P Agent Communication using A2A Protocol

Features:
- Three-word addresses (@bond-desert-male)
- A2A Protocol integration
- Permission system (accept/deny/trust/block)
- OpenClaw skill integration
- Discovery relay server"

echo ""
echo "✅ Git repository initialized!"
echo ""
echo "Next steps:"
echo "  1. Create a private repository on GitHub"
echo "  2. Add remote: git remote add origin git@github.com:USERNAME/molt-connect.git"
echo "  3. Push: git push -u origin main"
echo ""
echo "For detailed instructions, see DEPLOY.md"
