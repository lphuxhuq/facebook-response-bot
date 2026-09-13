# SECURITY SPECIFICATION & THREAT MODEL: FACEBOOK RESPONSE BOT V2

- **Target System**: Facebook Response Bot V2 (Personal Account & Group Chat Engine)
- **Status**: AUDITED & SECURED
- **Date**: 2026-09-13

---

## 1. Threat Modeling & Safeguards

### 1.1 Credential & Session Protection
- **No Plaintext Cookies**: Session cookies are strictly stored in an AES-256-GCM encrypted file on disk (`src/transport/facebook/session.ts`) utilizing `SESSION_ENCRYPTION_KEY`.
- **Git Exclusions**: `.gitignore` strictly blocks `*.env`, `appstate.json`, `*.enc`, `*.sqlite`, and secret keys.
- **Automated Pause on Auth Revocation**: If Facebook invalidates credentials, the bot transitions to `AUTH_ERROR` and halts all outgoing requests immediately. No automated infinite login spam loops that could trigger security checkpoints or IP blacklisting.

### 1.2 Remote Code Execution (RCE) Elimination
- **Zero Eval**: Legacy `eval.js` has been completely deleted.
- **No Unsafe Math**: Math calculator (`!calc`) uses a strict whitelist regular expression (`/^[0-9\s+\-*/%().^]+$/`) and rejects any identifiers, properties, or functions.
- **No Shell Execution**: Legacy `cmd.js` and dynamic package installers (`child_process.execSync` proxy) have been deleted. All dependencies are pre-bundled and typechecked at compile time.

### 1.3 Logging & Information Leakage Prevention
- **Pino Log Redaction**: Tokens, cookies, authorization headers, passwords, and secret keys are automatically censored in all log outputs (`[REDACTED_SECRET]`).

### 1.4 Denial of Service (DoS) & Abuse Mitigation
- **Deduplication**: In-memory and SQLite-backed message deduplication drops replay attacks and duplicate deliveries.
- **RateLimiter & Outgoing Queue**: Outgoing requests are constrained by global concurrency (default: 3-5) and per-thread concurrency (1), serializing group responses and preventing bursting.
- **Circuit Breaker**: Automatically trips on 5 consecutive transport failures, pausing outgoing calls for 60 seconds to protect network and account health.
