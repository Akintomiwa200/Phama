# 💊 PharmaConnect

> **Full-stack pharmaceutical supply chain platform** connecting wholesalers, retailers, and consumers — powered by AI drug intelligence, 3D body mapping, real-time delivery tracking, and end-to-end pharmacy management.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)](https://mongodb.com)
[![Claude AI](https://img.shields.io/badge/Claude-AI-orange)](https://anthropic.com)
[![License](https://img.shields.io/badge/License-MIT-purple)](LICENSE)

---

## ✨ Features

### 🤖 AI-Powered
- **3D Interactive Body Map** — Three.js raycasting on a procedural human body; click any region to log symptoms and get instant AI drug recommendations
- **AI Drug Scanner** — Camera/upload drug packaging → Cloudinary OCR + Claude vision → drug info, dosage, warnings, interactions
- **AI Pharmacist Chat** — Floating chat widget powered by Claude API; patient-profile-aware drug guidance
- **Demand Forecasting** — Platform-wide symptom trend analysis → predictive restocking recommendations for wholesalers

### 🏗️ Multi-Tenant Architecture
| Portal | Features |
|--------|---------|
| **Wholesaler** | Bulk inventory, retailer orders, accounting, P&L, analytics, AI demand forecast |
| **Retailer / Pharmacy** | POS system, stock management, prescriptions, staff management, analytics |
| **Consumer** | Health dashboard, 3D body map, drug scanner, pharmacy finder, cart, order tracking |
| **Super Admin** | Platform overview, tenant management, drug database, compliance reports |

### 💊 Pharmacy Operations
- Full **Point of Sale** with barcode search, cart, payment methods, cash-change calc, and printed receipts
- **Inventory management** with batch/lot tracking, expiry alerts, auto-reorder levels
- **Prescription lifecycle** — issue → verify → dispense → track refills
- **Delivery tracking** with real-time GPS, cold-chain temperature logging, proof of delivery

### 📧 Notifications
- **Email** (Resend) — Welcome, order confirmation, status updates, low-stock alerts, expiry warnings, prescription verified, OTP/2FA, AI recommendations
- **SMS** (Twilio) — Order status, delivery updates, low-stock, expiry, security alerts, OTP
- **Background jobs** (BullMQ + Redis) — Scheduled daily inventory/expiry checks with automatic notifications

### 🔒 Security
- Auth.js v5 with JWT, Google OAuth, RBAC (8 roles)
- Multi-tenant data isolation via `tenantId` on every collection
- TOTP 2FA, rate limiting, security headers, audit logs
- AES-256 encryption for PHI at rest

### 📱 PWA & Offline
- Full PWA manifest with shortcuts and screenshots
- Service Worker with cache-first/network-first strategies
- IndexedDB offline queue — actions replay automatically when reconnected
- Background Sync API for offline mutations
- Push notifications for orders, deliveries, and stock alerts

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- MongoDB Atlas account
- Redis instance (local or cloud)
- Accounts for: Anthropic, Cloudinary, Resend, Twilio (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourorg/pharmaconnect.git
cd pharmaconnect

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@pharmaconnect.com | Admin@123 |
| Wholesaler | wholesale@pharmaconnect.com | Demo@123 |
| Retailer/Pharmacist | retail@pharmaconnect.com | Demo@123 |
| Consumer | consumer@pharmaconnect.com | Demo@123 |

---

## 🏛️ Architecture

```
pharmaconnect/
├── app/                          # Next.js 15 App Router
│   ├── (auth)/                   # Login, Register, Onboarding
│   ├── wholesaler/               # Wholesaler portal
│   ├── retailer/                 # Retailer/pharmacy portal
│   ├── consumer/                 # Consumer app
│   ├── admin/                    # Super admin panel
│   └── api/                      # API routes
│       ├── drugs/                # Drug catalog CRUD
│       ├── inventory/            # Inventory management
│       ├── orders/               # Order processing
│       ├── prescriptions/        # Prescription lifecycle
│       ├── ai/recommend/         # Claude drug recommendations
│       ├── ai/scanner/           # Drug image scanner
│       ├── ai/chat/              # AI pharmacist chat
│       ├── ai/forecast/          # Demand forecasting
│       ├── analytics/            # Platform analytics
│       ├── tenants/              # Tenant management
│       ├── users/                # User management
│       ├── delivery/             # Delivery tracking
│       ├── symptoms/             # Symptom logs
│       └── upload/               # Cloudinary upload
├── components/
│   ├── three/BodyMap3D.tsx       # Three.js 3D body map
│   ├── charts/                   # Recharts components
│   ├── shared/                   # Reusable UI components
│   └── layout/                   # Sidebar, DashboardLayout
├── lib/
│   ├── auth.ts                   # Auth.js v5 + RBAC
│   ├── db.ts                     # MongoDB connection
│   ├── models.ts                 # Mongoose schemas (11 models)
│   ├── claude.ts                 # Anthropic AI integration
│   ├── cloudinary.ts             # Image upload & OCR
│   ├── email.ts                  # Resend email templates
│   ├── sms.ts                    # Twilio SMS
│   └── queue.ts                  # BullMQ background jobs
├── hooks/
│   ├── useOfflineSync.ts         # IndexedDB offline queue
│   └── useServiceWorker.ts       # PWA service worker
├── types/index.ts                # All TypeScript interfaces
├── utils/index.ts                # Helpers, formatters
└── public/
    ├── sw.js                     # Service worker
    └── manifest.json             # PWA manifest
```

---

## 🧩 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, RSC, Server Actions) |
| Language | TypeScript 5 |
| Database | MongoDB Atlas + Mongoose |
| ORM | Drizzle ORM (schema definitions) |
| Auth | Auth.js v5 (JWT, Google OAuth, 2FA) |
| AI | Anthropic Claude API (Opus) |
| Images | Cloudinary (upload, OCR, optimization) |
| Email | Resend |
| SMS | Twilio |
| Queue | BullMQ + Redis |
| 3D Graphics | Three.js |
| State | Zustand + TanStack Query |
| Charts | Recharts |
| Styling | Tailwind CSS + CSS Variables |
| PWA | Service Worker + IndexedDB |
| Fonts | Syne + DM Sans + DM Mono |

---

## 📋 API Reference

### Authentication
All protected routes require a valid session cookie. API routes return `401` if unauthorized, `403` if forbidden.

### Key Endpoints
| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/drugs` | Drug catalog |
| GET/POST | `/api/inventory` | Inventory management |
| GET/POST | `/api/orders` | Order management |
| GET/POST | `/api/prescriptions` | Prescription lifecycle |
| POST | `/api/ai/recommend` | AI drug recommendations |
| POST | `/api/ai/scanner` | Drug package scanner |
| POST | `/api/ai/chat` | AI pharmacist chat |
| POST | `/api/ai/forecast` | Demand forecasting |
| GET | `/api/analytics` | Platform analytics |
| GET/POST | `/api/tenants` | Tenant management |
| POST | `/api/upload` | File upload |

---

## 🔧 Configuration

### Environment Variables
See `.env.example` for the full list. Key variables:

```env
MONGODB_URI=mongodb+srv://...
AUTH_SECRET=your-32-char-secret
ANTHROPIC_API_KEY=sk-ant-...
CLOUDINARY_API_KEY=...
RESEND_API_KEY=re_...
TWILIO_ACCOUNT_SID=AC...
REDIS_URL=redis://...
```

---

## 🗺️ Roadmap

- [ ] Doctor portal (issue digital prescriptions, patient lookup)
- [ ] WhatsApp notifications via Twilio
- [ ] Stripe subscription billing per tenant
- [ ] Real-time delivery map (Socket.io + Mapbox)
- [ ] Drug-drug interaction checker (dedicated API)
- [ ] Insurance claim integration
- [ ] Multi-language support (i18n)
- [ ] Mobile app (React Native / Expo)

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

## 🤝 Contributing

Pull requests welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

## 🔐 Security

To report a vulnerability, see [SECURITY.md](SECURITY.md).

---

<p align="center">Built with ❤️ — PharmaConnect Team</p>
# Phama
