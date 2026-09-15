# Facebook Response Bot V2

> Modern, robust, modular Facebook Messenger Bot built on official Meta Webhooks & Graph API v21.0 with Node.js 20+ LTS and TypeScript.

---

## 🌟 Key Highlights of V2

- **100% Official Meta Messenger Platform**: Fully compliant with Meta Developer Policies. No cookie jars (`appstate.json`), no reverse-engineered MQTT endpoints, zero reliance on deprecated unofficial FCA packages (`fca-horizon-remake`).
- **Transport-Agnostic Core**: Core bot engine operates on normalized `MessageContext`. Commands never talk directly to Graph API, enabling multi-platform support (Discord, Telegram, Webhook).
- **Multi-layer Rate Limiting**: Inbound token bucket (`TokenBucketRateLimiter`) drops flood attacks before hitting SQLite dedup locks. Outbound queue enforces platform compliance.
- **Persistent Restart-Safe Dialogs**: Multi-step interactive commands (quizzes, games, registration) use `SessionManager` with SQLite-backed TTL, surviving restarts without state loss.
- **Atomic Data Stores**: Plugin data persistence uses temp-file atomic writes (`writePluginData`) plus SQLite `plugin_kv` fallback to prevent zero-byte corruptions on abrupt crashes.
- **Enterprise-Grade Security**:
  - Webhook payload HMAC-SHA256 signature verification (`x-hub-signature-256`) via `crypto.timingSafeEqual`.
  - Zero arbitrary code execution (`eval` and shell invocations eliminated).
  - Pino structured logging with automated redaction of tokens and secrets.
- **High-Performance In-Memory Cache**: High-volume media pools (4000+ links) use mtime-checked memory buffers avoiding repetitive synchronous disk reads.
- **Production Observability & CI**: Endpoints for container health (`GET /health`), readiness (`GET /ready`), metrics (`GET /status`), commands (`GET /commands`), and plugins (`GET /plugins`). Automated CI via GitHub Actions.

---

## 🏗️ Architecture

```text
                  ┌──────────────────────────────────────────────┐
                  │              Meta Messenger Webhook          │
                  └──────────────────────┬───────────────────────┘
                                         │ HTTPS POST (HMAC-SHA256)
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │          src/platform/facebook/              │
                  │  ├── Webhook Route & Signature Verification  │
                  │  ├── Inbound TokenBucketRateLimiter (Flood)  │
                  │  ├── Event Normalizer (To MessageContext)    │
                  │  └── Outgoing Rate-Limited Sender & Queue    │
                  └──────────────────────┬───────────────────────┘
                                         │ Normalized MessageContext
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │                   src/core/                  │
                  │  ├── BotCore Engine                          │
                  │  ├── CommandRouter (Prefix, Aliases, RBAC)   │
                  │  ├── SessionManager (SQLite TTL Store)       │
                  │  ├── PermissionManager (Role-Based Access)   │
                  │  └── CooldownManager (Per-Command Limit)     │
                  └──────────────┬───────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│   src/plugins/   │   │  src/services/   │   │src/repositories/ │
│ ├── core/        │   │ ├── ai/          │   │ ├── user.ts      │
│ ├── admin/       │   │ ├── weather/     │   │ ├── thread.ts    │
│ ├── group/       │   │ └── translation/ │   │ ├── session.ts   │
│ ├── utility/     │   │                  │   │ └── audit.ts     │
│ ├── economy/     │   └──────────────────┘   └─────────┬────────┘
│ ├── games/       │                                    │
│ ├── media/       │                                    ▼
│ ├── ai/          │                          ┌──────────────────┐
│ └── knowledge/   │                          │  SQLite Database │
└──────────────────┘                          │    (WAL Mode)    │
                                              └──────────────────┘
```

---

## 🎮 Available Plugins & Features

| Plugin | Commands & Features | Description |
| :--- | :--- | :--- |
| **`core`** | `help`, `ping`, `info`, `uptime` | System health, command discovery, bot telemetry |
| **`admin`** | `setprefix`, `maintenance`, `broadcast` | Bot administration, role management, runtime controls |
| **`group`** | `kick`, `ban`, `warn`, `settings` | Group administration and thread configuration |
| **`utility`** | `weather`, `translate`, `qr`, `math` | Helper utilities with timeout and sanitization |
| **`economy`** | `balance`, `daily`, `transfer`, `work` | Virtual coin economy backed by SQLite transactions |
| **`games`** | `altp`, `baicao`, `baucua`, `dhbc`, `rank` | Minigames with `SessionManager` state, cards, and canvas cards |
| **`media`** | `girl`, `anime`, `cosplay`, `meme` | High-throughput cached media retrieval with mtime tracking |
| **`ai`** | `chat`, `ask`, `imagine` | LLM text completions and image generation pipelines |
| **`knowledge`** | `wiki`, `fact`, `quote` | Educational lookup and trivia engines |

---

## 🚀 Quick Start

### 1. Requirements
- Node.js 20+ LTS or Docker
- Verified Facebook Page and Meta Developer App

### 2. Installation
```bash
# Clone repository
git clone https://github.com/lphuxhuq/facebook-response-bot.git
cd facebook-response-bot

# Install dependencies
npm install
```

### 3. Configuration
```bash
cp .env.example .env
```
Edit `.env` with Meta credentials:
```env
PORT=3000
FACEBOOK_PAGE_ID=your_page_id
FACEBOOK_APP_SECRET=your_meta_app_secret
FACEBOOK_VERIFY_TOKEN=your_custom_verify_token
FACEBOOK_PAGE_ACCESS_TOKEN=your_page_access_token
```

### 4. Running Locally
```bash
# Development mode with hot-reload
npm run dev

# Type check codebase
npm run typecheck

# Run full Vitest suite (35 suites, 185 tests)
npm test

# Build production bundle
npm run build

# Start production server
npm start
```

---

## 🐳 Docker Deployment

```bash
docker compose up -d --build
```
See [README_DEPLOYMENT.md](README_DEPLOYMENT.md) for full deployment instructions.

---

## 📚 Documentation Index

- [Target Architecture Spec](docs/ARCHITECTURE.md)
- [Legacy Codebase Audit](docs/LEGACY_AUDIT.md)
- [Feature Inventory & Migration Catalog](docs/FEATURE_INVENTORY.md)
- [Migration Matrix](docs/MIGRATION_MATRIX.md)
- [Final Architectural & Security Audit](docs/FINAL_AUDIT.md)
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
- [Architecture Decision Records (ADRs)](docs/ADR/)

---

## 📜 License
GPL-3.0 License

