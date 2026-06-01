# Deploying {ask-it} on a Hostinger VPS (Ubuntu 24.04 LTS)

This is a step-by-step guide. Run each block in order. Anything in `<angle brackets>` you replace with your own value.

Assumed: you've bought the Hostinger VPS (32 GB RAM), pointed a domain at the VPS IP, and can SSH in as `root`.

---

## 1. Initial server hardening (5 min)

```bash
# Log in as root (Hostinger gives you the IP + root password)
ssh root@<your-vps-ip>

# Update everything
apt update && apt upgrade -y

# Create a non-root user
adduser deploy
usermod -aG sudo deploy

# Allow SSH for the new user, then switch
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
su - deploy
```

From here on, run commands as `deploy`. Use `sudo` for system-level changes.

Open the firewall for web + SSH:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

---

## 2. Install Ollama and the model (10–60 min depending on download speed)

```bash
# Ollama installer (official)
curl -fsSL https://ollama.com/install.sh | sh

# Confirm it's running
sudo systemctl status ollama --no-pager

# Pull and run the model. First run downloads ~16 GB; be patient.
ollama run hf.co/Jiunsong/supergemma4-26b-uncensored-gguf-v2
# Type something like "hi" to confirm it answers, then Ctrl+D to exit the REPL.
```

The Ollama service listens on `127.0.0.1:11434` by default — exactly where the Next.js app expects it. **Do not** expose 11434 to the public internet.

If the model is too slow with 32 GB RAM under load, edit `/etc/systemd/system/ollama.service.d/override.conf` (create the dir if needed) and add:

```
[Service]
Environment="OLLAMA_NUM_PARALLEL=1"
Environment="OLLAMA_KEEP_ALIVE=30m"
```

Then `sudo systemctl daemon-reload && sudo systemctl restart ollama`.

---

## 3. Install Node.js 20 + PM2 + Nginx + Certbot

```bash
# Node 20 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PM2 (process manager — keeps Next running on reboot)
sudo npm install -g pm2

# Nginx + Certbot (free HTTPS)
sudo apt install -y nginx certbot python3-certbot-nginx
```

---

## 4. Deploy the app code

```bash
# Get the code onto the VPS. Easiest: push the project folder to a GitHub repo,
# then clone it here. (You can also rsync from your laptop.)
cd ~
git clone <your-repo-url> no-name-yet
cd no-name-yet

# Install deps
npm install

# Create the env file
cp .env.example .env
nano .env
```

Fill in `.env` with the values you'll collect in steps 5–7. Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`).

```bash
# Initialize the database
npx prisma db push

# Build and start
npm run build
pm2 start npm --name no-name-yet -- start
pm2 save
pm2 startup systemd
# It prints a `sudo` command — copy/paste/run it so PM2 auto-starts on reboot.
```

The app is now running on `localhost:3000`. Next we put Nginx in front of it.

---

## 5. Nginx + HTTPS

Create `/etc/nginx/sites-available/no-name-yet`:

```bash
sudo tee /etc/nginx/sites-available/no-name-yet > /dev/null <<'EOF'
server {
    listen 80;
    server_name <your-domain.com> www.<your-domain.com>;

    # Large bodies for long chat history
    client_max_body_size 5m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;       # AI replies can be slow
        proxy_send_timeout 300s;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/no-name-yet /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Issue an HTTPS cert:

```bash
sudo certbot --nginx -d <your-domain.com> -d www.<your-domain.com>
# Follow the prompts. Pick "redirect HTTP to HTTPS".
```

Certbot auto-renews via a systemd timer; you're done with SSL.

---

## 6. Google OAuth (sign-in)

1. Go to <https://console.cloud.google.com>.
2. Create a project (or pick an existing one).
3. **APIs & Services → OAuth consent screen**: choose **External**, fill in the app name (`{ask-it}`), support email, dev contact. Add the scope `email`, `profile`, `openid`. Add your Google account as a test user while you're still in test mode (or publish it).
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - Authorized JavaScript origins: `https://<your-domain.com>`
   - Authorized redirect URIs: `https://<your-domain.com>/api/auth/callback/google`
5. Copy the **Client ID** and **Client Secret** into `.env`:
   ```
   GOOGLE_CLIENT_ID="..."
   GOOGLE_CLIENT_SECRET="..."
   NEXTAUTH_URL="https://<your-domain.com>"
   NEXTAUTH_SECRET="<run: openssl rand -base64 32>"
   ```
6. Restart the app: `pm2 restart no-name-yet`.

Test it: visit `https://<your-domain.com>`, click **Sign in**, complete the Google flow. You should land back on the site signed in.

---

## 7. PayPal subscription plans

You need a **Business** PayPal account.

### 7a. Create a REST app

1. Go to <https://developer.paypal.com> → log in → **Apps & Credentials**.
2. While testing, stay on **Sandbox**. Click **Create App** → name it `{ask-it}` → **Merchant**.
3. Save the **Client ID** and **Secret**.

### 7b. Create three subscription products + plans

The PayPal dashboard UI moves around; the most reliable way is the REST API. Run these from anywhere (your laptop is fine). Replace `CLIENT_ID:SECRET` with yours.

