# PHASE 0 — BASELINE AUDIT: `remake-and-test`

> **Audit date:** 2026-09-13
> **Commit audited:** `dbed17a` (remake-and-test)
> **Method:** Đọc code thật từng file + grep verification + chạy test/build thật. Mọi kết luận có file:line.
> **Verdict tổng quan:** Kiến trúc V2 cốt lõi tốt, giữ được ~90%. Vấn đề lớn nhất KHÔNG phải code thiếu, mà là **code đã viết nhưng chưa được nối dây (unwired)**: `src/reliability/*`, `src/transport/*` (kể cả session AES), `SQLiteSessionStore`, `MessageHistoryRepository`, `ScheduledJobRepository` — tất cả tồn tại, có test, nhưng **zero production caller**.

---

## 1. Existing architecture

Luồng thực tế chạy được (chứng minh bằng `tests/contract/facebook-e2e.test.ts` pass):

```
Meta Webhook (Fastify, HMAC-SHA256)
  → src/platform/facebook/webhook.ts     (verify signature, trả 200 ngay, process async)
  → src/platform/facebook/parser.ts      (payload → MessageContext, closure reply/send)
  → src/core/bot.ts BotCore.processMessage(ctx)
      → src/core/command-router.ts       (session lookup → prefix → permission → cooldown → execute)
      → src/core/event-router.ts         (fallback, handlers từ plugin)
  → ctx.reply() (closure) → src/platform/facebook/sender.ts
      → OutgoingMessageQueue (concurrency 5, delay 50ms)
      → withExponentialBackoff → Graph API /me/messages (JSON hoặc multipart filedata)
```

Hai hệ transport song song TỒN TẠI nhưng không giao nhau:

| | `src/platform/facebook/` (Page) | `src/transport/` (Personal) |
|---|---|---|
| Thực tế | webhook + parser + sender — **đang chạy trong app.ts** | interfaces + AES SessionStore + FakeTransport — **chỉ test import, zero production usage** |
| Kết luận | Page-specific transport hiện hành | Khung Personal Transport đã có skeleton, đúng spec Phase 4/5 |

**Không có** `migrations/` (schema tạo bằng `CREATE TABLE IF NOT EXISTS` trong `database/index.ts:50`, không versioned).

## 2. Existing core

| File | Đánh giá | Lỗi/Gap cụ thể |
|---|---|---|
| `core/bot.ts` (68d) | **KEEP** | Zero import transport — dependency qua `MessageContext` closure là đúng. **BUG NỐI DÂY:** `bot.ts:28` `new SessionManager()` không truyền store → dùng InMemory. `SQLiteSessionStore` tạo ở `app.ts:47` nhưng không được inject → claim "Restart-Safe Dialogs" **SAI ở runtime**. |
| `core/context.ts` (109d) | **KEEP + refactor nhỏ** | `platform: 'facebook' \| 'test'` hardcode ở `MessageContext` — cần mở rộng khi có personal. Attachment đã hỗ trợ `DataAttachment` (canvas). |
| `core/command-router.ts` (211d) | **KEEP** | **Không có transport leakage** (grep: 0 import từ platform/transport). Đã có scope DM/GROUP/BOTH, RBAC, cooldown, session reply. Group-prefix override đọc từ `repositories.threadSettings` hoạt động. |
| `core/event-router.ts` (26d) | **KEEP** | Đăng ký handler OK, error isolation OK. **Gap:** không có event type — chỉ nhận `MessageContext` (tin nhắn). Không phân biệt join/leave/reaction/unsend. |
| `core/permission-manager.ts` | **KEEP** | InMemoryPermissionProvider + ownerId — chưa đọc role từ DB repo khi resolve (userRepo implements PermissionProvider nhưng BotCore không wire). |
| `core/cooldown-manager.ts` | **KEEP** | Đã test. |
| `core/session-manager.ts` (140d) | **KEEP** | Đây là **ConversationSession** (đúng tách bạch với auth session). TTL, cleanup 60s, store abstraction `SessionStore` → swap được SQLite. Chỉ thiếu wiring (xem bot.ts) + **restart recovery**: session InMemory mặc định mất khi restart. |
| `core/scheduler.ts` (54d) | **REFACTOR** | `setInterval` thuần trong RAM. `scheduled_jobs` table + `ScheduledJobRepository` tồn tại nhưng **zero caller** → job mất khi restart, không restore. |

