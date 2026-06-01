# {ask-it}

A ChatGPT-style web app backed by an uncensored open-source model
(`hf.co/Jiunsong/supergemma4-26b-uncensored-gguf-v2`) running locally via
**Ollama** on your own VPS. Users sign in with Google and subscribe via PayPal.

## Tiers

| Tier | Price        | Allowance              |
| ---- | ------------ | ---------------------- |
| 0    | Free         | 5 questions / month    |
| 1    | $10 / month  | 25 questions / week    |
| 2    | $20 / month  | 55 questions / week    |
| 3    | $60 / month  | 200 questions / week   |

## Stack

- **Next.js 14** (App Router, TypeScript, Tailwind)
- **NextAuth** with Google OAuth + Prisma adapter
- **Prisma + SQLite** (swap to Postgres later if you outgrow it)
- **Ollama** local inference, called over HTTP at `127.0.0.1:11434`
- **PayPal Subscriptions** (recurring billing + webhooks)

## Local development

```bash
cp .env.example .env
# fill in the values, then:
npm install
npx prisma db push
npm run dev
```

Open http://localhost:3000.

## Deploying to your Hostinger VPS

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** — it walks through Ubuntu 24.04 LTS
from a fresh box: Ollama install, model pull, Node.js, Nginx, HTTPS, PM2,
Google OAuth, and the PayPal dashboard config.

## Project layout

```
app/                   Next.js routes (App Router)
  api/
    auth/[...nextauth] NextAuth handler
    chat/              POST → checks quota, calls Ollama, logs the question
    usage/             GET  → current usage summary
    paypal/
      create-subscription  records a PayPal subscription ID against the user
      webhook              PayPal webhook (signed)
      cancel               cancels the user's subscription
  chat/                Chat page (server component → ChatUI)
  pricing/             Pricing page + PayPal checkout
  account/             Account / subscription management
components/            React UI
lib/                   db, auth, ollama, paypal, tiers, usage
prisma/schema.prisma   DB schema
```

## Where to put the brand name

Search the codebase for `{ask-it}` — that's the placeholder. When you
land on a name, do a project-wide find-and-replace.
