# LEGACY CODEBASE AUDIT REPORT: facebook-response-bot (V1)

- **Audited Repository**: `https://github.com/lphuxhuq/facebook-response-bot`
- **Branch**: `remake-and-test`
- **Auditor**: Principal Software Architect & Security Lead
- **Date**: 2026-09-13
- **Classification**: COMPREHENSIVE ARCHITECTURAL & SECURITY POST-MORTEM

---

## 1. Architecture Overview

The legacy bot is built on a fork of the "MiraiBot" / "Horizon" Messenger bot framework, originally developed around 2020–2022 to automate personal Facebook user accounts via unofficial internal Facebook endpoints and reverse-engineered MQTT/HTTP protocols.

```text
                                [ Facebook User Account ]
                                            │ (Unofficial HTTP/MQTT)
                                            ▼
                               [ fca-horizon-remake ]
                                            │
                                            ▼
                                     [ mirai.js ]
                                            │
    ┌───────────────────────────────┴───────────────────────────────┐
    ▼                                                               ▼
[ global.client ] (In-memory god object)                 [ includes/listen.js ] (Event dispatcher)
    ├── commands (435 modules)                                      ├── handleCommand
    ├── events (7 modules)                                          ├── handleReply
    ├── handleReply (Ephemeral array)                               ├── handleReaction
    └── nodemodule (Dynamic Proxy + sync npm install)              └── handleEvent
                                                                    │
                                                                    ▼
                                                   [ Sequelize SQLite / JSON files ]
```

### Core Architecture Flaws:
1. **Unofficial Reverse-Engineered Transport**: The system completely depends on `fca-horizon-remake` to emulate browser cookies (`appstate.json`), directly violating Meta Terms of Service and leading to permanent account bans (checkpoint 282 / 956).
2. **Global Mutable State God Object**: State is managed via `global.client`, `global.data`, `global.config`, and `global.nodemodule`. Any module can mutate state across the application, leading to severe concurrency race conditions and non-deterministic behavior.
3. **Implicit Sync Dependencies**: `global.nodemodule` uses an ES6 `Proxy` that intercepts `require()` calls and executes synchronous shell commands (`child_process.execSync("npm --package-lock false --save install ...")`) inside the running process, blocking the Node event loop and introducing Remote Code Execution (RCE) vectors.
4. **Tightly Coupled Business Logic**: Every single command (`modules/commands/*.js`) accepts the raw `api` object provided by FCA. Commands directly invoke `api.sendMessage`, `api.changeAdminStatus`, `api.setMessageReaction`, etc., preventing any multi-platform adoption or unit testing without mocking thousands of unofficial API behaviors.

---

## 2. Entry Points

The legacy application has two primary entry points:

### 2.1 `index.js` (Process Supervisor Wrapper)
- Spawns `mirai.js` using `child_process.spawn("node", ["--trace-warnings", "--async-stack-traces", "mirai.js"], { cwd: __dirname, stdio: "inherit", shell: true })`.
- Implements a basic auto-restart loop on exit code `1`.
- Starts a minimal Express HTTP ping server on `process.env.PORT || 80` serving `"Duy Khánh Vẫn Bất Tử Nhé"` intended for free hosting platforms (e.g. Replit, Glitch, UptimeRobot).

### 2.2 `mirai.js` (Bot Bootstrap)
- Initializes global structures: `global.client`, `global.data`, `global.config`, `global.utils`, `global.nodemodule`.
- Loads configuration from `config.json`.
- Establishes connection to SQLite using Sequelize in `includes/database/index.js`.
- Scans and dynamically requires all files in `modules/commands/` and `modules/events/`.
- Attempts authentication with FCA by reading `appstate.json` via `login({ appState }, (err, api) => ...)`.
- Monkey-patches `api.sendMessage` to fall back to `api.sendMessageMqtt` if the HTTP send fails.
- Attaches the event listener via `api.listenMqtt((err, event) => listener(event))`.

---

## 3. Runtime Lifecycle & Event Loop

1. **Bootstrap Phase**:
   - Synchronously reads JSON configuration files from disk.
   - Sequelize syncs SQLite models (`Threads`, `Users`, `Currencies`).
   - Dynamic scanning of 435 command files and 7 event files into in-memory Maps (`global.client.commands`).
2. **Authentication Phase**:
   - `fca-horizon-remake` deserializes cookie jars from `appstate.json`.
   - Sends requests to Facebook internal endpoints (`/login/device-based/regular/login/`, `/pull/`, etc.).
   - Establishes persistent WebSocket / MQTT connection to `wss://edge-chat.facebook.com/chat`.
3. **Listen / Dispatch Loop (`includes/listen.js`)**:
   - Incoming MQTT frames parsed into event objects (`message`, `message_reply`, `message_reaction`, `event`, `typ`).
   - Dispatches in parallel to:
     - `handleCommand({ api, event, client, __GLOBAL, Users, Threads, Currencies })`
     - `handleReply({ api, event, client, __GLOBAL, Users, Threads, Currencies })`
     - `handleReaction({ api, event, client, __GLOBAL, Users, Threads, Currencies })`
     - `handleEvent({ api, event, client, __GLOBAL, Users, Threads, Currencies })`