## 3. Existing Facebook integration (Page)

- `platform/facebook/adapter.ts` (40d): wrapper mỏng (sender+parser+registerRoutes) — **chỉ được dùng ở `app.ts:88-93`**. Page-only.
- `platform/facebook/webhook.ts` (69d): GET handshake verify token; POST xác minh `x-hub-signature-256` qua `signature.ts` (timingSafeEqual — an toàn), trả 200 trước rồi process async — **đúng pattern Meta khuyến cáo**.
- `platform/facebook/parser.ts` (126d): **chỉ parse `message` + `postback`**. `reaction` event có trong type (`WebhookMessagingEvent.reaction`) nhưng `parseMessagingEvent` return null → **incoming reaction bị bỏ rơi**. Không parse `reply_to`, không parse `mentions`, attachments chỉ lấy url. `isGroup: false` **hardcode** (dòng 106) → mọi hội thoại bị xem là DM.
- `platform/facebook/sender.ts` (đã nâng cấp): `pageAccessToken` dùng tại 3 chỗ (JSON send, multipart send, sender action) qua query `?access_token=`. Có retry/backoff + queue riêng (`queue.ts`).
- `platform/facebook/errors.ts`: map code 190→AuthenticationError, 4/17/32/613→RateLimitError — **đúng nền cho retry policy Phase 13, chỉ chưa được nối vào pipeline reliability**.

## 4. Existing session system

Hai loại session đã TÁCH BẠCH đúng yêu cầu Phase 17:

1. **ConversationSession** (`core/session-manager.ts` + `repositories/session.repository.ts`): state lệnh đa bước, TTL. ✅ đúng thiết kế. ❌ wiring (mục 2).
2. **FacebookAuthSession** (`transport/facebook/session.ts`, 119d): **đã implement trước cả spec Phase 5** — `StoredSession { sessionVersion, userId, cookies[], createdAt, updatedAt, metadata }`, AES-256-GCM (IV 12B + tag 16B, format `iv:tag:ciphertext`), validate yêu cầu cookie `c_user` + `xs`, `invalidate()` xóa file, mode 0o600, không log giá trị cookie.
   - ❌ **DEV FALLBACK KEY** `default_dev_session_secret_key_32_bytes!` khi thiếu `ENCRYPTION_KEY` (`session.ts:35`) — production phải fail-fast thay vì âm thầm dùng key cố định.
   - ❌ Zero production caller — chưa transport nào dùng.
   - ❌ `sessionVersion: 2` validate cứng, **không có version migration** (load() trả null nếu version khác → mất session im lặng).

`appstate.json`: format mảng cookie Playwright-style (`key,value,domain,path,hostOnly,creation,lastAccessed` — 23 mục, có trùng key). **KHÔNG** có importer nào map nó vào `StoredSession` → appstate chỉ là quan hệ với legacy `mirai.js`, không phải Core API (đúng hướng Phase 10, cần Session Importer).

## 5. Existing plugins

10 plugin đăng ký trong `app.ts:95-106`: core, admin, group, utility, economy, entertainment, ai, media, games, knowledge (30 lệnh).

