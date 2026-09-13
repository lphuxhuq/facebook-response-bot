# ADR 005: Isolation of Facebook Personal Account Transport with Safety & Reliability Layer

## Status
Accepted

## Context
The legacy application coupled command logic, group administration, and message sending directly to `fca-horizon-remake` and global mutable state (`global.client`). This introduced severe stability issues, account checkpoints due to burst request floods, and total lack of testability without real Facebook credentials.

## Decision
We establish a clean, layered architecture:
1. **Transport Abstraction**: The core engine communicates exclusively via the `MessagingTransport` interface.
2. **Personal Account Driver**: Encapsulated in `src/transport/facebook/` with encrypted session cookies (`AES-256-GCM`), cleanroom protocol client, and automatic pause on `AUTH_ERROR`.
3. **Safety & Reliability Layer**: All outgoing actions are channeled through `RequestQueue`, `RateLimiter`, and `CircuitBreaker`. No command is permitted to execute unbounded concurrent network calls.
4. **Test Isolation**: A `FakeFacebookTransport` provides 100% deterministic test coverage for unit, integration, and load tests without hitting live Facebook servers.

## Consequences
### Positive
- Strict separation of concerns: commands have zero awareness of Facebook internal protocols.
- Immunity to account bans caused by bot burst loops.
- Comprehensive automated testing without Facebook credentials.
- Multi-platform ready (can support Telegram or Discord by swapping the transport adapter).

### Negative / Trade-offs
- Maintaining an unofficial personal account transport requires ongoing monitoring of Facebook's edge protocols.
