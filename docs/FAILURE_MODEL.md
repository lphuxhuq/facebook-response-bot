# FAILURE MODEL & RESILIENCE SPECIFICATION

- **Target System**: Facebook Personal Account + Group Chat Bot V2
- **Document**: Failure Modes, Effects, and Recovery Architecture
- **Date**: 2026-09-13

---

## 1. Failure Matrix & Automated Mitigation

| Failure Category | Concrete Trigger | Legacy Behavior | V2 Detection Mechanism | V2 Autonomous Mitigation |
| :--- | :--- | :--- | :--- | :--- |
| **Session Invalidation** | Password change, checkpoint, expired cookie | Process restart loop in `index.js` triggering account ban | HTTP 401/403 or GraphQL session error | **IMMEDIATE PAUSE**: Transport transitions to `AUTH_ERROR` and halts all requests. Logs alert. Zero retry loop. |
| **Platform Rate Limiting** | Facebook rate limit (code 4, 17, 32, 613) | Throws uncaught error; continues spamming | Rate limit response parser | **EXPONENTIAL BACKOFF**: Queue halts thread actions, delays 5s -> 10s -> 30s. Drops non-critical background jobs. |
| **Burst Flooding** | Multiple users spamming commands in a group | Bot bursts responses concurrently, triggering Facebook anti-spam | `RateLimiter` token bucket | **THREAD SERIALIZATION**: Concurrency = 1 per thread. Queued actions execute with minimum delay (e.g. 100ms). |
| **Duplicate Events** | Network retries from Facebook or reconnect | Command executes 2+ times, double-deducting currency | `MessageDeduplicator` (Memory + SQLite) | **IDEMPOTENCY CHECK**: Checks `messageId` before processing; duplicate events are silently discarded. |
| **Transient Network Drops** | DNS failure, connection reset (`ECONNRESET`) | MQTT listener dies silently | WebSocket / fetch error handler | **CIRCUIT BREAKER**: Retries up to 3 times with backoff. If 5 consecutive failures occur, circuit OPENS for 60s cooldown. |
| **Database Contention** | High concurrent message archiving | `SQLITE_BUSY` exception crashes process | SQLite driver error trap | **WAL MODE & POOLING**: SQLite in Write-Ahead Logging (`WAL`) mode allows concurrent reads during writes. |
| **Plugin / Command Crash** | Unhandled exception in user command | Process terminates abruptly | Sandboxed try/catch in `CommandRouter` | **ISOLATED ERROR**: Sends user-friendly error reply; writes structured error log; core remains 100% operational. |
| **Process Crash / Restart** | Server reboot, container restart | All active dialog sessions (`handleReply`) lost | SQLite `conversation_sessions` store | **RESTART RESILIENCE**: Active sessions with valid TTL are reloaded from disk; pending scheduled jobs resume cleanly. |

---

## 2. Circuit Breaker State Machine

```text
    ┌────────────────────────────────────────────────────────┐
    │                                                        │
    ▼                                                        │
[ CLOSED ] ──(Failure count >= threshold)──► [ OPEN ]        │ Success
 (Normal)                                    (Pause all reqs)│
    ▲                                               │        │
    │                                          Cooldown (60s)│
    │                                               ▼        │
    └─────────────────(Probe fails)───────── [ HALF_OPEN ] ──┘
```

- **Failure Threshold**: 5 consecutive network or server failures.
- **Cooldown Window**: 60 seconds.
- **Half-Open Probe**: Sends single test ping or status check. If successful, transitions to `CLOSED`. If failed, re-opens for another 60s.

---

## 3. Kill Switch Architecture

- **Static Kill Switch**: Environment variable `BOT_ENABLED=false` prevents the bot from connecting or sending any outgoing actions.
- **Dynamic Runtime Switch**:
  - `POST /pause` or admin command `/pause` transitions transport state to `PAUSED`.
  - In `PAUSED` mode: incoming messages can still be safely archived to local history, but the outgoing queue holds all actions.
  - `POST /resume` or `/resume` resumes outgoing queue processing.