- `plugins/plugin-loader.ts` (89d): load có try/catch isolate (plugin crash → log, core sống ✅ — test `plugin-loader.test.ts` "Explosive initialization" pass). `unloadPlugin` unregister commands + destroy ✅. **Gap:** `enabled` field không được kiểm tra khi register; "reload" thực chất là unload+register lại thủ công — **không có hot-reload từ đĩa** (README/admin claim "reload plugin" là overclaim).
- `plugins/group/`: **real implementation, không phải stub** (settings.ts đọc/ghi `thread_settings` qua repo thật; groupinfo.ts render từ `ctx.thread`). NHƯNG `ctx.thread` **không bao giờ được set** bởi Page parser → groupinfo luôn hiện placeholder "Nhóm Chat / N/A", `isThreadAdmin` luôn undefined → **group engine bị vô hiệu hóa bởi transport, không phải bởi plugin**.
- `plugins/admin/commands/admin.ts` (108d): setrole/ban/unban/logs — **audit log hoạt động thật** (`auditRepo.log` ở setrole/ban). ❌ README claim `!admin pause/resume` (kill switch) — **không tồn tại trong lệnh admin**.
- `plugins/ai/commands/ai.ts` (45d): gọi `services.aiProvider` (MockAIProvider mặc định nếu thiếu key — test pass nhưng là MOCK). ❌ **không có history từ local DB** — mỗi request là 1-shot prompt, không phải multi-turn context (mâu thuẫn claim "ghi nhớ ngữ cảnh đa lượt" trong README).

## 6. Existing repositories

7 repos, tất cả typed, dùng `node:sqlite` (DatabaseSync):

| Repo | Production caller thật? | Ghi chú |
|---|---|---|
| user.repository | ✅ (bank, casino, mine, rank...) | **Thiếu `exp` update** — rank/quiz cộng coins nhưng không có đường nào tăng exp; claim exp-based rank chưa có nền ghi. |
| thread-settings.repository | ✅ (command-router group prefix, settings.ts) | sync API trực tiếp DB (không async) — chấp nhận được với WAL. |
| audit-log.repository | ✅ (admin lệnh) | chỉ SET_ROLE/BAN_USER. |
| session.repository | ❌ **zero wiring** (tạo ở app.ts:47, không inject) | xem mục 2. |
| conversation.repository | ❌ **zero caller** | conversations table không được populate → unsend/resend không có nền. |
| message-history.repository | ❌ **zero caller** | messages table **không bao giờ có bản ghi** → mọi claim về "unsend", "trích dẫn", AI history chưa có nền dữ liệu. Đã dùng `INSERT OR IGNORE` theo `id` PRIMARY KEY → nếu gọi thật thì dedup DB-level hoạt động. |
| scheduled-job.repository | ❌ **zero caller** | xem scheduler. |

## 7. Existing tests (Phase 2 — kết quả chạy THẬT, commit dbed17a)

```
npm test          → 31/31 test files, 132/132 tests passed, duration ~0.9s
npm run typecheck → exit 0
npm run build     → exit 0, dist/app.js tồn tại
npm run lint      → KHÔNG TỒN TẠI (không có lint script)
```

Test **thực sự verify behavior** (không phải assertion rỗng):
- `tests/core/command-router.test.ts` (4): prefix/alias/permission denied/cooldown/scope GROUP — assert kết quả thật.
- `tests/platform/facebook/signature.test.ts` (5): HMAC valid/invalid/tampered — crypto thật.
- `tests/contract/facebook-e2e.test.ts` (5): full pipeline — handshake 200, token sai 403, signature sai 401, POST `!ping` → parse → router → sender (mock fetch) → assert reply content **một lần**.
- `tests/platform/facebook/parser.test.ts` (3): include dedup "same mid twice → 1 context".
- `tests/plugins/*` (~50): hành vi từng lệnh với mock repo.
- `tests/performance/load-test.test.ts`: RequestQueue với 100/1000 jobs — **chỉ test module reliability trực tiếp**, không phải pipeline.
- `tests/resilience/failure-simulation.test.ts`: circuit breaker + queue failover — **cũng cô lập, không đi qua app**.

