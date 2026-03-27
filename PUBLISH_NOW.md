# PUBLISH NOW

Run these commands to publish everything:

## 1. npm Publish (SDK)

```bash
cd ~/clawd/molt-connect
npm adduser
# Enter your npm username, password, email
npm publish --access public
```

## 2. ClawHub Publish (Skill)

```bash
clawhub login
clawhub publish molt-connect
```

## 3. Done!

After publishing:
- SDK will be at: https://www.npmjs.com/package/@molt-connect/sdk
- Skill will be on ClawHub for others to install
- Users can: `npm install @molt-connect/sdk`

---

## What's Already Live

| Item | URL |
|------|-----|
| **Website** | https://landing-premium-cyan.vercel.app |
| **DMG Download** | https://github.com/AmolDerickSoans/molt-connect/releases/tag/v1.0.0 |
| **GitHub Repo** | https://github.com/AmolDerickSoans/molt-connect |

## What Needs You

| Task | Command |
|------|---------|
| npm publish | `npm adduser && npm publish --access public` |
| ClawHub publish | `clawhub login && clawhub publish molt-connect` |
