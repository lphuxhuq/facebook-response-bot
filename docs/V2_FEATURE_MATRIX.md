# PHASE 1 — V2 FEATURE MATRIX (`remake-and-test` @ dbed17a)

Status legend: `WORKING` (chạy thật end-to-end) · `PARTIAL` (code thật, thiếu wiring/coverage) · `STUB` (chữ ký có, hành vi rỗng) · `MOCK` (test double phục vụ production default) · `BROKEN` (claim sai so với runtime) · `UNUSED` (code + test tốt, zero production caller) · `REMOVE` (legacy, không thuộc V2)

Không mục nào được tính "complete" nếu dựa vào stub/mock.

## A. Core Infrastructure

| Feature | File(s) | Status | Deps | Page-specific? | Personal compat | Required changes | Test coverage |
|---|---|---|---|---|---|---|---|
| HTTP server (Fastify) | `src/app.ts` | WORKING | fastify, raw-body | Webhook route Page-only | transport-agnostic | extract webhook route into page transport | app.test.ts, e2e |
| Webhook handshake + HMAC | `platform/facebook/webhook.ts`, `signature.ts` | WORKING | node:crypto | YES | N/A (personal không dùng webhook) | keep as Page transport | 5+3 tests |
| Env validation (zod) | `config/env.ts` | WORKING | zod | FACEBOOK_PAGE_* required-ish | add FB_SESSION_*, TRANSPORT_MODE | split per-transport sections | implicit |
| Logger + redact | `utils/logger.ts` | PARTIAL | pino | no | cookies redact thiếu (S6) | add c_user/xs/cookies paths | none |
| DB SQLite WAL | `database/index.ts` | WORKING | node:sqlite | no | full | add versioned migration table | repositories.test |
| Schema: users | `database/index.ts:52` | WORKING | — | no | full | — | user repo tests |
| Schema: conversations | `:63` | UNUSED | — | no | full | wire to pipeline | repo tests only |
| Schema: conversation_sessions | `:71` | PARTIAL | — | no | full | **fix: inject SQLiteSessionStore** | session-store tests |
| Schema: messages | `:104` | UNUSED | — | no | full | wire persistence; needs `platform`+`thread_id` unique dedup view | none |
| Schema: thread_settings | `:94` | WORKING | — | no | full | + `enabled`, `language`, `allowed/disabled_commands` (Phase 19) | settings tests |
| Schema: audit_logs | `:85` | WORKING | — | no | full | — | repo tests |
| Schema: scheduled_jobs | `:116` | UNUSED | — | no | full | wire Scheduler.restore | none |
| **Missing tables** | — | — | — | — | — | `processed_events(platform,message_id) UNIQUE`, `threads`, `thread_participants`, `facebook_transport_state`, `queue_jobs` | — |
| Config per-group prefix | `command-router.ts:107-112` | WORKING (DM-only runtime) | threadSettings repo | no | full (parser không populate group id) | wire group parser | router tests |
| Kill switch `/pause` | `app.ts:170-196` | **BROKEN** | — | no | no | gate processMessage; auth protect | cosmetic only |
| `/queue` metrics | `app.ts:193-199` | STUB (hardcode 0) | — | no | no | bind to real RequestQueue stats | none |
| `/health`, `/ready`, `/status`, `/commands`, `/plugins` | `app.ts:102-167` | WORKING | — | no | full | + transport state machine | app tests |
| Graceful shutdown | `app.ts:201-224` | WORKING | — | no | full | + flush queue + close transport | none |

## B. Reliability Layer (Phase 9–14 targets)