**MOCKED/MISSING theo spec Phase 33-39:**
- ❌ Không có integration test pipeline đầy đủ có **DB thật** (dedup persisted, message history written).
- ❌ Không có **restart test** (kill → restore session/jobs) — và hiện **SẼ FAIL** vì wiring InMemory (mục 2/6).
- ❌ Không có test "command crash / plugin crash" qua app thật (chỉ isolate initialize).
- ❌ Không có failure test auth-failure → pause pipeline (module health-monitor test riêng lẻ).
- ⚠️ Load test không đo queue không giới hạn qua app (queue hiện tại `maxQueueSize` chỉ ở RequestQueue orphan; OutgoingMessageQueue của sender **không có cap** → burst vô hạn về memory, chỉ bị giới hạn bởi concurrency).

## 8. Existing mocks/stubs

| Thành phần | Trạng thái thật |
|---|---|
| `MockAIProvider` | MOCK — app mặc định dùng khi thiếu `AI_API_KEY` (app.ts:53). Gemini provider có test riêng (ai.test.ts mock fetch). |
| `FakeFacebookTransport` | XÁC ĐỊNH là test double — nhưng chưa contract test đầy đủ (có 1 test file). |
| Reliability layer (5 module) | **TRULY IMPLEMENTED nhưng ORPHANED** — không phải stub; code + test tốt; chỉ chưa ai gọi. |
| `transport/` interfaces | IMPLEMENTED (đúng spec Phase 4) nhưng chưa có **FacebookPersonalTransport** thật. |
| Group `ctx.thread` | Không stub — nhưng **luôn rỗng** do parser Page không cung cấp → hành vi group degraded. |
| `/queue` endpoint | **FAKE** — `app.ts:193-199` trả `queueSize: 0, activeJobs: 0` hardcode. |
| `/pause` + `/transport` endpoint | **COSMETIC** — `isPaused` (app.ts:170) chỉ đổi response JSON; `botCore.processMessage` KHÔNG bị gate → **kill switch không hoạt động thật**. |

## 9. Existing Page-specific assumptions (cần phân loại Phase 41)

| Vị trí | Assumption | Xử lý đề xuất |
|---|---|---|
| `config/env.ts:14-18` | `FACEBOOK_PAGE_ID/APP_SECRET/VERIFY_TOKEN/PAGE_ACCESS_TOKEN` | MOVE TO PAGE TRANSPORT + thêm group personal (`FB_SESSION_PATH`, `FB_EMAIL?` không — chỉ session). KEEP AS OPTIONAL (dual transport). |
| `platform/facebook/*` (cả thư mục) | Graph API `?access_token=`, recipient PSID, HMAC webhook | KEEP AS PAGE TRANSPORT (không xóa — vẫn là capability hợp lệ, README claim dual). |
| `parser.ts:75` | `conversationId = event.sender.id` — **PSID, không phải thread ID thật** | Page-only, document giới hạn. |
| `parser.ts:106` | `isGroup: false` hardcode | REWRITE trong personal parser. |
| `sender.ts` messaging_type RESPONSE | Page 24h window | MOVE TO PAGE TRANSPORT. |
| `core/context.ts:6` | `platform: 'facebook' \| 'test'` | REFACTOR — mở union + thêm `transport` id khi cần. |
| `SessionStore` (transport/facebook/session.ts) | cookie c_user/xs | KEEP — đây chính là nền Personal (Phase 5 xong 70%). |

## 10. Existing FCA dependencies (Phase 3 — dependency graph)

```
fca-horizon-remake (package.json:42, git+https://github.com/VangBanLaNhat/fca-unofficial)
  └── CHỈ duy nhất: mirai.js:9  (const login = require("fca-horizon-remake"))
        └── mirai.js ← index.js (spawn "mirai.js")  [scripts: legacy:start]
              ← KHÔNG import từ src/ (0 match), KHÔNG import từ tests/ (0 match)
        └── mirai.js → modules/commands (435 file), modules/events, includes/ (Sequelize+sqlite),
            nodemodules/ (vendored deps proxy qua global.nodemodule), languages/, config.json,
            FastConfigFca.json, appstate.json (đọc ở mirai.js login flow legacy)
```

