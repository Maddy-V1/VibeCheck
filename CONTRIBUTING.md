# Contributing to VibeCheck

Thank you for your interest in contributing to VibeCheck! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/vibecheck.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes thoroughly
6. Commit with clear messages: `git commit -m "feat: add new feature"`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Open a Pull Request

## Development Setup

See README.md for complete setup instructions.

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Git

### Local Development
```bash
npm install
npm run dev
```

## Code Style

- TypeScript strict mode (no `any` types)
- ESLint + Prettier for formatting
- Run `npm run lint` before committing
- Husky pre-commit hooks will auto-format

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

## Pull Request Guidelines

- Keep PRs focused on a single feature or fix
- Update documentation if needed
- Add tests for new features
- Ensure all tests pass
- Follow the existing code style
- Write clear PR descriptions

## Questions?

Open an issue for questions or discussions.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
