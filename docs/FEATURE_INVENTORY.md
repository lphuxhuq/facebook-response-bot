# FEATURE INVENTORY & MIGRATION CATALOG

- **Audited Repository**: `facebook-response-bot`
- **Total Commands Identified**: 435 legacy modules
- **Total Event Handlers Identified**: 7 legacy modules
- **Target Platform**: Meta Messenger Official API (Page Webhook + Graph API v21.0)

---

## 1. Categorization & Prioritization Methodology

Features are classified according to architectural impact, user value, security, and compatibility with Meta's official Messenger Platform policies:

- **P0 (Core)**: Essential framework features, core navigation, system health, administration, and runtime diagnostics.
- **P1 (Important / Interactive)**: High-traffic features, interactive conversation flows (`SessionManager`), economy/banking, AI chat assistants, translations, and utilities.
- **P2 (Optional Entertainment & Media)**: Casual games, safe entertainment, media lookups, QR code generators, calculators, and informational commands.
- **P3 (Obsolete / Incompatible / Deprecated)**:
  - Commands relying on Facebook user account privileges (e.g. kicking group members, auto-readding leaving members, anti-theft box controls).
  - Unsafe administrative backdoors (`eval`, `cmd` shell execution).
  - Deprecated/illegal scraping modules (NSFW scrapers, copyright-infringing media endpoints).

---

## 2. Priority P0: Core & System Framework

| Feature | Legacy Source | Type | Dependencies / APIs | State / DB Needs | Permissions | Priority | V2 Replacement | Test Strategy | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ping** | `modules/commands/ping.js` | Command | None | None | USER | P0 | `src/plugins/core/commands/ping.ts` | Unit + Latency test | Migrated |
| **help** / **menu** | `modules/commands/help.js`, `menu.js` | Command | None | PluginRegistry | USER | P0 | `src/plugins/core/commands/help.ts` | Unit + Category test | Migrated |
| **info** / **botinfo** | `modules/commands/info.js` | Command | System metrics | System metrics | USER | P0 | `src/plugins/core/commands/info.ts` | Unit (Mock OS) | Migrated |
| **admin** | `modules/commands/admin.js` | Command | None | `PermissionRepository` | OWNER, ADMIN | P0 | `src/plugins/admin/commands/admin.ts` | Unit + RBAC test | Migrated |
| **uptime** | `modules/commands/uptime.js` | Command | Process uptime | Process uptime | USER | P0 | `src/plugins/core/commands/uptime.ts` | Unit test | Migrated |
| **rules** | `modules/commands/rules.js` | Command | None | `SettingsRepository` | USER | P0 | `src/plugins/core/commands/rules.ts` | Unit test | Migrated |
| **healthcheck** | `index.js` (Express endpoint) | HTTP API | None | Bot runtime state | Public | P0 | `GET /health`, `GET /ready` | Integration test | Migrated |
| **webhook** | `includes/listen.js` (MQTT) | Transport | FCA | Webhook Secret, HMAC | Meta | P0 | `src/platform/facebook/webhook.ts` | Contract + Signature test | Migrated |

---

## 3. Priority P1: Important & Interactive Features

| Feature | Legacy Source | Type | Dependencies / APIs | State / DB Needs | Permissions | Priority | V2 Replacement | Test Strategy | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ai** / **sim** / **nino** | `modules/commands/sim.js`, `nino.js` | Interactive | External AI API | `SessionRepository` | USER | P1 | `src/plugins/ai/commands/ai.ts` + `AIService` | Mock AI Provider test | Migrated |
| **bank** / **economy** | `modules/commands/bank.js`, `work.js` | Interactive | None | `UserRepository`, `Currencies` | USER | P1 | `src/plugins/economy/commands/bank.ts` | Transactional DB test | Migrated |
| **translate** / **trans** | `modules/commands/trans.js` | Command | Google Translate / Libre | None | USER | P1 | `src/plugins/utility/commands/translate.ts` | Unit (Mock Translation) | Migrated |
| **weather** | `modules/commands/weather.js` | Command | OpenWeather API | None | USER | P1 | `src/plugins/utility/commands/weather.ts` | Unit (Mock Weather) | Migrated |
| **shortlink** | `modules/commands/shortlink.js` | Command | URL shortener | None | USER | P1 | `src/plugins/utility/commands/shortlink.ts` | Unit (URL validation) | Migrated |
| **quiz** / **dhbc** | `modules/commands/dhbc.js` | Interactive Reply | In-memory `handleReply` | `SessionManager` (TTL 120s) | USER | P1 | `src/plugins/entertainment/commands/quiz.ts` | Session TTL + Reply test | Migrated |

---

## 4. Priority P2: Optional Utilities & Entertainment

| Feature | Legacy Source | Type | Dependencies / APIs | State / DB Needs | Permissions | Priority | V2 Replacement | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **quote** | `modules/commands/thathinh.js`, `cadao.js` | Command | Local curated JSON | None | USER | P2 | `src/plugins/utility/commands/quote.ts` | Migrated |
| **coinflip** / **dice** | `modules/commands/taixiu.js`, `roll.js` | Command | Local RNG | `UserRepository` (Optional balance) | USER | P2 | `src/plugins/entertainment/commands/dice.ts` | Migrated |
| **qrcode** | `modules/commands/qr.js` | Command | QR generator | None | USER | P2 | `src/plugins/utility/commands/qrcode.ts` | Migrated |
| **math** / **calc** | `modules/commands/math.js` | Command | Safe Math evaluator | None | USER | P2 | `src/plugins/utility/commands/calc.ts` | Migrated |
| **random-image** | `modules/commands/cosplay.js`, etc. | Command | Unsplash / Curated CDN | None | USER | P2 | `src/plugins/utility/commands/image.ts` | Migrated |

---

## 5. Priority P3: Obsolete / Incompatible with Meta Official API

| Feature | Legacy Source | Reason for Deprecation / Replacement | Status |
| :--- | :--- | :--- | :--- |
| **antiout** | `modules/events/antiout.js` | **LEGACY CAPABILITY NOT AVAILABLE IN OFFICIAL API**: Meta Pages cannot forcefully re-add users who left private user groups. | REMOVED |
| **antijoin** | `modules/events/antijoin.js` | **LEGACY CAPABILITY NOT AVAILABLE IN OFFICIAL API**: Meta Pages cannot monitor or reject join requests in user group chats. | REMOVED |
| **chongcuopbox** | `modules/events/chongcuopbox.js` | **LEGACY CAPABILITY NOT AVAILABLE IN OFFICIAL API**: Meta Pages cannot alter user group administration roles. | REMOVED |
| **eval** | `modules/commands/eval.js` | **CRITICAL SECURITY RISK**: Remote Code Execution (RCE) via `eval()`. | REMOVED |
| **cmd** | `modules/commands/cmd.js` | **CRITICAL SECURITY RISK**: Arbitrary shell command execution via `child_process.exec`. | REMOVED |
| **pornlist / nsfw** | `modules/commands/cache/pornlist.txt` | **SECURITY & POLICY VIOLATION**: Violates Meta Community Standards and adds 64.5 MB bloat. | REMOVED |
| **appstate login** | `mirai.js`, `appstate.json` | **VIOLATION OF META TOS**: Replaced with official Webhook & Page Access Token. | REMOVED |
