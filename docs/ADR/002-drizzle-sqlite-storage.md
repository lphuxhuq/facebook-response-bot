# ADR 002: Adopting SQLite with WAL Mode & Drizzle ORM

## Status
Accepted

## Context
The legacy application used Sequelize v6 with SQLite, storing most dynamic data as unvalidated JSON strings in a single `data` text column. This resulted in frequent concurrency locks (`SQLITE_BUSY`), schema drift, untyped database interactions, and potential data corruption during ungraceful process termination.

## Decision
We adopt **SQLite 3 in WAL (Write-Ahead Logging) mode** paired with **Drizzle ORM**:
1. SQLite WAL mode allows concurrent readers without blocking writes.
2. Drizzle ORM provides zero-overhead, fully type-safe queries, compile-time schema validation, and SQL-like syntax without heavy ORM runtime magic.
3. Strict typed repositories (`UserRepository`, `ConversationRepository`, `SessionRepository`, `EconomyRepository`) isolate commands from direct database access.

## Consequences
### Positive
- Compile-time type safety across all database queries.
- High write throughput and zero read-write contention with WAL mode.
- Simple single-file deployment suitable for Docker containers with persistent volume mounts.
- Elimination of schema drift via formal migrations.

### Negative / Trade-offs
- Multi-instance horizontal scaling requires network database migration (e.g. LibSQL/Turso or PostgreSQL), which Drizzle supports with minimal code changes.
