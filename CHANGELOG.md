# Changelog

All notable changes to PharmaConnect are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.0] — 2025-01-01

### Added
- **Multi-tenant architecture** — wholesaler, retailer, consumer, and super-admin portals
- **3D Interactive Body Map** — Three.js raycasting with 15 body regions; click to select and get AI recommendations
- **AI Drug Scanner** — Camera capture + Cloudinary OCR + Claude vision analysis
- **AI Pharmacist Chat** — Floating chat widget with patient-profile context
- **AI Demand Forecasting** — Platform-wide symptom trends → restocking recommendations
- **Full POS System** — Barcode search, cart, payment methods, cash-change calculation, receipt printing
- **Inventory Management** — Batch/lot tracking, expiry alerts, auto-reorder levels
- **Prescription Lifecycle** — Issue → verify → dispense → refill tracking
- **Real-time Order Tracking** — Status machine with history; consumer notifications
- **Delivery Tracking** — GPS route, cold-chain temperature logging, proof of delivery
- **Analytics Dashboards** — Revenue charts, top drugs, order pipelines (per-tenant + super-admin)
- **Accounting Module** — P&L overview, transaction ledger, invoice generation
- **Staff Management** — Role-based access, invite workflow, permission matrix
- **Email Notifications** (Resend) — 8 email templates with branded HTML
- **SMS Notifications** (Twilio) — 10 SMS templates for orders, delivery, alerts, OTP
- **BullMQ Background Jobs** — Scheduled daily inventory/expiry checks with notifications
- **PWA Support** — Manifest, service worker, offline cache, background sync, push notifications
- **Offline Queue** — IndexedDB-backed pending action queue; auto-replays on reconnect
- **Auth.js v5** — JWT sessions, Google OAuth, RBAC (8 roles), TOTP 2FA
- **Security hardening** — Rate limiting, audit logs, CSRF, security headers, multi-tenant isolation
- **Drug Database** — Admin CRUD with Cloudinary image upload, category tagging, Rx/OTC flags
- **Consumer Onboarding** — 5-step health profile wizard (blood type, allergies, conditions, emergency contact)
- **Cart & Checkout** — Zustand-persisted cart, 3-step checkout with delivery method selection

### Technical
- Next.js 15 App Router with React Server Components
- MongoDB Atlas with 11 Mongoose schemas
- TypeScript throughout with strict mode
- Tailwind CSS with Syne + DM Sans + DM Mono font stack
- Recharts for data visualization
- TanStack Query for server state management
- Zustand for client state (cart, offline store)