4. **Shutdown / Crash Handling**:
   - Unhandled rejections and exceptions are logged, but frequently trigger process termination or deadlock in `execSync`.
   - No graceful shutdown hooks (`SIGINT` / `SIGTERM`) exist to cleanly close database connections or save in-flight sessions.

---

## 4. Facebook Integration (Unofficial FCA vs Meta API)

| Property | Legacy (V1) | Official Meta API (Target V2) |
| :--- | :--- | :--- |
| **Transport** | Web-scraping, Cookie jar (`appstate.json`), Reverse-engineered MQTT | Official HTTPS Webhook + Graph API v21.0 |
| **Identity Type** | Personal Facebook Profile (Illegal automation) | Verified Facebook Page + System User Token |
| **Stability** | Extremely brittle; breaks with Facebook DOM/Header changes | Highly stable, versioned SLA backed by Meta |
| **Security Risk** | Account takeover, credential theft, session hijacking | Scoped OAuth2 bearer tokens, HMAC-SHA256 signature verification |
| **Group Support** | Arbitrary Messenger group chats | Page-to-User direct messaging & Page-managed inbox |
| **Rate Limits** | Undocumented, triggers silent Facebook checkpoints | Explicit `Usage` headers, documented Graph API tier limits |

### Legacy API Monkey-Patching in `mirai.js`:
```javascript
// From mirai.js lines 270-282
const oldSendMessage = api.sendMessage;
api.sendMessage = function (message, threadID, callback, messageID) {
    return oldSendMessage(message, threadID, (err, info) => {
        if (err) {
            return api.sendMessageMqtt(message, threadID, callback, messageID);
        }
        if (callback) return callback(err, info);
    }, messageID);
};
```
This brittle fallback mechanism masks underlying authentication or rate-limiting errors.

---

## 5. Command System Analysis

- **Total legacy commands**: 435 files in `modules/commands/`.
- **Structure**:
  ```javascript
  module.exports.config = {
      name: "ping",
      version: "1.0.0",
      hasPermssion: 0, // 0: User, 1: Group Admin, 2: Bot Admin
      credits: "...",
      description: "...",
      commandCategory: "tiện ích",
      usages: "[text]",
      cooldowns: 5,
      dependencies: { "axios": "" }
  };
  module.exports.run = async function({ api, event, args, Users, Threads, Currencies, permssion }) { ... };
  ```
- **Findings**:
  - `hasPermssion` is typo-ridden (`hasPermssion` vs `permission`) and hardcoded per file.
  - Commands directly parse raw strings using `event.body.split(" ")`.
  - 175 commands declare a `dependencies` object which triggers dynamic `npm install` on first load.
  - Over 50 commands are redundant image-fetchers downloading from dead personal cloud APIs or NSFW sources.
  - Lack of type safety: Any runtime error crashes the entire message handler.

---

## 6. Events Analysis

Located in `modules/events/`:
- `adminUpdate.js`: Watches for group admin promotion/demotion.
- `antijoin.js`: Kicks newly joined users if anti-join lock is enabled.
- `antiout.js`: Re-adds users who leave the group chat.
- `autosetname.js`: Automatically sets nicknames for users joining threads.
- `chongcuopbox.js`: Anti-group-theft; reclaims admin status if unauthorized users attempt to take over.
- `joinNoti.js`: Sends welcome messages and media to new members.
- `leaveNoti.js`: Sends goodbye notifications.
- `log.js`: System event logging.

> [!WARNING]
> **Official Meta Page API Limitation**:
> Features like `antiout`, `chongcuopbox`, and arbitrary group member removal are **not supported** by the official Meta Graph API because a Facebook Page cannot join private user group chats as a regular member. These commands must be categorized as `LEGACY CAPABILITY NOT AVAILABLE IN OFFICIAL API`.

---

## 7. Reply & Reaction Handling (`handleReply` & `handleReaction`)

- **Mechanism**:
  - In command execution: `global.client.handleReply.push({ name: this.config.name, messageID: info.messageID, author: event.senderID, ...customData })`.
  - When a user replies to any message, `includes/listen.js` searches `global.client.handleReply` by `event.messageReply.messageID`.
  - If a match is found, invokes `command.handleReply({ api, event, handleReply, ... })`.
- **Severe Flaws**:
  - **Memory Leak**: The `global.client.handleReply` array has no automated eviction or TTL. It grows unboundedly until process restart.
  - **Restart Volatility**: Whenever the process restarts or crashes, all active conversations and multi-step dialogs are instantly destroyed.
  - **No Concurrency Isolation**: Concurrent replies to the same message can trigger duplicate runs and state corruption.

---

## 8. Scheduling & Background Jobs