`npm ls fca-horizon-remake` → installed (`@vangbanlanhat/fca-unofficial@1.4.6`), runtime dep của root.

**Kết luận:** `fca-horizon-remake` là runtime dependency **hợp lệ của legacy bot** (`npm run legacy:start`), và **dead dependency đối với V2** (`npm start`). → Chờ Personal Transport hoạt động rồi **REMOVE** toàn bộ cluster legacy (mục 11), không remove một mình package.

Các dependency package.json **nghi vấn chỉ phục vụ legacy** (0 import trong src/): `fca-horizon-remake`, `caesar-salad`, `chem-eb`, `srod-v2`, `totp-generator`, `morse-decoder`, `bitly`, `tinyurl`, `turl`, `pastebin-api`, `lyrics-finder` (knowledge plugin dùng REST lyrics.ovh thay rồi), `fast-speedtest-api`, `simple-youtube-api`, `youtube-search-api`, `@distube/ytdl-core`, `gifencoder`, `figlet`, `request`, `sequelize`, `eval`, `jimp`, `moment*` (src dùng Intl), `canvas` (src dùng @napi-rs/canvas trực tiếp — alias giữ lại vì plugin không import 'canvas'), `sqlite`/`sqlite3` (src dùng node:sqlite) — **cần audit từng package bằng grep khi remove** (một số có thể src động `/utils`?).

## 11. Existing dead code (899 files git-tracked ngoài src)

| Cluster | Size | Trạng thái | Đề xuất |
|---|---|---|---|
| `modules/` (435 command + 18 event + data/cache) | ~910 file | chỉ legacy mirai.js dùng | REMOVE sau personal migration (một số đã port sang V2 plugins) |
| `nodemodules/` | vendored node_modules **commit vào git** | chỉ proxy `global.nodemodule` mirai.js | REMOVE (bị ignore nhưng đã track) |
| `includes/` (Sequelize, controllers, listen.js, **data.sqlite**) | 19 file + DB | legacy | REMOVE; **data.sqlite đang tracked → privacy risk (mục 12)** |
| `languages/`, `utils/log.js` (mirai dùng), `config.json`, `FastConfigFca.json`, `.replit*`, `appstate.json`, `index.js`, `lq.js`, `youtube.js`, `mirai.js` | root | legacy runtime | REMOVE sau khi decision final |
| `src/transport/` | 6 file | **orphan trong production** (chỉ test) | KEEP — là nền Phase 4/5. |
| `src/reliability/` | 5 file | **orphan trong production** (chỉ test) | KEEP + WIRE (Phase 9-14). |
| `MessageDeduplicator` trong parser | 1 class | hoạt động nhưng memory-only, trùng chức năng với `reliability/deduplication.ts` | REPLACE bằng bản DB-backed khi wire pipeline. |
| `OutgoingMessageQueue` (platform) vs `RequestQueue` (reliability) | 2 hệ queue song song | platform dùng, reliability orphan | REPLACE khi wire — RequestQueue đầy đủ hơn (priority, per-thread, maxAttempts, maxQueueSize). |
| `conversation.repository`, `message-history.repository`, `scheduled-job.repository` | wiring | zero caller | KEEP + WIRE pipeline. |
| `docs/` 13 file + `commands_raw.json` | stale từ trước | một số claim sai thực tế (README) | UPDATE sau migration. |

## 12. Existing security risks

