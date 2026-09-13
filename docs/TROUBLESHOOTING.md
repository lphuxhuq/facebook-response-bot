# TROUBLESHOOTING GUIDE: FACEBOOK RESPONSE BOT V2

---

## 1. Webhook Verification Errors (403 Forbidden)

### Symptom:
When clicking "Verify and Save" in Meta Developer Console, Meta displays:
`The URL couldn't be validated. Response did not match challenge.`

### Root Cause:
The `hub.verify_token` sent by Meta does not match the `FACEBOOK_VERIFY_TOKEN` configured in your `.env`.

### Fix:
1. Check `FACEBOOK_VERIFY_TOKEN` in your `.env`.
2. Ensure no trailing spaces or quotes in `.env`.
3. Test locally or via curl:
   ```bash
   curl -i "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=112233"
   ```
   Must return HTTP 200 with body `112233`.

---

## 2. Webhook Signature Mismatch (401 Unauthorized)

### Symptom:
Meta logs `401 Unauthorized` when delivering messages to `POST /webhook`.

### Root Cause:
The `x-hub-signature-256` header does not match HMAC-SHA256 calculated with `FACEBOOK_APP_SECRET`.

### Fix:
1. Ensure `FACEBOOK_APP_SECRET` in `.env` is copied directly from **App Settings > Basic > App Secret** in Meta Developer Console.
2. If running behind a reverse proxy, ensure the reverse proxy does not alter the raw request body payload.

---

## 3. Rate Limit Warnings (HTTP 429 / Code 613)

### Symptom:
Outgoing messages fail with `Meta Graph API rate limit reached`.

### Root Cause:
Page has exceeded Meta Messenger Platform call volume (200 calls/hour for new pages or mass broadcast).

### Fix:
1. The built-in `FacebookSender` automatically queues outgoing messages and applies exponential backoff (1s -> 2s -> 4s).
2. Adjust `concurrency` in `src/platform/facebook/queue.ts` if sending bulk broadcasts.
3. Apply for Advanced Access in Meta App Review if higher throughput is required.

---

## 4. SQLite Database Locked (`SQLITE_BUSY`)

### Symptom:
Logs display `database is locked`.

### Root Cause:
Multiple write transactions competing without WAL mode or database accessed across network filesystem.

### Fix:
1. The bot automatically configures `PRAGMA journal_mode = WAL;`.
2. Ensure the SQLite database file resides on a local SSD drive rather than an NFS or SMB network share.