Get a token:

```bash
TOKEN=$(curl -s -u "<CLIENT_ID>:<SECRET>" \
  -d "grant_type=client_credentials" \
  https://api-m.sandbox.paypal.com/v1/oauth2/token \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")
```

Create the product (one product covers all three tiers):

```bash
curl -s -X POST https://api-m.sandbox.paypal.com/v1/catalogs/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "{ask-it} subscription",
    "description": "Access to {ask-it} AI chat",
    "type": "SERVICE",
    "category": "SOFTWARE"
  }'
# Save the "id" → that's your PRODUCT_ID
```

Create the three plans — change `<PRODUCT_ID>` and price for each tier:

```bash
# Tier 1 — $10/mo
curl -s -X POST https://api-m.sandbox.paypal.com/v1/billing/plans \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "product_id": "<PRODUCT_ID>",
    "name": "Tier 1",
    "billing_cycles": [{
      "frequency": {"interval_unit": "MONTH", "interval_count": 1},
      "tenure_type": "REGULAR",
      "sequence": 1,
      "total_cycles": 0,
      "pricing_scheme": {"fixed_price": {"value": "10", "currency_code": "USD"}}
    }],
    "payment_preferences": {"auto_bill_outstanding": true, "setup_fee_failure_action": "CONTINUE", "payment_failure_threshold": 1}
  }'
# Save the returned "id" → that's PAYPAL_PLAN_ID_TIER1
```

Repeat with `"name": "Tier 2"` / `"value": "20"`, and `"name": "Tier 3"` / `"value": "60"`.

### 7c. Webhook

In the PayPal dashboard → your app → **Add Webhook**:

- URL: `https://<your-domain.com>/api/paypal/webhook`
- Events: subscribe to **all** `BILLING.SUBSCRIPTION.*` events and `PAYMENT.SALE.COMPLETED`.

Save the **Webhook ID** that appears.

### 7d. Put it all in `.env`

```
PAYPAL_ENV="sandbox"   # change to "live" when ready
PAYPAL_CLIENT_ID="..."
PAYPAL_CLIENT_SECRET="..."
PAYPAL_WEBHOOK_ID="..."
PAYPAL_PLAN_ID_TIER1="P-..."
PAYPAL_PLAN_ID_TIER2="P-..."
PAYPAL_PLAN_ID_TIER3="P-..."

NEXT_PUBLIC_PAYPAL_CLIENT_ID="..."           # same as PAYPAL_CLIENT_ID
NEXT_PUBLIC_PAYPAL_PLAN_ID_TIER1="P-..."
NEXT_PUBLIC_PAYPAL_PLAN_ID_TIER2="P-..."
NEXT_PUBLIC_PAYPAL_PLAN_ID_TIER3="P-..."
```

Restart: `pm2 restart no-name-yet`.

### 7e. Test the full flow

1. Use a **PayPal sandbox personal account** (create one under Sandbox → Accounts) to subscribe.
2. Complete checkout. You should be redirected to `/account?subscribed=1` and the tier should show as 1/2/3.
3. In another terminal: `pm2 logs no-name-yet` — you should see the webhook fire with `BILLING.SUBSCRIPTION.ACTIVATED`.
4. Try sending more questions than the previous tier allowed; quota should match the new tier.

### 7f. Going live

Repeat 7a–7d under the **Live** environment in the PayPal dashboard, swap the credentials and `PAYPAL_ENV="live"`, restart.

---

## 8. Day-to-day operations

```bash
pm2 status                  # is the app up?
pm2 logs no-name-yet        # tail logs
pm2 restart no-name-yet     # restart after code or env changes
sudo systemctl status ollama
journalctl -u ollama -n 100 # ollama logs

# Deploy new code:
cd ~/no-name-yet
git pull
npm install
npx prisma db push          # only if schema changed
npm run build
pm2 restart no-name-yet
```

### Backups

The SQLite database lives at `~/no-name-yet/prisma/dev.db`. Back it up to off-site storage on a schedule:

```bash
crontab -e
# Add:
0 3 * * * cp ~/no-name-yet/prisma/dev.db ~/backups/dev-$(date +\%F).db
```

---

## 9. Common gotchas

- **OAuth redirect mismatch** — Google's redirect URI must be **exactly** `https://<your-domain.com>/api/auth/callback/google`, no trailing slash, scheme matches.
- **PayPal "unsupported plan id"** — the public `NEXT_PUBLIC_PAYPAL_PLAN_ID_*` values must match the server-side ones and the `PAYPAL_ENV` they were created under.
- **Ollama slow first response** — the model is unloaded after idle. Set `OLLAMA_KEEP_ALIVE=30m` (step 2) to keep it warm.
- **502 from Nginx after long replies** — increase `proxy_read_timeout` (already set to 300s in the config above).
- **Out-of-memory on big prompts** — 26B GGUF at full quant uses most of 32 GB. Lower the quant or shorten the system prompt if you start seeing OOM kills in `dmesg`.

---

That's the whole runway: fresh VPS → live site with sign-in, billing, and your local model. When you pick a brand name, find-and-replace `{ask-it}` across the repo and update the metadata in `app/layout.tsx`.
