# TARGET ARCHITECTURE SPECIFICATION: facebook-response-bot V2

- **Author**: Principal Software Architect
- **Target Runtime**: Node.js 24 LTS
- **Language**: TypeScript 5.7+
- **Framework**: Fastify 5.x
- **Storage**: SQLite 3 (WAL mode) + Drizzle ORM
- **Validation**: Zod 3.x
- **Logging**: Pino 9.x
- **Test Suite**: Vitest 3.x

---

## 1. Architectural Principles & System Context

The primary architectural requirement of V2 is **complete transport independence**. The bot core, command router, plugin lifecycle, and business logic must operate on a normalized context model (`MessageContext`), entirely agnostic of Facebook Graph API, Telegram, Discord, or any other underlying transport layer.

```text
                  ┌──────────────────────────────────────────────┐
                  │              Meta Messenger Webhook          │
                  └──────────────────────┬───────────────────────┘
                                         │ HTTPS POST (HMAC-SHA256)
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │          src/platform/facebook/              │
                  │  ├── Webhook Handler (Verify & Parse)        │
                  │  ├── Signature Validator (x-hub-signature)   │
                  │  ├── Event Normalizer (To MessageContext)    │
                  │  └── Outgoing Rate-Limited Sender & Queue    │
                  └──────────────────────┬───────────────────────┘
                                         │ Normalized MessageContext
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │                   src/core/                  │
                  │  ├── BotCore Engine                          │
                  │  ├── Middleware Pipeline                     │
                  │  ├── SessionManager (Persistent TTL Store)   │
                  │  ├── PermissionManager (RBAC Matrix)         │
                  │  ├── CooldownManager (Token Bucket)          │
                  │  ├── CommandRouter (Routing & Subcommands)   │
                  │  ├── EventRouter                             │
                  │  └── Scheduler (Cron & Delayed Tasks)        │
                  └──────────────┬───────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│   src/plugins/   │   │  src/services/   │   │src/repositories/ │
│ ├── core/        │   │ ├── ai/          │   │ ├── user.ts      │
│ ├── admin/       │   │ ├── weather/     │   │ ├── thread.ts    │
│ ├── utility/     │   │ ├── translation/ │   │ ├── session.ts   │
│ └── economy/     │   │ └── media/       │   │ └── economy.ts   │
└──────────────────┘   └──────────────────┘   └─────────┬────────┘
                                                        │
                                                        ▼
                                              ┌──────────────────┐
                                              │  SQLite Database │
                                              │  (Drizzle ORM)   │
                                              └──────────────────┘
```

---

## 2. Directory Structure

```text
src/
├── app.ts                         # Application entrypoint & Fastify setup
│
├── core/
│   ├── bot.ts                     # BotCore orchestrator
│   ├── context.ts                 # MessageContext and CommandContext contracts
│   ├── command-router.ts          # Prefix parsing, alias resolution, command dispatch
│   ├── event-router.ts            # Non-command event dispatcher
│   ├── session-manager.ts         # Persistent conversation multi-step dialog manager
│   ├── permission-manager.ts      # Role-based access control (RBAC)
│   ├── cooldown-manager.ts        # Per-user, per-command rate limiting
│   ├── scheduler.ts               # Background task scheduler
│   └── middleware.ts              # Pipeline middleware interface
│
├── platform/
│   └── facebook/
│       ├── adapter.ts             # Facebook PlatformAdapter implementation
│       ├── webhook.ts             # Fastify webhook routes (GET verify, POST receive)
│       ├── parser.ts              # Meta Webhook payload -> MessageContext normalizer
│       ├── sender.ts              # Official Graph API v21.0 sender
│       ├── queue.ts               # Outgoing rate-limited message queue
│       ├── errors.ts              # Facebook API error mapper & retry backoff
│       └── types.ts               # Meta Messenger payload type definitions
│
├── database/
│   ├── index.ts                   # Database connection (SQLite with WAL mode)
│   ├── schema.ts                  # Drizzle table schemas
│   └── migrations/                # Database migration scripts
│
├── repositories/
│   ├── user.repository.ts         # User profiles & permissions
│   ├── conversation.repository.ts # Threads / Chat metadata
│   ├── session.repository.ts      # Conversation sessions with TTL
│   ├── economy.repository.ts      # Balances & transactions
│   └── audit-log.repository.ts    # Security audit events
│
├── plugins/
│   ├── plugin.interface.ts        # Plugin lifecycle and metadata contracts
│   ├── plugin-loader.ts           # Dynamic, safe plugin registrar
│   ├── core/                      # Ping, help, info, uptime
│   ├── admin/                     # User roles, bans, settings
│   ├── utility/                   # Translate, weather, math, qr
│   ├── economy/                   # Bank, work, balance
│   └── ai/                        # AI chat assistant
│
├── services/
│   ├── ai/                        # AI provider abstraction (OpenAI, Gemini, OpenRouter)
│   └── weather/                   # OpenWeatherMap client with caching
│
├── config/
│   └── env.ts                     # Zod-validated environment variables
│
└── utils/
    ├── logger.ts                  # Pino structured logger
    └── errors.ts                  # Domain error classes
```

