# Molt Connect - Deployment Guide

This guide explains how to upload Molt Connect to GitHub as a private repository.

## Prerequisites

- Git installed (`git --version`)
- GitHub account
- SSH key configured for GitHub (recommended) or Personal Access Token

## Step 1: Initialize Git Repository

Run the setup script:

```bash
cd ~/clawd/molt-connect
chmod +x setup-git.sh
./setup-git.sh
```

Or manually:

```bash
cd ~/clawd/molt-connect
git init
git add .
git commit -m "chore: initial commit"
```

## Step 2: Create Private Repository on GitHub

1. Go to https://github.com/new
2. Enter repository name: `molt-connect`
3. Set visibility: **Private**
4. **Do not** initialize with README, .gitignore, or license (we already have these)
5. Click "Create repository"

## Step 3: Connect and Push

Replace `YOUR_USERNAME` with your GitHub username:

```bash
# Add remote
git remote add origin git@github.com:YOUR_USERNAME/molt-connect.git

# Or using HTTPS:
# git remote add origin https://github.com/YOUR_USERNAME/molt-connect.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Files to Commit

The following files will be included (45 files total):

### Source Code (9 TypeScript files, ~1114 lines)
```
src/index.ts          - Main exports
src/molt-a2a.ts       - A2A Protocol wrapper
src/molt.ts           - Main integration class
src/cli-v2.ts         - CLI interface
src/registry.ts       - Peer address book
src/permissions.ts    - Permission manager
src/relay.ts          - Discovery relay server
src/skill.ts          - OpenClaw skill entry point
src/test-a2a.ts       - Test suite
```

### Configuration (4 files)
```
package.json          - Project manifest
package-lock.json     - Dependency lock file
tsconfig.json         - TypeScript config
skill.json            - OpenClaw skill metadata
```

### Documentation (14 files)
```
README.md             - Quick start guide
ARCHITECTURE.md       - System architecture
PROTOCOL.md           - Protocol documentation
SPEC.md               - Full specification
SCHEMAS.md            - Data schemas
SKILL_API.md          - OpenClaw skill API
SKILL.md              - Skill documentation
STATUS.md             - Current status
ROADMAP.md            - Development roadmap
CONTRIBUTING.md       - Contribution guide
DEPLOY.md             - This deployment guide
DECISIONS.md          - Design decisions
RESEARCH.md           - Research notes
MANIFESTO.md          - Project manifesto
```

### Research (6 files)
```
research/a2a-analysis.md      - A2A protocol analysis
research/addressing.md        - Addressing schemes
research/crypto.md            - Cryptography notes
research/existing-solutions.md - Existing solutions review
research/nat-traversal.md     - NAT traversal research
research/protocols.md         - Protocol comparisons
```

### CI/CD & Infrastructure (1 file)
```
.github/workflows/test.yml  - GitHub Actions CI
```

### Scripts (4 files)
```
setup-git.sh          - Git initialization script
test-v2.sh            - Test script
test-two-agents.sh    - Multi-agent test
test-full.sh          - Full test suite
```

### Root Files (7 files)
```
.gitignore            - Git ignore rules
LICENSE               - MIT license
SUCCESS_CRITERIA.md   - Success criteria
HARNESS.md            - Test harness docs
META_PROMPT.md        - Meta prompts
NPM_PUBLISH.md        - NPM publishing guide
SKILL_SUBMISSION.md   - Skill submission docs
```

## Files NOT Committed (in .gitignore)

```
node_modules/         - Dependencies (install with npm install)
dist/                 - Build output (generate with npm run build)
.env                  - Environment secrets
*.log                 - Log files
.molt-connect/        - Local data
*.pem, *.key          - Private keys
```

## Post-Upload Steps

1. **Enable GitHub Actions**
   - Go to Settings > Actions > General
   - Enable "Allow all actions and reusable workflows"

2. **Add Repository Secrets (if needed)**
   - Go to Settings > Secrets and variables > Actions
   - Add any required secrets

3. **Invite Collaborators**
   - Go to Settings > Collaborators
   - Add team members with appropriate permissions

4. **Set Branch Protection (optional)**
   - Go to Settings > Branches
   - Add rule for `main` branch
   - Enable "Require status checks to pass before merging"

## CI Pipeline

The GitHub Actions workflow will:

1. Run on every push to `main`/`master`
2. Run on every pull request
3. Test on Node.js 18, 20, and 22
4. Build the project
5. Run tests
6. Type-check the code

## Local Development

After cloning:

```bash
git clone git@github.com:YOUR_USERNAME/molt-connect.git
cd molt-connect
npm install
npm run build
npm test
```

## Security Notes

- The repository is **private** - only invited collaborators can access
- No secrets or API keys are committed (in .gitignore)
- Private keys (*.pem, *.key) are excluded from version control
- Local data (.molt-connect/) is not committed

## Troubleshooting

### Push rejected (non-fast-forward)
```bash
git pull origin main --rebase
git push origin main
```

### Large files
If you have large files, consider Git LFS:
```bash
git lfs install
git lfs track "*.large"
git add .gitattributes
```

### Reset everything
```bash
rm -rf .git
./setup-git.sh
```

## Support

For issues with deployment:
1. Check GitHub's documentation
2. Ensure SSH key is configured: `ssh -T git@github.com`
3. Verify repository permissions

---

*Last updated: March 2025*
