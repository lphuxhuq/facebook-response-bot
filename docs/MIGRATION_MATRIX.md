# LEGACY MIGRATION MATRIX

Status Codes:
- `LEGACY`: Original legacy code in `modules/commands/` or `modules/events/`.
- `MIGRATING`: Currently being rewritten/implemented for V2.
- `MIGRATED`: Fully implemented in V2 with TypeScript and unit tests.
- `VERIFIED`: Verified through end-to-end integration and contract tests.
- `DEPRECATED`: Incompatible with official Meta API or replaced by superior architecture.
- `REMOVED`: Explicitly deleted or excluded from V2 runtime due to security/policy violations.

---

## Migration Tracker

| Module / Feature | Legacy Path | V2 Target Path | Priority | Status | Verification Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ping** | `modules/commands/ping.js` | `src/plugins/core/commands/ping.ts` | P0 | MIGRATED | `tests/plugins/core/ping.test.ts` |
| **help** / **menu** | `modules/commands/help.js` | `src/plugins/core/commands/help.ts` | P0 | MIGRATED | `tests/plugins/core/help.test.ts` |
| **info** / **uptime** | `modules/commands/uptime.js` | `src/plugins/core/commands/uptime.ts` | P0 | MIGRATED | `tests/plugins/core/uptime.test.ts` |
| **admin** | `modules/commands/admin.js` | `src/plugins/admin/commands/admin.ts` | P0 | MIGRATED | `tests/plugins/admin/admin.test.ts` |
| **rules** | `modules/commands/rules.js` | `src/plugins/core/commands/rules.ts` | P0 | MIGRATED | `tests/plugins/core/rules.test.ts` |
| **sim** / **nino** / **ai** | `modules/commands/sim.js` | `src/plugins/ai/commands/ai.ts` | P1 | MIGRATED | `tests/plugins/ai/ai.test.ts` |
| **bank** / **economy** | `modules/commands/bank.js` | `src/plugins/economy/commands/bank.ts` | P1 | MIGRATED | `tests/plugins/economy/economy.test.ts` |
| **translate** / **trans** | `modules/commands/trans.js` | `src/plugins/utility/commands/translate.ts` | P1 | MIGRATED | `tests/plugins/utility/translate.test.ts` |
| **weather** | `modules/commands/weather.js` | `src/plugins/utility/commands/weather.ts` | P1 | MIGRATED | `tests/plugins/utility/weather.test.ts` |
| **math** / **calc** | `modules/commands/math.js` | `src/plugins/utility/commands/calc.ts` | P2 | MIGRATED | `tests/plugins/utility/calc.test.ts` |
| **quote** / **cadao** | `modules/commands/thathinh.js` | `src/plugins/utility/commands/quote.ts` | P2 | MIGRATED | `tests/plugins/utility/quote.test.ts` |
| **quiz** / **dhbc** | `modules/commands/dhbc.js` | `src/plugins/entertainment/commands/quiz.ts` | P1 | MIGRATED | `tests/plugins/entertainment/quiz.test.ts` |
| **antiout** | `modules/events/antiout.js` | N/A | P3 | DEPRECATED | Meta Graph API limitation on Pages |
| **antijoin** | `modules/events/antijoin.js` | N/A | P3 | DEPRECATED | Meta Graph API limitation on Pages |
| **chongcuopbox**| `modules/events/chongcuopbox.js` | N/A | P3 | DEPRECATED | Meta Graph API limitation on Pages |
| **eval** | `modules/commands/eval.js` | N/A | P3 | REMOVED | Security vulnerability (RCE) |
| **cmd** | `modules/commands/cmd.js` | N/A | P3 | REMOVED | Security vulnerability (Shell injection) |
| **appstate login** | `mirai.js` | `src/platform/facebook/` | P0 | REMOVED | Replaced by Official Webhook |