---

## 3. Normalized Message Context

The `MessageContext` abstraction shields commands from transport-specific details:

```typescript
export interface Attachment {
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
}

export interface OutgoingMessage {
  text?: string;
  attachments?: Attachment[];
  replyToMessageId?: string;
  quickReplies?: Array<{ title: string; payload: string }>;
}

export interface SendResult {
  messageId: string;
  recipientId: string;
  timestamp: number;
}

export interface MessageContext {
  readonly platform: 'facebook';
  readonly userId: string;
  readonly conversationId: string;
  readonly messageId: string;
  readonly text: string;
  readonly attachments: Attachment[];
  readonly isGroup: boolean;
  readonly timestamp: number;

  reply(message: OutgoingMessage | string): Promise<SendResult>;
  send(message: OutgoingMessage | string): Promise<SendResult>;
  react(emoji: string): Promise<void>;
}
```

---

## 4. Command System & Router

```typescript
export enum Role {
  USER = 0,
  MODERATOR = 1,
  ADMIN = 2,
  OWNER = 3,
  BANNED = -1,
}

export interface CommandContext extends MessageContext {
  readonly commandName: string;
  readonly args: string[];
  readonly rawArgs: string;
  readonly userRole: Role;
  readonly sessionManager: SessionManager;
}

export interface Command {
  readonly name: string;
  readonly aliases?: string[];
  readonly description: string;
  readonly usage?: string;
  readonly category: string;
  readonly requiredRole?: Role;
  readonly cooldown?: number; // seconds
  execute(ctx: CommandContext): Promise<void>;
}
```

### Dispatch Pipeline:
```text
Incoming Message
  ↓
Signature & Idempotency Check
  ↓
Session Check (Active reply session? Route to session handler if present)
  ↓
Command Parser (Prefix match, tokenize args)
  ↓
Permission Check (User role vs Command requiredRole)
  ↓
Cooldown Check (Token bucket per user + command)
  ↓
Command.execute(ctx)
  ↓
Pino Audit Log
```

---

## 5. Session Manager (Persistent Conversation Dialogs)

Replaces `global.client.handleReply`.
- Backed by SQLite table `conversation_sessions`.
- Keyed by `conversationId` and `userId`.
- Contains `id`, `commandName`, `step`, `state` (JSON), `createdAt`, and `expiresAt`.
- Swept periodically for expired sessions.
- Resilient across process restarts.

---

## 6. Rate Limiting & Outgoing Request Queue

To protect against Meta Graph API rate limits (200 calls/hour/page for standard tier or high concurrency spikes):
- **Incoming**: Rate limiting per IP and per `sender_id`.
- **Outgoing**: Token-bucket priority queue (`src/platform/facebook/queue.ts`).
- Supports automatic exponential backoff: 1s, 2s, 4s, 8s (max 3 retries) on retryable errors (`ECONNRESET`, HTTP 429, HTTP 500, HTTP 503).
- Non-retryable errors (e.g. 400 Bad Request, 403 Forbidden, 190 Invalid Token) immediately fail and log structured audit records.

---

## 7. Configuration & Environment Validation

All configuration is parsed and validated using Zod at process start. Missing mandatory fields trigger immediate, clear termination before any socket is opened.

```typescript
// Required Variables:
FACEBOOK_PAGE_ID
FACEBOOK_APP_SECRET
FACEBOOK_VERIFY_TOKEN
FACEBOOK_PAGE_ACCESS_TOKEN
DATABASE_URL
PORT
NODE_ENV
```
