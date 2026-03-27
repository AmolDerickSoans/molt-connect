# NPM Publishing Guide for @molt-connect/sdk

## Package Overview

- **Package Name:** `@molt-connect/sdk`
- **Version:** 2.0.0
- **Description:** P2P agent communication SDK using A2A Protocol with human-friendly three-word addresses
- **License:** MIT

## Prerequisites

1. **Node.js 18+** required
2. **npm account** with access to the `@molt-connect` organization (or create it)

## Step 1: Create npm Account & Organization

If you don't have an npm account:

```bash
npm adduser
# or visit https://www.npmjs.com/signup
```

Create the `@molt-connect` organization (if not exists):

```bash
npm org create molt-connect
```

## Step 2: Configure .npmrc

For scoped packages, you have two options:

### Option A: Publish as public scoped package (recommended)

Create or edit `~/.npmrc`:

```ini
# ~/.npmrc
@molt-connect:registry=https://registry.npmjs.org/
```

### Option B: Use npm login

```bash
npm login --scope=@molt-connect
```

## Step 3: Verify Package Contents

Before publishing, verify what will be included:

```bash
cd ~/clawd/molt-connect
npm pack --dry-run
```

This should show all files in `dist/` plus README.md and LICENSE.

## Step 4: Publish

### First-time publish:

```bash
npm publish --access public
```

The `--access public` flag is required for scoped packages on first publish.

### Subsequent publishes:

```bash
npm publish
```

## Step 5: Verify Publication

After publishing, verify the package is live:

```bash
npm view @molt-connect/sdk
```

Or visit: https://www.npmjs.com/package/@molt-connect/sdk

## Version Updates

When releasing a new version:

```bash
# Patch version (2.0.0 → 2.0.1)
npm version patch

# Minor version (2.0.0 → 2.1.0)
npm version minor

# Major version (2.0.0 → 3.0.0)
npm version major

# Then publish
npm publish
```

## Exports

The package exports multiple entry points:

```javascript
// Main SDK
import { MoltConnect, toThreeWord } from '@molt-connect/sdk';

// Core integration
import { MoltConnect } from '@molt-connect/sdk/molt';

// A2A wrapper
import { createMoltConnectServer, sendMoltMessage } from '@molt-connect/sdk/molt-a2a';

// Peer registry
import { PeerRegistry } from '@molt-connect/sdk/registry';

// Permissions
import { PermissionManager } from '@molt-connect/sdk/permissions';

// Relay discovery
import { RelayClient } from '@molt-connect/sdk/relay';
```

## Automated Publishing (GitHub Actions)

To automate publishing on tag push, create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Add `NPM_TOKEN` as a repository secret from your npm access tokens.

## Troubleshooting

### "You do not have permission to publish"

- Ensure you're logged in: `npm whoami`
- Ensure you have access to the `@molt-connect` org
- Try `npm login --scope=@molt-connect`

### "Package already exists"

- Increment version in `package.json`
- Use `npm version` command

### Files not included

- Check `files` field in package.json
- Run `npm pack --dry-run` to verify

## Repository Setup

Update the repository URLs in `package.json` to match your actual GitHub repo:

```json
{
  "repository": {
    "type": "git",
    "url": "git+https://github.com/YOUR_ORG/molt-connect.git"
  },
  "bugs": {
    "url": "https://github.com/YOUR_ORG/molt-connect/issues"
  },
  "homepage": "https://github.com/YOUR_ORG/molt-connect#readme"
}
```

## Quick Commands Summary

```bash
# Login
npm login --scope=@molt-connect

# Build
npm run build

# Test pack
npm pack --dry-run

# Publish (first time)
npm publish --access public

# Publish (updates)
npm publish

# Verify
npm view @molt-connect/sdk
```
