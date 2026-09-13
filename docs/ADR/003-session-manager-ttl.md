# ADR 003: Persistent SessionManager Replacing In-Memory `handleReply`

## Status
Accepted

## Context
In V1, multi-step dialogs (such as quiz answers, confirmations, and sequential forms) relied on an in-memory array `global.client.handleReply`.
This resulted in:
1. **Memory Leaks**: Handlers were never garbage collected unless explicitly spliced out.
2. **Session Evaporation**: Any bot restart destroyed all active user interactions.
3. **Race Conditions**: Concurrent replies corrupted the shared array.

## Decision
We implement a dedicated `SessionManager`:
- Each session has an explicit TTL (Time-To-Live, defaulting to 120–300 seconds).
- State is serialized with schema validation and persisted to the `conversation_sessions` SQLite table.
- A periodic cleanup worker automatically deletes expired sessions.
- Sessions are indexed by `conversationId` and `userId`, ensuring conversation isolation.

## Consequences
### Positive
- Interactive conversation flows survive process restarts and deployments.
- Bounded memory footprint with automatic TTL expiration.
- Concurrency-safe dialog handling.
