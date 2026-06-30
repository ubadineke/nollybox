# Nollybox ↔ Plinth integration

Nollybox runs in two modes. The client UI is identical; only the data source changes.

| Mode | Data source | Backend | Use |
|---|---|---|---|
| **mock** (default) | client store (`lib/store.tsx`, localStorage) | none | demo / offline / stage |
| **live** | Plinth API via server routes | the Next.js app itself | real end-to-end |

There is **no database and no auth**. Identity is one tap — *Continue as Ada* — which
maps to a single Plinth customer (`external_ref = ada@nollybox.demo`). The "session" is one
httpOnly cookie holding the Plinth `customerId`.

## The wiring (already built)

Server-only, holds the API key — never imported by client components:

- `lib/plinth.ts` — typed Plinth client (`ensureCustomer`, `subscribe`, `entitlements`, …) + `tier→planId` map
- `lib/session.ts` — the Ada identity + the `customerId` cookie helpers
- `app/api/plinth/customer`  — POST: create/find Ada → set cookie
- `app/api/plinth/subscribe`  — POST `{tier,interval,rail}` → subscription + Nomba checkout link
- `app/api/plinth/entitlements` — GET: real-time access for gating
- `app/api/plinth/account` — GET: invoices (+ subscription)
- `app/api/plinth/webhook` — POST: optional Nollybox-side event hook

In **mock** mode every route returns `{ mode: 'mock', connected: false }` and the client
keeps using the local store. Nothing calls Plinth.

## Flip to live (when a tenant + plans exist)

1. On the **Plinth dashboard**: register Nollybox → claim → create the plans
   (Standard monthly, Standard annual, Premium) → generate a **live API key**.
2. `cp .env.example .env.local` and fill:
   ```
   PLINTH_MODE=live
   PLINTH_API_URL=http://localhost:7331        # or the tunnel
   PLINTH_API_KEY=sk_live_...
   PLINTH_PLAN_STANDARD_MONTHLY=pln_...
   PLINTH_PLAN_STANDARD_ANNUAL=pln_...
   PLINTH_PLAN_PREMIUM_MONTHLY=pln_...
   ```
3. Point the client at the server routes instead of the mock store. Three swaps in the UI:
   - `ViewerGate` "Continue as Ada" → also `POST /api/plinth/customer`
   - `CheckoutSheet` "pay" → `POST /api/plinth/subscribe` → redirect to the returned `checkoutLink`
   - gating (`canWatch`) + Account → read `GET /api/plinth/entitlements` and `/account`

   (The store can keep mirroring this so the offline fallback still works.)

That's the whole integration — one app, no DB, no auth provider.
