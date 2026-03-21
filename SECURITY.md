# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x (latest) | ✅ |
| < 1.0 | ❌ |

## Reporting a Vulnerability

**Please do NOT open a public GitHub issue for security vulnerabilities.**

Email: security@pharmaconnect.com

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if known)

You will receive a response within 48 hours. We aim to release a patch within 7 days of a confirmed critical vulnerability.

## Security Measures in PharmaConnect

- All secrets stored in environment variables — never committed to source
- JWT tokens rotated on each session
- RBAC enforced at middleware layer — every route protected
- All MongoDB queries scoped to `tenantId` — no cross-tenant data access is possible by design
- PHI encrypted at rest with AES-256
- Prescriptions and sensitive documents stored in private Cloudinary folders
- Rate limiting on all API routes (Redis-backed)
- Full audit log for every data mutation
- CSRF protection on all POST/PATCH/DELETE routes
- Security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options set on every response
- 2FA (TOTP) enforced for pharmacist and admin roles

## Responsible Disclosure

We follow responsible disclosure. Public disclosure is acceptable 90 days after initial report, or after a fix is released — whichever comes first.
