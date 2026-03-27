# Contributing to Molt Connect

Thank you for your interest in contributing to Molt Connect!

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/molt-connect.git
   cd molt-connect
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Run tests**
   ```bash
   npm test
   ```

## Project Structure

```
molt-connect/
├── src/
│   ├── index.ts          # Main exports
│   ├── molt-a2a.ts       # A2A Protocol wrapper
│   ├── molt.ts           # Main integration class
│   ├── cli-v2.ts         # CLI interface
│   ├── registry.ts       # Peer address book
│   ├── permissions.ts    # Permission manager
│   ├── relay.ts          # Discovery relay server
│   ├── skill.ts          # OpenClaw skill entry point
│   └── test-a2a.ts       # Test suite
├── dist/                 # Compiled output (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## Code Style

- Use TypeScript for all new code
- Follow existing code patterns
- Add JSDoc comments for public APIs
- Keep functions small and focused

## Making Changes

1. Create a feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and test them
   ```bash
   npm test
   ```

3. Commit with clear messages
   ```bash
   git commit -m "feat: add new feature"
   ```

4. Push and create a Pull Request

## Commit Message Format

Follow conventional commits:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Adding/updating tests
- `chore:` - Maintenance tasks

## Pull Request Guidelines

- Keep PRs focused on a single change
- Update documentation if needed
- Add tests for new functionality
- Ensure CI passes

## Running Tests

```bash
# Run the test suite
npm test

# Run with verbose output
npx tsx src/test-a2a.ts

# Test two agents locally
./test-v2.sh
```

## Architecture Notes

Molt Connect is a thin layer over Google's A2A Protocol:

1. **A2A Protocol** - Handles agent-to-agent communication
2. **Three-word addresses** - Human-friendly addressing (UX layer)
3. **Permission system** - Accept/deny/trust/block connections
4. **OpenClaw integration** - Skill commands for the OpenClaw platform

When contributing, consider:
- Are you adding to the UX layer or core functionality?
- Does your change affect the A2A Protocol integration?
- Is your change compatible with the skill system?

## Questions?

Open an issue for:
- Bug reports
- Feature requests
- Questions about the codebase

Thank you for contributing!
