# DESIGN SPECIFICATION: FACEBOOK PERSONAL ACCOUNT & GROUP CHAT BOT V2

- **Project**: Facebook Response Bot V2 (Personal Account + Group Chat Engine)
- **Status**: APPROVED DESIGN
- **Date**: 2026-09-13
- **Author**: Principal Software Architect & Lead Reliability Engineer

---

## 1. System Overview & Core Principles

The target system is a high-reliability, modular, personal account & group chat bot built from the ground up to replace legacy brittle bots. It completely eliminates FCA (`fca-horizon-remake`), god-object global state (`global.client`), and unmanaged synchronous side-effects.

```text
       [ Facebook Personal Account ]
                     │ Session (AES-256-GCM encrypted)
                     ▼
    ┌────────────────────────────────────────────────────────┐
    │          1. Transport Layer (Cleanroom Client)         │
    │  - MessagingTransport Interface                        │
    │  - FacebookPersonalTransport (HTTP/MQTT Driver)       │
    │  - FakeFacebookTransport (For Test Isolation & CI)     │
    └────────────────────────┬───────────────────────────────┘
                             │ Raw Events
                             ▼
    ┌────────────────────────────────────────────────────────┐
    │         2. Safety & Reliability Layer                  │
    │  - Deduplication (processed_events & messages)         │
    │  - RateLimiter (Global, Thread, User limits)           │
    │  - RequestQueue (Priority: critical, normal, bg)       │
    │  - RetryPolicy (Exponential backoff, upper bounded)    │
    │  - CircuitBreaker (Closed -> Open -> Half-Open)        │
    │  - HealthMonitor & Kill Switch (BOT_ENABLED, Pause)    │
    └────────────────────────┬───────────────────────────────┘
                             │ NormalizedMessage & GroupContext
                             ▼
    ┌────────────────────────────────────────────────────────┐
    │         3. Bot Core Engine                             │
    │  - Context Normalization & Message History Persist     │
    │  - SessionManager (Persistent SQLite TTL Store)        │
    │  - PermissionManager (OWNER, ADMIN, MOD, USER, BANNED) │
    │  - CommandRouter (Prefix, Scope: DM/GROUP/BOTH)        │
    │  - EventRouter (Join, Leave, Reaction, Update)         │
    │  - Scheduler (Persistent scheduled_jobs)               │
    └────────────────────────┬───────────────────────────────┘
                             │
     ┌───────────────────────┼───────────────────────┐
     ▼                       ▼                       ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ 4. Group Engine  │   │ 5. Plugin System │   │ 6. Storage & DB  │
│ - Thread Metadata│   │ - core / admin   │   │ - SQLite (WAL)   │
│ - Per-group Cfg  │   │ - utility / eco  │   │ - Repositories   │
│ - Mentions/QTV   │   │ - entertainment  │   │ - Local History  │
│ - Welcome/Leaves │   │ - AI provider    │   │ - Sessions & Jobs│
└──────────────────┘   └──────────────────┘   └──────────────────┘
```

---

## 2. Transport Abstraction Layer

The Bot Core and Plugins are **100% transport-independent**. They never touch Facebook-specific APIs or sockets directly.

### 2.1 Interface Definition (`src/transport/interfaces/transport.ts`)

```typescript
export interface OutgoingMessage {
  text?: string;
  attachments?: Array<{ type: 'image' | 'video' | 'audio' | 'file'; url: string }>;
  replyToMessageId?: string;
  mentions?: Array<{ tag: string; id: string }>;
}

export interface SendResult {
  messageId: string;
  threadId: string;
  timestamp: number;
}

export type ReactionEmoji = '👍' | '❤️' | '😆' | '😮' | '😢' | '😡';

export interface MessagingTransport {
  readonly name: string;
  readonly isConnected: boolean;

  connect(): Promise<void>;
  disconnect(): Promise<void>;
  
  sendMessage(threadId: string, message: OutgoingMessage): Promise<SendResult>;
  react(messageId: string, reaction: ReactionEmoji): Promise<void>;
  getThread(threadId: string): Promise<Thread>;
  getUser(userId: string): Promise<User>;
  markRead(threadId: string): Promise<void>;

  onMessage(handler: (msg: NormalizedMessage) => Promise<void>): void;
  onEvent(handler: (event: TransportEvent) => Promise<void>): void;
}
```

### 2.2 Transport Implementations:
1. `FacebookPersonalTransport`: Cleanroom protocol client maintaining cookie sessions, MQTT event stream, and authenticated Graph/DocID endpoints.
2. `FakeFacebookTransport`: In-memory transport used for unit, integration, and load tests without hitting Facebook servers.

---

## 3. Session & Credential Security (`SessionStore`)

- Cookies and session tokens are **never stored in plaintext** and **never committed to git**.
- Format: Versioned JSON (`sessionVersion: 2`, `cookies`, `userId`, `createdAt`, `updatedAt`, `metadata`).
- Storage: Encrypted on disk using **AES-256-GCM** with a master secret key (`SESSION_ENCRYPTION_KEY` in `.env`).
- Automatic Protection: If Facebook invalidates credentials, the transport transitions to `AUTH_ERROR` and immediately **PAUSES** all requests. No infinite login spam.

---

