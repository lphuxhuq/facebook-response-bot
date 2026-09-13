# LEGACY CODEBASE AUDIT: FACEBOOK PERSONAL ACCOUNT & GROUP CHAT BOT

- **Repository**: `https://github.com/lphuxhuq/facebook-response-bot`
- **Scope**: Comprehensive Audit of Personal Facebook Account Automation & Group Chat Mechanics
- **Auditor**: Principal Software Architect & Lead Security Engineer
- **Date**: 2026-09-13
- **Classification**: DETAILED POST-MORTEM & TECHNICAL DEBT AUDIT

---

## 1. Runtime Lifecycle & Supervisor Architecture

The legacy system executes in a two-tier node process model:

```text
       [ index.js ] (Supervisor process)
            │ Spawns child_process.spawn("node", ["mirai.js"])
            ▼
       [ mirai.js ] (Worker process)
            ├── 1. Synchronously reads config.json, package.json
            ├── 2. Connects Sequelize SQLite (includes/database/index.js)
            ├── 3. Scans & dynamically requires modules/commands/ (435 files)
            ├── 4. Scans & dynamically requires modules/events/ (7 files)
            ├── 5. Reads appstate.json cookie jar into memory
            ├── 6. Calls login({ appState }, callback) via fca-horizon-remake
            ├── 7. Monkey-patches api.sendMessage to fall back to api.sendMessageMqtt
            └── 8. api.listenMqtt((err, event) => includes/listen.js)
```

### Critical Flaws Identified:
- **Supervisor Flaw (`index.js`)**: Spawns `mirai.js` using `{ shell: true }`. If `mirai.js` exits with code 1, it indefinitely restarts in an unthrottled loop, causing aggressive login attempts to Facebook and triggering instant checkpoint 282.
- **Express Port Binding in Supervisor**: Starts a barebones Express HTTP server on port 80/process.env.PORT purely to respond to UptimeRobot pings without any connection to the actual bot lifecycle.
- **Fatal Sync Execution**: `global.nodemodule` uses an ES6 Proxy intercepting `require()` calls and invoking synchronous `execSync("npm install " + package)` at runtime, freezing the Node.js event loop and opening an RCE vector.

---

## 2. Facebook Transport (FCA & Reverse-Engineered MQTT)

The legacy bot relies on `fca-horizon-remake` (a fork of `facebook-chat-api`):
- **Transport Medium**: Emulates browser sessions by replaying cookie jars (`appstate.json`) against Facebook's internal desktop website (`https://www.facebook.com`) and mobile touch endpoints (`https://m.facebook.com`).
- **Realtime Event Stream**: Connects via WebSockets/TLS to Facebook's edge MQTT brokers (`wss://edge-chat.facebook.com/chat`).
- **Message Dispatch Protocol**: Messages are sent via HTTP POST to GraphQL DocIDs or `/messaging/send/` endpoints, falling back to MQTT publish on failure.

### Transport Risks:
- Zero official SLA or stability; breaks whenever Meta modifies internal JSON structures or GraphQL schemas.
- Uncontrolled connection drops cause silent listener death.
- Re-connection logic in `fca-horizon-remake` spams login calls with stale cookies, tripping anti-abuse heuristics.

---

## 3. Login, Authentication & Session Store

- **Format**: Plaintext JSON array of cookie objects (`c_user`, `xs`, `fr`, `datr`, `sb`, `presence`, etc.) stored in `appstate.json`.
- **Security Exposure**:
  - Anyone with file read access possesses permanent full access to the personal Facebook account.
  - No encryption at rest (no AES, no secret key).
  - Stale cookies are neither invalidated nor refreshed safely.
- **V2 Remediation**:
  - `SessionStore` with AES-256-GCM encryption at rest using `SESSION_ENCRYPTION_KEY`.
  - Strict pause on `AUTH_ERROR` to prevent risky automated login loops.

---

## 4. Group Chat Handling

In Facebook Personal accounts, group chats are identified by a numeric `threadID` (typically 15-17 digits).
Legacy mechanisms:
- `api.getThreadInfo(threadID, callback)`: Fetches thread title, admin IDs, participant list, and message count.
- `api.changeNickname(nickname, threadID, participantID)`: Modifies user nickname in group.
- `api.removeUserFromGroup(userID, threadID)`: Kicks members (requires bot to be group admin).
- `api.addUserToGroup(userID, threadID)`: Adds users.
- `api.changeAdminStatus(threadID, targetID, true/false)`: Modifies thread admin status.

### Flaws in Group Chat Logic:
- `handleCommand.js` queries `Threads.getData(threadID)` without local in-memory caching, executing redundant SQLite read queries on every single message.
- Group member joins/leaves trigger unthrottled welcome/goodbye messages that spam Facebook endpoints and cause account rate-limits.

---

## 5. Direct Message (DM) Handling

