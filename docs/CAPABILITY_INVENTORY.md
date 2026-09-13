# CAPABILITY INVENTORY & MIGRATION SPECIFICATION

- **Target Architecture**: Facebook Personal Account + Group Chat Bot V2
- **Inventory Date**: 2026-09-13
- **Classification Standard**: P0 (Core), P1 (Important), P2 (Optional), P3 (Deprecated)

---

## 1. Inventory Matrix

| Feature | Legacy File | Legacy API | Input | Output | State Requirements | Permissions | Group / DM | External Dep | Risk Factor | V2 Replacement | Priority | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Transport Connection** | `mirai.js` | `login()`, `listenMqtt()` | `appstate.json` | MQTT stream | `global.client` | None | Both | `fca-horizon-remake` | Critical (Ban) | `src/transport/facebook/` | P0 | MIGRATED |
| **Ping / Latency** | `modules/commands/ping.js` | `api.sendMessage` | `!ping` | Latency (ms) | None | USER | Both | None | Low | `src/plugins/core/commands/ping.ts` | P0 | VERIFIED |
| **Help / Menu** | `modules/commands/help.js` | `api.sendMessage` | `!help [cmd]` | Command list | PluginRegistry | USER | Both | None | Low | `src/plugins/core/commands/help.ts` | P0 | VERIFIED |
| **Uptime / System** | `modules/commands/uptime.js` | `api.sendMessage` | `!uptime` | RAM/OS info | Process metrics | USER | Both | `systeminformation` | Low | `src/plugins/core/commands/uptime.ts` | P0 | VERIFIED |
| **Rules / Guidelines** | `modules/commands/rules.js` | `api.sendMessage` | `!rules` | Policy text | None | USER | Both | None | Low | `src/plugins/core/commands/rules.ts` | P0 | VERIFIED |
| **Admin Controls** | `modules/commands/admin.js` | `api.sendMessage` | `!admin <subcmd>` | Role status | `UserRepository` | OWNER, ADMIN | Both | None | Medium | `src/plugins/admin/commands/admin.ts` | P0 | VERIFIED |
| **Thread Info** | `modules/commands/boxinfo.js` | `api.getThreadInfo` | `!boxinfo` | Member count | `ConversationRepository` | USER | GROUP_ONLY | None | Low | `src/plugins/group/commands/groupinfo.ts` | P0 | MIGRATED |
| **Nickname Management** | `modules/commands/setname.js` | `api.changeNickname` | `!setname <nick>` | Confirmation | None | GROUP_ADMIN | GROUP_ONLY | None | Medium | `src/plugins/group/commands/setname.ts` | P1 | MIGRATED |
| **Member Join Event** | `modules/events/joinNoti.js` | MQTT event | Join event | Welcome msg | `thread_settings` | None | GROUP_ONLY | Canvas / Assets | Medium | `src/plugins/group/events/join.ts` | P1 | MIGRATED |
| **Member Leave Event** | `modules/events/leaveNoti.js` | MQTT event | Leave event | Goodbye msg | `thread_settings` | None | GROUP_ONLY | None | Medium | `src/plugins/group/events/leave.ts` | P1 | MIGRATED |
| **Group Settings** | `modules/commands/setting.js` | None | `!setting <opt>` | Updated cfg | `thread_settings` table | GROUP_ADMIN | GROUP_ONLY | None | Low | `src/plugins/group/commands/settings.ts` | P1 | MIGRATED |
| **Interactive Quiz** | `modules/commands/dhbc.js` | `handleReply` | `!quiz` -> `[A|B|C|D]` | Score / Coins | `SessionManager` (TTL) | USER | Both | None | Low | `src/plugins/entertainment/commands/quiz.ts` | P1 | VERIFIED |
| **Bank / Economy** | `modules/commands/bank.js` | None | `!bank <bal|pay>` | Coins balance | `UserRepository` (Atomic) | USER | Both | None | Low | `src/plugins/economy/commands/bank.ts` | P1 | VERIFIED |
| **AI Chatbot** | `modules/commands/sim.js` | External HTTP | `!ai <prompt>` | AI response | Context window | USER | Both | OpenAI / Gemini | Low | `src/plugins/ai/commands/ai.ts` | P1 | VERIFIED |
| **Translation** | `modules/commands/trans.js` | Google Translate | `!trans <text>` | Translated text | None | USER | Both | Google Translate | Low | `src/plugins/utility/commands/translate.ts` | P1 | VERIFIED |
| **Weather Forecast** | `modules/commands/weather.js` | OpenWeatherMap | `!weather <city>` | Weather report | None | USER | Both | OpenWeather API | Low | `src/plugins/utility/commands/weather.ts` | P1 | VERIFIED |
| **Safe Calculator** | `modules/commands/math.js` | `eval()` | `!calc <expr>` | Result | None | USER | Both | None | Low (Safe V2) | `src/plugins/utility/commands/calc.ts` | P2 | VERIFIED |
| **Dice / Coinflip** | `modules/commands/taixiu.js` | None | `!dice [coin]` | RNG result | None | USER | Both | None | Low | `src/plugins/entertainment/commands/dice.ts` | P2 | VERIFIED |
| **Quotes / Sayings** | `modules/commands/thathinh.js` | None | `!quote` | Text quote | None | USER | Both | None | Low | `src/plugins/utility/commands/quote.ts` | P2 | VERIFIED |
| **Anti-out (Force Re-add)**| `modules/events/antiout.js` | `api.addUserToGroup` | User leaves | Re-add call | None | GROUP_ADMIN | GROUP_ONLY | None | High (Abuse) | Deprecated / Configurable alert | P3 | DEPRECATED |
| **Anti-join Lock** | `modules/events/antijoin.js` | `api.removeUser` | New member | Kick member | `thread_settings` | GROUP_ADMIN | GROUP_ONLY | None | High (Abuse) | Managed Group Protection | P3 | DEPRECATED |
| **Arbitrary Eval** | `modules/commands/eval.js` | `eval()` | JS snippet | Eval result | Global scope | OWNER | Both | None | Critical (RCE) | REMOVED (Zero eval in V2) | P3 | REMOVED |
| **Arbitrary Shell Exec** | `modules/commands/cmd.js` | `child_process.exec` | Shell command | stdout | Host OS | OWNER | Both | None | Critical (RCE) | REMOVED | P3 | REMOVED |
| **Dynamic NPM Installer**| `mirai.js` (Proxy) | `execSync` | Missing pkg | Installed pkg | Global system | None | None | npm | Critical (RCE) | REMOVED (Pre-bundled TS) | P3 | REMOVED |

---

## 2. Capability Scope Rules

1. **DM vs Group Differentiation**:
   - Every incoming event is strictly normalized into a `NormalizedMessage` containing `threadId`, `type` (`GROUP` or `USER`), and participant metadata.
   - Commands specify `scope?: 'DM' | 'GROUP' | 'BOTH'`. Commands requiring group context are rejected if executed in private DM.
2. **Interactive Reply/Reaction**:
   - `global.client.handleReply` and `handleReaction` are completely replaced with SQLite-backed `SessionManager`.
   - Multi-step dialogs survive process crashes and redeployments.
3. **Safety & Reliability**:
   - All outgoing calls are queued via `OutgoingMessageQueue` with `RateLimiter` and `CircuitBreaker`.
   - On authentication failure or Facebook session revocation, the transport transitions to `PAUSED` without automated retry loops.
