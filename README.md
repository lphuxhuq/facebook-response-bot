# Facebook Response Bot V2

> Modern, robust, modular Facebook Messenger Bot built on official Meta Webhooks & Graph API v21.0 with Node.js 24 LTS and TypeScript.

---

## 🌟 Key Highlights of V2

- **100% Official Meta Messenger Platform**: Fully compliant with Meta Developer Policies. No cookie jars (`appstate.json`), no reverse-engineered MQTT endpoints, and zero reliance on deprecated unofficial FCA packages (`fca-horizon-remake`).
- **Transport-Agnostic Core**: The core bot engine operates entirely on a normalized `MessageContext`. Commands never talk directly to Facebook Graph API, enabling simple adaptation to Discord, Telegram, or Webchat in the future.
- **Persistent Restart-Safe Dialogs**: Multi-step interactive commands (such as quizzes and registration workflows) utilize `SessionManager` with SQLite-backed TTL, surviving process restarts and server redeployments without losing conversation state.
- **Enterprise-Grade Security**:
  - Webhook payload HMAC-SHA256 signature verification (`x-hub-signature-256`) with `crypto.timingSafeEqual`.
  - Zero arbitrary code execution (`eval` and shell commands completely eliminated).
  - Structured logging via Pino with automated redaction of tokens and secrets.
- **Reliable Storage**: SQLite 3 in WAL mode (`Write-Ahead Logging`) with strongly-typed repositories for users, conversations, sessions, and audit trails.
- **Production Observability**: Built-in endpoints for container health (`GET /health`), database readiness (`GET /ready`), metrics (`GET /status`), commands directory (`GET /commands`), and plugins (`GET /plugins`).

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
                  │  └── CooldownManager (Token Bucket)          │
                  └──────────────┬───────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│   src/plugins/   │   │  src/services/   │   │src/repositories/ │
│ ├── core/        │   │ ├── ai/          │   │ ├── user.ts      │
│ ├── admin/       │   │ ├── weather/     │   │ ├── thread.ts    │
│ ├── utility/     │   │ └── translation/ │   │ ├── session.ts   │
│ └── economy/     │   │                  │   │ └── audit.ts     │
└──────────────────┘   └──────────────────┘   └─────────┬────────┘
                                                        │
                                                        ▼
                                              ┌──────────────────┐
                                              │  SQLite Database │
                                              │    (WAL Mode)    │
                                              └──────────────────┘
```

---

## 🚀 Quick Start

### 1. Requirements
- Node.js 24 LTS or Docker
- A verified Facebook Page and Meta Developer App

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/lphuxhuq/facebook-response-bot.git
cd facebook-response-bot

# Checkout the V2 branch
git checkout remake-and-test

# Install dependencies
npm install
```

### 3. Configuration
```bash
cp .env.example .env
```
Edit `.env` with your Meta credentials:
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

# Run full test suite
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
See [README_DEPLOYMENT.md](file:///d:/Project/BOTMSG/README_DEPLOYMENT.md) for full production deployment instructions.

---

## 📚 Documentation Index

- [Target Architecture Spec](file:///d:/Project/BOTMSG/docs/ARCHITECTURE.md)
- [Legacy Codebase Audit](file:///d:/Project/BOTMSG/docs/LEGACY_AUDIT.md)
- [Feature Inventory & Migration Catalog](file:///d:/Project/BOTMSG/docs/FEATURE_INVENTORY.md)
- [Migration Matrix](file:///d:/Project/BOTMSG/docs/MIGRATION_MATRIX.md)
- [Final Architectural & Security Audit](file:///d:/Project/BOTMSG/docs/FINAL_AUDIT.md)
- [Troubleshooting Guide](file:///d:/Project/BOTMSG/docs/TROUBLESHOOTING.md)
- [Architecture Decision Records (ADRs)](file:///d:/Project/BOTMSG/docs/ADR/)

---

## 📜 License
GPL-3.0 License