- Legacy treats DMs identically to groups (`threadID == senderID`).
- Fails to distinguish between personal 1-on-1 private messaging and group threads, leading to broken commands (e.g. attempting to kick or change group settings inside a private DM).

---

## 6. Message Handling & Normalization

In `includes/listen.js`, incoming MQTT frames are loosely formatted:
- `event.type`: `"message"`, `"message_reply"`, `"message_reaction"`, `"event"`.
- `event.body`: Raw text string.
- `event.attachments`: Raw array of Facebook media objects.
- `event.mentions`: Raw object mapping user ID to tagged substring.

### Flaws:
- Commands parse strings manually with ad-hoc `.split(" ")` or regexes.
- No unified `NormalizedMessage` object existed; commands directly accessed raw platform fields.

---

## 7. Reaction Handling (`handleReaction`)

- Stored in-memory in `global.client.handleReaction = []`.
- When an MQTT `message_reaction` packet arrives, `listen.js` searches the array by `event.messageID`.
- Flaws: Ephemeral, destroyed upon restart, unevicted unbounded memory leak.

---

## 8. Reply Handling (`handleReply`)

- Stored in-memory in `global.client.handleReply = []`.
- When an MQTT `message_reply` packet arrives, searches by `event.messageReply.messageID`.
- Flaws: Concurrent replies corrupt state; process restart terminates active quiz/registration sessions.

---

## 9. Scheduler & Background Jobs

- Arbitrary `setInterval` and `node-cron` timers started inside individual command files (e.g. `checktt.js`, `autosend.js`).
- Timers never persist across restarts; pending reminders are completely lost when the bot reboots.

---

## 10. Commands Inventory

- **435 Command Files** in `modules/commands/`.
- Majority are duplicate copy-paste scripts fetching images from random third-party endpoints.
- 93 commands require elevated permissions (`hasPermssion: 1` for Group Admin, `2` for Bot Admin).
- 63 commands use interactive `handleReply`.
- 12 commands use `handleReaction`.

---

## 11. Events Inventory

7 Active Event Handlers in `modules/events/`:
1. `adminUpdate.js`: Watches for group admin promotions/demotions.
2. `antijoin.js`: Kicks newly joined users if group lock is active.
3. `antiout.js`: Re-adds users who leave group chat.
4. `autosetname.js`: Sets predetermined nickname prefixes for new joiners.
5. `chongcuopbox.js`: Anti-group-theft; reclaims admin privileges.
6. `joinNoti.js`: Welcome message with image/gif.
7. `leaveNoti.js`: Goodbye message.

---

## 12. External APIs & Unreliable Dependencies

Audit reveals:
- Over 20 personal Vercel/Heroku API domains that have gone permanently offline (HTTP 404/502).
- Zero timeout configurations on HTTP requests (allowing requests to hang forever).
- No circuit breaker or rate limiting for third-party calls.

---

## 13. Persistence & Database

- Sequelize v6 + SQLite (`includes/database/data.sqlite`).
- Columns `Users.data`, `Threads.data`, `Currencies.data` store unvalidated JSON strings.
- Concurrent writes regularly cause `SQLITE_BUSY` database lock crashes due to missing WAL mode.

---

## 14. Security Vulnerabilities

1. **RCE via `global.nodemodule`**: Synchronous shell command execution (`execSync`).
2. **Arbitrary Code Evaluation**: `eval.js` evaluates raw user input via `eval()`.
3. **Shell Command Execution**: `cmd.js` executes raw user strings via `child_process.exec`.
4. **Credential Exposure**: Plaintext cookies in `appstate.json`.
5. **SSRF**: Media commands download arbitrary URLs provided by users without network boundary checks.

---

## 15. Known Failure Points & Post-Mortem Matrix

| Failure Mode | Legacy Behavior | Consequence | V2 Solution |
| :--- | :--- | :--- | :--- |
| **Session Invalidation** | Endless restart loop in `index.js` | Account checkpointed / IP banned | Immediate `AUTH_ERROR` -> `PAUSE` |
| **Facebook Rate Limit** | Synchronous burst requests | Temporary ban on sending messages | `RateLimiter` + `OutgoingMessageQueue` |
| **Process Crash** | In-memory `handleReply` wiped | All active multi-step sessions lost | SQLite `conversation_sessions` with TTL |
| **DB Lock Concurrency** | Unhandled SQLite Busy exception | Entire process dies | SQLite WAL mode + Transactional Repositories |
| **Dead Third-Party API** | Uncaught Promise Rejection | Message processing hangs | Timeout bounds + CircuitBreaker |

---

## 16. Technical Debt Summary

The legacy codebase represents an unmaintainable accumulation of legacy PHP-era conventions ported to Node.js callbacks:
- 100% reliant on global mutable state.
- Zero unit tests or contract tests.
- High risk of permanent account bans due to unthrottled requests.
- Complete absence of layered architecture.