| Feature | File | Status | Notes |
|---|---|---|---|
| RequestQueue (priority, per-thread, maxAttempts, cap) | `reliability/request-queue.ts` | **UNUSED** — 4 tests, 0 callers | thay thế `platform/facebook/queue.ts` khi wire |
| Token-bucket RateLimiter (user/thread/global) | `reliability/rate-limiter.ts` | **UNUSED** — tests only | wire vào pipeline outbound + inbound |
| CircuitBreaker 3-state | `reliability/circuit-breaker.ts` | **UNUSED** — tests only | wrap transport call site |
| MessageDeduplication (hash+TTL memory) | `reliability/deduplication.ts` | **UNUSED** — tests only | nâng lên DB-backed `processed_events` |
| HealthMonitor (RSS, event-loop, kill-switch) | `reliability/health-monitor.ts` | **UNUSED** — tests only | thay `isPaused` cosmetic |
| OutgoingMessageQueue (active in Page sender) | `platform/facebook/queue.ts` | WORKING | concurrency 5, delay 50, **no cap → burst risk** |
| ExponentialBackoff + error classifier | `platform/facebook/errors.ts` | PARTIAL | map đúng loại Phase 13 nhưng AUTH_ERROR→pause chưa nối |
| MessageDeduplicator in parser | `platform/facebook/parser.ts:6` | WORKING (memory-only) | trùng năng lực reliability → replace |

## C. Transport Abstraction (Phase 4–5 targets)

| Feature | File | Status | Notes |
|---|---|---|---|
| `MessagingTransport` interface | `transport/interfaces/transport.ts` | WORKING (definition) | khớp spec Phase 4, giữ nguyên |
| `NormalizedMessage` / `Thread` / `User` / `Attachment` / `Mention` | `transport/interfaces/*.ts` | WORKING (definition) | khớp Phase 6–7; chưa có `session.ts` interface |
| FakeFacebookTransport | `transport/facebook/fake-transport.ts` | WORKING (test double) | contract test 1 file — cần mở rộng đầy đủ 7 methods |
| AES-256-GCM SessionStore | `transport/facebook/session.ts` | PARTIAL | code tốt; dev fallback key (S4); không version-migration; zero production caller |
| **FacebookPersonalTransport** | — | **MISSING** | deliverable chính Phase 3 |
| Appstate importer (`appstate[] → StoredSession`) | — | MISSING | `appstate.json` legacy format đã xác nhận shape |
| Transport state machine + capability flags | — | MISSING | Phase 15: DISCONNECTED/CONNECTING/CONNECTED/DEGRADED/PAUSED/AUTH_ERROR |
| Auth-failure → PAUSE → notify admin (no relogin loop) | — | MISSING | Phase 12 |

## D. BotCore / Routers

| Feature | File | Status | Notes |
|---|---|---|---|
| BotCore processMessage | `core/bot.ts:42-61` | WORKING | router→event fallback |
| SessionManager (conversation) | `core/session-manager.ts` | PARTIAL | InMemory default; SQLite store exists but not injected (BROKEN restart-safety claim) |
| CommandRouter (prefix/alias/scope/RBAC/cooldown/session-reply) | `core/command-router.ts` | WORKING | 0 transport leakage (grep) |
| EventRouter | `core/event-router.ts` | PARTIAL | chỉ nhận MessageContext; không có event types (join/leave/reaction) |
| PermissionManager + role DB source | `core/permission-manager.ts`, `user.repository.ts` | PARTIAL | repo implements PermissionProvider nhưng BotCore hardcode InMemory(ownerId) → role trong DB **không dùng để gate lệnh** |
| CooldownManager | `core/cooldown-manager.ts` | WORKING | tests pass |
| Scheduler | `core/scheduler.ts` | PARTIAL | RAM-only; no restore (jobs table unused) |

## E. Plugins / Commands (30 lệnh)

| Command | File | Status | Transport dep | Personal compat |
|---|---|---|---|---|
| help, ping, uptime, rules | `plugins/core/*` | WORKING | ctx only | ✅ |
| admin (getrole/setrole/ban/unban/logs) | `plugins/admin/admin.ts` | WORKING | ctx only | ✅ (thiếu pause/resume claim) |
| groupinfo | `plugins/group/groupinfo.ts` | PARTIAL | **ctx.thread never populated** | ⛔ chờ personal parser |
| groupsettings | `plugins/group/settings.ts` | WORKING | threadSettings repo | ✅ |
| bank, daily, lixi, casino | `plugins/economy/*` | WORKING | user repo + sessions | ✅ (daily/lixi dùng JSON file — xem Ghi chú E.1) |
| weather, translate, calc, quote | `plugins/utility/*` | WORKING | services (OpenWeather mock khi thiếu key → MOCKED) | ✅ |
| dice, quiz | `plugins/entertainment/*` | WORKING | session | ✅ |
| ai | `plugins/ai/ai.ts` | PARTIAL | MockAI default (**MOCKED**); không có local history context | ✅ sau Phase 21 |
| media | `plugins/media/media.ts` | WORKING | đọc `modules/.../media_links.json` | ⛔ path phụ thuộc thư mục legacy → phải copy data sang `src/data/plugins` khi xóa modules/ |
| dhbc, taixiu, boctham, mine, taixiuc, rank | `plugins/games/*` | WORKING | canvas via services; rank đọc graph.facebook avatar (Page-ish → chuyển qua transport.getUser) | ✅ |
| hanhtinh, cadao, danhngon, truyencuoi, chuctet, wiki, loibaihat | `plugins/knowledge/*` | WORKING | inline data + REST APIs | ✅ |

