# ADR 001: Migration from Unofficial Reverse-Engineered FCA to Official Meta Messenger Webhook

## Status
Accepted

## Context
The legacy application (`facebook-response-bot` V1) authenticates personal Facebook accounts via browser cookie jars (`appstate.json`) and interacts with Facebook's internal, unofficial endpoints using `fca-horizon-remake`.

This architecture introduces severe risks:
1. **Permanent Account Checkpoints**: Meta aggressively detects and bans accounts automating personal profiles.
2. **Credential Theft Vector**: Plaintext `appstate.json` contains full session cookies.
3. **Transport Fragility**: Any minor change to Facebook internal markup or encryption crashes the bot.

## Decision
We transition entirely to the **Official Meta Messenger Platform**:
- Webhooks via Fastify HTTPS endpoints (`GET /webhook` for hub verification, `POST /webhook` for event delivery).
- Cryptographic verification of all incoming requests using HMAC-SHA256 (`x-hub-signature-256`) with `FACEBOOK_APP_SECRET`.
- Message sending via official Graph API v21.0 using scoped Page Access Tokens.
- Transport logic isolated strictly inside `src/platform/facebook/`.

## Consequences
### Positive
- 100% compliance with Meta Terms of Service.
- Zero risk of personal account bans or credential theft via `appstate.json`.
- Strict SLA and stable, versioned API contracts.
- High-performance HTTPS webhook reception replacing fragile background MQTT sockets.

### Negative / Trade-offs
- Facebook Pages cannot join arbitrary private user group chats as a regular member.
- Features that depend on modifying group membership (`antiout`, `chongcuopbox`) are deprecated and removed.
