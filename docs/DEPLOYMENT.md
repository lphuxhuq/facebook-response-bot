# DEPLOYMENT & OPERATION GUIDE: FACEBOOK RESPONSE BOT V2

---

## 1. Quick Start with Docker Compose

The simplest and most resilient way to run the bot in production is using Docker Compose:

```bash
# 1. Clone repository and checkout branch
git clone https://github.com/lphuxhuq/facebook-response-bot.git
cd facebook-response-bot
git checkout remake-and-test

# 2. Copy environment template and configure
cp .env.example .env
nano .env

# 3. Build and launch container
docker compose up -d --build

# 4. Check status & logs
docker compose logs -f
curl http://localhost:3000/status
```

---

## 2. Environment Variables (.env)

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info

# Bot Core
BOT_NAME="Facebook Response Bot V2"
BOT_PREFIX="!"
BOT_OWNER_ID=100000000000001
BOT_ENABLED=true

# Storage & Encryption
DATABASE_PATH=./data/bot.sqlite
SESSION_ENCRYPTION_KEY=super_secret_aes_256_key_32_bytes_long!
FACEBOOK_SESSION_PATH=./data/fb-session.enc

# Concurrency & Reliability
GLOBAL_CONCURRENCY=5
THREAD_CONCURRENCY=1
CIRCUIT_FAILURE_THRESHOLD=5
CIRCUIT_COOLDOWN=60000
```

---

## 3. Observability & Runtime Control

```bash
# Health Check
curl http://localhost:3000/health

# Database Readiness
curl http://localhost:3000/ready

# Runtime Status
curl http://localhost:3000/status

# Transport State
curl http://localhost:3000/transport

# Outgoing Queue Status
curl http://localhost:3000/queue

# Pause Bot (Kill Switch)
curl -X POST http://localhost:3000/pause

# Resume Bot
curl -X POST http://localhost:3000/resume
```

---

## 4. Backup & Disaster Recovery

The SQLite database and session data are stored in `./data`.
To create an automated backup:

```bash
# Backup SQLite in WAL mode safely
sqlite3 ./data/bot.sqlite ".backup './data/backup-$(date +%Y%m%d%H%M%S).sqlite'"
```