**E.1 Ghi chú:** game state (`daily.json`, `lixi.json`, `mine.json`) ghi file `src/data/plugins/*.json` — hoạt động nhưng **không qua repositories** → không audit, không index, races khi multi-process. Cân nhắc migrate sang bảng `user_metadata` khi wire DB.

## F. Events / Reactions / Unsend

| Feature | Status | Evidence |
|---|---|---|
| Incoming reaction parse | BROKEN | `parser.ts:69-70` chỉ message/postback, reaction→null |
| Outgoing react() | STUB | `parser.ts:117-121` chỉ logger.debug (Page API không có endpoint) → personal transport sẽ cung cấp thật |
| member join/leave | MISSING | không có trong Page webhook; personal API có |
| message unsend restore | MISSING | messages table empty → không có nền |
| mentions parse | MISSING | type không có mentions field |
| reply_to parse | MISSING | `reply_to` có trong WebhookMessagingEvent nhưng parser bỏ |

## G. Legacy (Phase 42/43 scope)

| Item | Status | Decision |
|---|---|---|
| `mirai.js`, `index.js` (runner + spawn) | REMOVE after Phase 3 | runtime FCA |
| `modules/` 435 commands + 18 events + cache | REMOVE after port/copy data | một số đã port |
| `includes/` (Sequelize, controllers, data.sqlite) | REMOVE + **SEC S2** | tracked DB |
| `nodemodules/` vendored (git-tracked) | REMOVE | |
| `languages/`, `config.json`, `FastConfigFca.json`, `.replit*`, `lq.js`, `youtube.js` | REMOVE | |
| `appstate.json` | **SEC S1 → revoke + purge history** | |
| `fca-horizon-remake` + ~25 deps nghi vấn | REMOVE after transport done, verify by `npm ls` + grep | dependency graph: audit §10 |
| `docs/*` cũ + README claims | UPDATE | README sai 3 chỗ (restart-safe, admin pause, multi-turn AI) |

## H. Test coverage summary (REAL run)

- 132/132 pass; typecheck/build exit 0; không lint script.
- Behavior tests thật: core routers, signature, e2e webhook, plugins, repos, reliability (cô lập), session-store (cô lập).
- **Gaps bắt buộc (spec §33–39):** pipeline integration có DB, restart recovery (sẽ fail cho tới khi fix wiring), failure matrix 14 case, load qua app thật, Docker build verify.

---

## Verdict

- **KEEP nguyên:** core/* (sửa wiring bot.ts), command-router, cooldown, event-router, plugin interface/loader, repositories (đã có caller), config env (mở rộng), database init (thêm migration), Page webhook/sender (coexist), transport interfaces, AES SessionStore, cả 5 reliability modules.
- **REFACTOR:** parser (reaction/mentions/reply_to/group), scheduler (restore), permission wiring (DB provider), logger redact, `/pause` gate, `/queue`, JSON game-state → DB.
- **BUILD MỚI:** FacebookPersonalTransport (+connect/read/send/threads/react + capability flags), Session importer, processed_events, transport registry + state machine, OutgoingAction pipeline.
- **REMOVE (sau):** toàn bộ cluster legacy §G + deps orphan.

**Blocking decisions chờ user duyệt trước Phase 3:** xem Audit §14 cuối trang.
