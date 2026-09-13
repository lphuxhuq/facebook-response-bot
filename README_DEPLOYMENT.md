# PRODUCTION DEPLOYMENT GUIDE: FACEBOOK RESPONSE BOT V2

This guide walks you through setting up and running **facebook-response-bot-v2** in production using official Meta Messenger Webhooks and Docker.

---

## 1. Prerequisites

1. **A Facebook Page**: Create or own a Facebook Page that will serve as the bot persona.
2. **Meta for Developers Account**: [developers.facebook.com](https://developers.facebook.com/).
3. **A Server with Public HTTPS**: Meta Webhooks strictly require a valid public SSL/TLS certificate (`https://`).
4. **Docker & Docker Compose** (or Node.js 24 LTS).

---

## 2. Meta for Developers App Setup

1. Go to [developers.facebook.com/apps](https://developers.facebook.com/apps) and click **Create App**.
2. Select **Other** > **Business** (or Messenger) as the app type.
3. In the App Dashboard, add the **Messenger** product.
4. Under **Messenger > Settings**:
   - **Access Tokens**: Select your Facebook Page and click **Generate Token**. Copy this as `FACEBOOK_PAGE_ACCESS_TOKEN`.
   - **Page ID**: Note your Facebook Page numeric ID (`FACEBOOK_PAGE_ID`).
5. Under **App Settings > Basic**:
   - Note your **App ID** (`FACEBOOK_APP_ID`).
   - Click Show next to **App Secret** and copy it (`FACEBOOK_APP_SECRET`).

---

## 3. Environment Configuration

Create a production `.env` file on your server:

```bash
cp .env.example .env
```

Fill in the required values:

```env
PORT=3000
HOST=0.0.0.0
NODE_ENV=production
LOG_LEVEL=info

# Meta Messenger Configuration
FACEBOOK_PAGE_ID=109283746501928
FACEBOOK_APP_ID=592837401928374
FACEBOOK_APP_SECRET=your_actual_app_secret
FACEBOOK_VERIFY_TOKEN=any_secret_random_string_you_choose
FACEBOOK_PAGE_ACCESS_TOKEN=EAAG...long_meta_page_token

# Bot Core
BOT_NAME="Facebook Response Bot V2"
BOT_PREFIX="!"
BOT_OWNER_ID=100000000000001

# Persistent Storage
DATABASE_PATH=./data/bot.sqlite
```

---

## 4. Reverse Proxy Setup (Caddy / Nginx)

Meta requires HTTPS. If you use **Caddy** (recommended):

```caddyfile
bot.yourdomain.com {
    reverse_proxy localhost:3000
}
```

If you use **Nginx**:

```nginx
server {
    server_name bot.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 443 ssl;
    # ssl_certificate /path/to/cert.pem;
    # ssl_certificate_key /path/to/privkey.pem;
}
```

---

## 5. Webhook Subscription on Meta Dashboard

1. In the Meta App Dashboard under **Messenger > Settings > Webhooks**:
2. Click **Add Callback URL**:
   - **Callback URL**: `https://bot.yourdomain.com/webhook`
   - **Verify Token**: Must match `FACEBOOK_VERIFY_TOKEN` in your `.env`.
3. Click **Verify and Save**. The bot will immediately respond to Meta's handshake.
4. Under **Webhooks > Subscriptions**:
   - Click **Add Subscriptions** for your Page.
   - Subscribe to: `messages`, `messaging_postbacks`.

---

## 6. Running with Docker Compose

```bash
# Build and run the bot container in background
docker compose up -d --build

# Inspect running logs
docker compose logs -f

# Verify container health
docker compose ps
```

---

## 7. Operational Verification

You can probe the bot anytime:

```bash
# Health Check (HTTP 200)
curl http://localhost:3000/health

# Readiness Check (Database connection)
curl http://localhost:3000/ready

# Runtime Metrics & Memory
curl http://localhost:3000/status

# Registered Commands List
curl http://localhost:3000/commands
```
