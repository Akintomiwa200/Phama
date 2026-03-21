# Contributing to PharmaConnect

Thank you for considering a contribution! Here's how to get started.

## Development Setup

1. Fork the repo and clone it locally
2. `npm install`
3. Copy `.env.example` → `.env.local` and fill in credentials
4. `npm run dev` — starts at localhost:3000

## Branching

- `main` — production-ready code
- `develop` — integration branch
- `feature/your-feature` — new features
- `fix/issue-description` — bug fixes

## Commit Convention

```
feat: add drug interaction checker
fix: correct POS change calculation
docs: update API reference
chore: upgrade Drizzle ORM
```

## Pull Requests

- Target `develop`, not `main`
- Include a clear description of what and why
- Reference any related issues
- Ensure `npm run lint` passes before submitting

## Code Style

- TypeScript strict mode — no `any` unless unavoidable
- Tailwind utility classes only — no inline styles
- Server Components by default; use `'use client'` only when needed
- All new API routes must have Zod validation

## Reporting Bugs

Open a GitHub Issue with:
- Steps to reproduce
- Expected vs actual behaviour
- Environment (OS, Node version, browser)

## Security

Do not open public issues for security vulnerabilities — see [SECURITY.md](SECURITY.md).