| # | Severity | Finding | Evidence | Remediation |
|---|---|---|---|---|
| S1 | **CRITICAL** | **SECRET FOUND — Facebook session cookies commit vào Git** (`c_user`, `xs`, `datr`, `fr` — giá trị thật, không hiển thị ở đây) | File: `appstate.json` (root), commit từ `df8c2ea`, vẫn tracked dù `.gitignore` đã có `appstate.json` | (1) Thu hồi phiên ngay: logout all sessions / đổi password; (2) `git rm --cached appstate.json` + **purge lịch sử bằng git filter-repo**; (3) force-push với coordination; (4) CI secret-scan. |
| S2 | **HIGH** | `includes/data.sqlite` tracked — dữ liệu người dùng cá nhân (legacy bot DB) | `git ls-files` + header `SQLite format 3` | Cùng hướng purge Git history + cân nhắc xóa hẳn. |
| S3 | HIGH | `/pause`, `/resume` **không có xác thực** — bất kỳ ai gọi được HTTP | `app.ts:171-179` | Thêm admin token check hoặc bind localhost/dashboard auth. (Cố chí cũng phải làm kill switch thật.) |
| S4 | MEDIUM | Dev fallback encryption key khi thiếu `ENCRYPTION_KEY` | `transport/facebook/session.ts:32-38` | Fail-fast ở production mode; dev mới cho fallback + log WARN. |
| S5 | MEDIUM | `config.json` chứa token Graph `6628568379\|...` (Android client token công khai của Meta — **không phải user credential**, không tính là secret cá nhân) + `caeserPassword` | `config.json:157`, `:41` | REMOVE cùng cluster legacy, không cần rotate. |
| S6 | LOW | Logger redact paths chưa phủ: `c_user`, `xs`, `cookies[]` (mảng con của `StoredSession`) | `utils/logger.ts:6-21` redact `cookie`/`appstate` nhưng không `cookies`, `*.value` | Thêm path `cookies`, `**["c_user","xs"]` trước khi wire personal transport; log chỉ userId. |
| S7 | LOW | Không pin version nhiều deps (`"axios": ""`, `@miraipr0ject/assets: ""`...) | `package.json:25-77` | Ảnh hưởng legacy; khi prune sẽ dọn. |
| S8 | PASS ✅ | Không có `eval`/`exec`/shell trong `src/` (chỉ `mirai.js:7` legacy dùng `execSync` cho update flow cũ), không có file read theo user input trong src, webhook HMAC + timingSafeEqual, SQL qua prepared statements | grep toàn src | Giữ nguyên. |

**Không có** logic evasion trong src (không CAPTCHA bypass, không fingerprint/IP rotation) — đúng ranh giới Phase 13.

## 13. Existing incomplete features (tóm tắt)

1. Conversation session không persist (wiring sai) → restart mất hội thoại đa bước.
2. Reliability layer (queue priority/rate limiter/circuit breaker/dedup DB/health monitor kill-switch) — **code xong 100%, wire 0%**.
3. Incoming message không lưu DB → không có nền cho unsend-restore, reply context, AI history, audit.
4. Scheduler không restore `scheduled_jobs`.
5. Personal transport: skeleton (interfaces + AES session + fake) — **chưa có implementation kết nối Facebook thật** → không gửi được group chat, không reaction in/out, không getThread, không getUser data.
6. Kill switch `/pause` cosmetic; `!admin pause/resume` không tồn tại.
7. Plugin reload không có đường thật (chỉ unload/register thủ công, không enable/disable flag).
8. Reaction pipeline: parse bị drop, `ctx.react()` sender no-op, `handleReaction` legacy chưa port.
9. `mentions` không parse; `reply_to` không parse (type có, code bỏ).
10. Dashboard: `/queue` hardcode 0.

## 14. Migration plan (đề xuất, chờ duyệt trước khi code)

**Chiến lược:** giữ nguyên mọi thứ đã tốt; **WIRE trước, REMOVE sau.**