- In `mirai.js`, periodic timers and `node-cron` were loosely registered.
- Commands like `checktt.js` (activity tracking) and `autosend.js` create arbitrary `setInterval` loops inside module code.
- No unified job scheduler or persistent job table exists; timer callbacks hold references to stale socket connections.

---

## 9. External Services & APIs

Audit reveals extensive reliance on uncontrolled, ephemeral, third-party endpoints:
1. **Dead Domain Endpoints**: Multiple APIs hosted on temporary free domains (Heroku, Vercel personal apps, ngrok) are offline, causing unhandled promise rejections.
2. **Direct Unchecked HTTP Calls**: Libraries like `axios`, `request`, and `node-fetch` are invoked without timeout parameters or retry backoffs.
3. **Hardcoded Tokens / Secret Leaks**: Several command files contain embedded tokens, exposed API keys, or raw personal URLs.

---

## 10. Database & State Persistence

- **Database Engine**: SQLite (`includes/database/data.sqlite`).
- **ORM**: Sequelize v6.
- **Models**:
  - `Users`: `userID`, `name`, `gender`, `data` (Text/JSON).
  - `Threads`: `threadID`, `threadName`, `adminIDs`, `data` (Text/JSON).
  - `Currencies`: `userID`, `money`, `exp`, `data` (Text/JSON).
- **Flaws**:
  - All complex metadata is shoved into an unstructured JSON string in the `data` column without schema validation.
  - Race conditions in `Currencies.increaseMoney` / `decreaseMoney` due to lack of transactional locking.
  - File-based persistence in `modules/commands/cache/*.json` and `modules/commands/data/*.json` written directly with `fs.writeFileSync`, causing file corruption if interrupted.

---

## 11. Configuration & Secrets

- Root configuration is stored in `config.json`.
- Contains:
  - `ADMINBOT`: Array of Facebook profile IDs.
  - `PREFIX`: String trigger.
  - `BOTNAME`: String bot identifier.
  - `DATABASE`: Path to SQLite database.
- Missing `.env` integration: Developers frequently commit secrets and `appstate.json` directly into git repositories.

---

## 12. Security Vulnerabilities Identified

1. **Remote Code Execution (RCE) via `global.nodemodule`**:
   - Intercepts missing packages and calls `execSync("npm install " + package)`. Any untrusted input reaching `require()` can execute arbitrary shell commands.
2. **Credential Theft via `appstate.json`**:
   - Plaintext Facebook session cookies stored on disk. Anyone with read access to the repo can seize full control of the Facebook account.
3. **Command Injection & Eval**:
   - Admin command `eval.js` evaluates arbitrary JavaScript strings in the process global scope.
   - Admin command `cmd.js` passes unvalidated strings directly to `child_process.exec`.
4. **Path Traversal**:
   - File downloaders and cache readers concatenate user-supplied input into filesystem paths without `path.normalize` / safe directory bounds checking.
5. **SSRF (Server-Side Request Forgery)**:
   - Media download commands download any URL passed by the user without IP filtering (allowing requests to `http://169.254.169.254` or local network addresses).

---

## 13. Dependency Tree Audit

- Total packages listed in `package.json`: 71 dependencies.
- Heavily bloated with duplicate/deprecated libraries:
  - `request` (deprecated since 2020) alongside `axios`, `node-fetch`, and `got`.
  - `moment` alongside `moment-timezone`.
  - Massive Canvas & graphics binaries (`canvas`, `jimp`, `@jimp/plugin-print`).
  - Deprecated crypto/hashing packages (`crypto-js`, `base-64`).
- Unpinned versions causing dependency resolution failures on modern Node.js versions (v20+).

---

## 14. Technical Debt Summary

1. Monolithic god functions spanning 500+ lines with deeply nested callbacks.
2. Over 30 variations of Vietnam-specific humor and random image fetchers with identical logic copied across separate files.
3. Non-standard naming conventions (`hasPermssion`, `dependecies`).
4. Absence of automated test suites (zero unit or integration tests).
5. Heavy binary files checked into git history:
   - `modules/commands/cache/pornlist.txt` (64.5 MB)
   - `ArialUnicodeMS.ttf` (22.2 MB)

---

## 15. Known Failure Points

| Failure Point | Trigger | Legacy Consequence | V2 Mitigation |
| :--- | :--- | :--- | :--- |
| **Facebook Checkpoint** | Facebook bot detection detects automated user account | Entire bot dies; account banned | Official Meta Webhooks + Graph API |
| **Dead External API** | Third-party endpoint unreachable | Unhandled crash / infinite wait | Circuit breaker, timeout, fallback mock |
| **Process Crash** | Unhandled exception in command | All active user reply sessions lost | Persistent SQLite sessions with TTL |
| **Sync `npm install`** | Command requires missing dependency | Event loop completely frozen | Pre-bundled, typed modules with strict boundaries |
| **Concurrent DB writes** | Multiple commands update currency | SQLite database locked (`SQLITE_BUSY`) | WAL mode, connection pooling, transactional ORM |
