# ADR 004: Modular Plugin Architecture & Command Isolation

## Status
Accepted

## Context
In V1, 435 commands were scattered in a single flat directory `modules/commands/`.
Commands contained inline shell execution, unpinned dynamic dependencies, direct file system mutations, and raw `api` calls. An unhandled exception in any command could crash the entire process.

## Decision
We establish a modular plugin system:
- Plugins reside in `src/plugins/<plugin-name>/` with a strict lifecycle (`load`, `initialize`, `enable`, `disable`, `destroy`).
- Commands are typed and registered via a centralized `CommandRouter`.
- Commands receive a scoped `CommandContext` that only exposes safe, high-level abstractions (`ctx.reply()`, `ctx.send()`, `ctx.userRole`, `ctx.sessionManager`).
- Command execution is wrapped in a try/catch sandbox with structured error logging so that single command failures never crash the bot core or webhooks.

## Consequences
### Positive
- Strict boundaries between core engine, platforms, and individual plugins.
- Isolated error handling prevents cascading system failures.
- Simplified unit and integration testing without mocking globals.