| Phase | Work | Files touched | Risk |
|---|---|---|---|
| **1. FIX WIRING (P0, nhỏ nhất, giá trị tức thì)** | Inject `SQLiteSessionStore` vào BotCore/SessionManager; `app.ts` nhận `--transport=page\|personal` factory; gate `isPaused` thật vào `botCore.processMessage`; `/queue` đọc state queue thật | bot.ts, app.ts | Thấp |
| **2. PIPELINE REWIRE** | Tách pipeline: TransportEvent → Parser → NormalizedMessage → **reliability/dedup (DB-backed, bảng `processed_events`)** → **message-history save** → CommandRouter → **ctx.reply tạo OutgoingAction → RequestQueue (thay OutgoingMessageQueue) → RateLimiter (global+thread) → CircuitBreaker wrap transport → sender**. Error classifier theo Phase 13 (errors.ts hiện có nền) | mới: `src/pipeline.ts`, `src/transport/registry.ts`; sửa: bot.ts, context.ts (reply→queue), sender.ts (giữ nguyên), app.ts | Trung bình — cần e2e test mới |
| **3. PERSONAL TRANSPORT** | `src/transport/facebook/personal/`: `FacebookPersonalTransport implements MessagingTransport` — API: login bằng SessionStore cookies (`c_user`/`xs`), fetch thread list/messages qua GraphQL endpoint, send via `message_send`, parse → NormalizedMessage; **thread model GROUP/USER**; reaction out; capability flags (`capabilities: Set` để mark unsupported, không fake). Session failure policy: AUTH_ERROR → **PAUSE + notify admin, không relogin loop**. Appstate Importer: `appstate.json[] → StoredSession` | mới hoàn toàn trong transport/facebook/personal + session-import.ts | Cao nhất — tách commit nhỏ: session-store hardening → importer → connect → read → send → threads → reaction |
| **4. GROUP CHAT ENGINE** | Wire `ctx.thread` + `isThreadAdmin` thật từ personal transport; parser populate group/DM; groupinfo hết placeholder; scheduler restore jobs; events join/leave/reaction qua EventRouter | parser/personal, bot.ts, event-router.ts | Trung bình |
| **5. DUAL-TRANSPORT COEXIST** | Page transport giữ nguyên, đăng ký qua `TransportRegistry`; env `TRANSPORT_MODE=page\|personal\|both`; `/status` expose transport state machine (Phase 15) | app.ts | Thấp |
| **6. SECURITY HARDENING** | S1/S2 purge git history (quyết định force-push); S3 auth `/pause`; S4 fail-fast key; S6 redact paths; secret-scan script | logger.ts, session.ts, app.ts, docs/SECURITY.md | Thủ tục |
| **7. LEGACY REMOVAL** | Xóa `mirai.js`, `index.js`, `modules/`, `includes/`, `nodemodules/`, `languages/`, `appstate.json`, `config.json`, `FastConfigFca.json`, `.replit*`, `lq.js`, `youtube.js`; prune package.json deps theo graph mục 10; `npm ls fca-horizon-remake` → empty | 899 file | Thấp sau khi Phase 3 xong (data cache `media_links.json`/`dhbc.json` đã port sang `src/data/plugins` trước đó) |
| **8. TESTS COMPLETION** | Restart test (kill→restore sessions/jobs — **bắt buộc pass sau Phase 1+3**), failure matrix (timeout/rate-limit/auth/dup/queue-overflow), load test qua pipeline thật với FakeTransport, docker build | tests/ | Trung bình |

**Invariant giữ nguyên tuyệt đối (Phase 45):** `src/core/`, `src/plugins/`, `src/repositories/`, `src/services/` — 0 import từ `platform/` hoặc `transport/` (đã đúng theo grep; CI nên enforce bằng lint rule).

**Quyết định cần user duyệt trước khi code:**
1. Purge git history S1/S2? (force-push public repo → ảnh hưởng fork nếu có)
2. Xóa 899 file legacy một commit hay giữ branch `legacy-mirai` tag?
3. Personal transport target: **MQTT/WebSocket listen** (realtime) hay **long-poll GraphQL** (đơn giản hơn, latency kém hơn) — hoặc cả hai sau?
4. `TRANSPORT_MODE=both` chạy đồng thời Page + Personal hay chọn 1?
