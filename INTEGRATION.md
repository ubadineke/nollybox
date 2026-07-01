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

The client is **already wired** for live — it's driven by `NEXT_PUBLIC_PLINTH_MODE`. Flipping is now just config:

1. On the **Plinth dashboard**: register Nollybox → claim → create the plans and give each a
   **lookup key**: `standard_monthly`, `standard_annual`, `premium_monthly` → generate a **live API key**.
2. `cp .env.example .env.local` and fill (no plan ids — resolved by lookup_key):
   ```
   PLINTH_MODE=live               # server routes call Plinth
   NEXT_PUBLIC_PLINTH_MODE=live   # client calls the server routes instead of the mock store
   PLINTH_API_URL=http://localhost:7331   # or the tunnel
   PLINTH_API_KEY=sk_live_...
   ```
3. Restart. That's it — the wiring is built:
   - `ViewerGate` "Continue as Ada" → `POST /api/plinth/customer` (creates the Plinth customer)
   - `CheckoutSheet` → `POST /api/plinth/subscribe` → redirects to the Nomba checkout link
   - Pricing/Account **upgrade/downgrade** → `POST /api/plinth/change` (proration preview → commit)
   - gating (`canWatch`) + Account hydrate from `GET /api/plinth/account` (subscription + entitlements + invoices)
   - the mock store remains the fallback whenever `NEXT_PUBLIC_PLINTH_MODE` ≠ `live`

That's the whole integration — one app, no DB, no auth provider.

### What live vs mock changes at runtime
| | mock (default) | live |
|---|---|---|
| Identity | local viewer | `POST /api/plinth/customer` (cookie holds customer id) |
| Subscribe | local 7-day trial | `subscribe` → **Nomba hosted checkout** |
| Upgrade/downgrade | local tier switch | `change` → **prorated** charge/credit via Plinth |
| Access/gating & Account | local store | `account` (live subscription + entitlements + invoices) |
| Demo Controls panel | shown (simulate lifecycle) | hidden (lifecycle driven by Plinth + dashboard) |

> Dunning **recovery from the app** (past_due → update card) isn't wired for live yet — in live the
> dunning lifecycle is driven by Plinth + the dashboard. The mock mode still demonstrates it fully.