## 4. Safety & Reliability Layer

### 4.1 Deduplication
- Checks every incoming message against `processed_messages` cache and SQLite table.
- Duplicate message deliveries are dropped before triggering any middleware or commands.

### 4.2 RateLimiter
- Multi-tier token bucket:
  - **Global limit**: Max operations per second across the bot (default: 3-5).
  - **Thread limit**: Serial queue per thread (concurrency: 1) to guarantee chronological reply order.
  - **User limit & Command Cooldown**: Configurable per user and per command.

### 4.3 Outgoing RequestQueue
- States: `QUEUED`, `RUNNING`, `SUCCESS`, `RETRY`, `FAILED`, `CANCELLED`.
- Priorities:
  - `CRITICAL` (Admin emergency, pause commands)
  - `NORMAL` (User command replies)
  - `BACKGROUND` (Sync, scheduled notifications)

### 4.4 Circuit Breaker
- Tracks consecutive transport failures:
  - **CLOSED**: Normal operation.
  - **OPEN**: Failure count exceeds threshold (default: 5 errors). All outgoing actions paused for cooldown period (default: 60s).
  - **HALF_OPEN**: Sends a probe request. On success, transitions to CLOSED; on failure, re-opens.

### 4.5 Kill Switch & Automatic Pause
- Controlled by `BOT_ENABLED` environment variable and `/pause` / `/resume` runtime admin commands.
- When paused: Incoming messages can still be safely archived to local history, but no outgoing actions are sent.

---

## 5. Group Chat Engine & Context

### 5.1 Normalized Message & Thread
```typescript
export interface Thread {
  id: string;
  type: 'GROUP' | 'USER' | 'UNKNOWN';
  name?: string;
  adminIds: string[];
  participants: Array<{ id: string; name?: string; nickname?: string }>;
  metadata: Record<string, unknown>;
}

export interface GroupContext extends CommandContext {
  readonly isGroup: true;
  readonly thread: Thread;
  readonly isThreadAdmin: boolean;
}
```

### 5.2 Per-Group Settings (`thread_settings`)
Stored in SQLite:
- `thread_id`: Primary key
- `prefix`: Group-specific command prefix override
- `ai_enabled`: Toggle bot AI responses in this thread
- `welcome_enabled`: Toggle welcome notification on join
- `leave_enabled`: Toggle leave notification
- `anti_spam`: Limit message bursts from users

---

## 6. Persistence & Local Message History

SQLite with Write-Ahead Logging (`WAL`) mode:
1. `users`: ID, platform, name, role, balance, exp, timestamps.
2. `threads`: ID, platform, type, name, admin_ids, settings, timestamps.
3. `messages`: Local message archive (ID, thread_id, sender_id, text, attachments, reply_to, timestamp).
4. `conversation_sessions`: Persistent multi-step dialog states with TTL.
5. `scheduled_jobs`: Background jobs and reminders with resume-on-restart.
6. `audit_logs`: Administrative actions, bans, role changes.
7. `queue_jobs`: In-flight queue recovery.

---

## 7. Testing & Quality Assurance Plan

1. **FakeFacebookTransport**: Fully testable mock transport for high-speed deterministic testing.
2. **Contract Tests**: Validates interface compliance between real and fake transport.
3. **Unit Tests**: Coverage for every core and reliability module.
4. **Failure Simulation Tests**:
   - Simulated transport timeout & HTTP 500
   - Authentication failure -> triggers circuit pause
   - Database lock / busy condition
   - Plugin failure sandbox isolation
   - Duplicate message delivery rejection
5. **Load Benchmark**: 1,000 simulated messages to guarantee bounded memory and zero memory leaks.

---

## 8. Execution Phases (18 Phases)

- **Phase 0**: Legacy Audit & Capability Inventory (`LEGACY_AUDIT.md`, `CAPABILITY_INVENTORY.md`)
- **Phase 1**: Architecture & ADRs (`ARCHITECTURE.md`, `ADR/`)
- **Phase 2**: Project Bootstrap & Config-driven Dynamic Setup
- **Phase 3**: Core Runtime & Normalized Message Contracts
- **Phase 4**: Database & Repositories (Local Message Store, Thread Settings, Sessions)
- **Phase 5**: Transport Abstraction & Facebook Personal Transport Driver
- **Phase 6**: Reliability Layer (RequestQueue, RateLimiter, CircuitBreaker, Dedup)
- **Phase 7**: Group Chat Engine & Per-Thread Controls
- **Phase 8**: Plugin System & Dynamic Loader
- **Phase 9**: Migrate P0 Core Commands (ping, help, uptime, rules, admin)
- **Phase 10**: Migrate P1 Features (ai/sim, bank/economy, multi-step sessions)
- **Phase 11**: Migrate P2 Utilities & Entertainment (calc, quote, dice, translate, weather)
- **Phase 12**: AI Services & Context Window Token Budgeting
- **Phase 13**: Observability Dashboard & Runtime Control (/health, /status, /pause, /resume)
- **Phase 14**: Failure Simulation & Load Testing (1,000 messages)
- **Phase 15**: Security Audit & Secret Redaction
- **Phase 16**: Docker & Production Deployment Assets
- **Phase 17**: Final Audit & Acceptance Criteria Verification
