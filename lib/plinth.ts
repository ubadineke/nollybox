// Server-only Plinth client. Holds the live API key and proxies calls on behalf of
// viewers. Never import this into a client component.
//
// Flip to live with env:
//   PLINTH_MODE=live
//   PLINTH_API_URL=https://api.useplinth.xyz   (or http://localhost:7331)
//   PLINTH_API_KEY=sk_live_...                  (Nollybox's tenant key)
//   PLINTH_PLAN_STANDARD_MONTHLY=pln_...        (plan ids created on the dashboard)
//   PLINTH_PLAN_STANDARD_ANNUAL=pln_...
//   PLINTH_PLAN_PREMIUM_MONTHLY=pln_...

import type { Interval, Rail, Tier } from './plans';

export type PlinthMode = 'mock' | 'live';
export const PLINTH_MODE: PlinthMode = (process.env.PLINTH_MODE as PlinthMode) ?? 'mock';

const BASE = process.env.PLINTH_API_URL ?? 'http://localhost:7331';
const KEY = process.env.PLINTH_API_KEY ?? '';

// Maps a Nollybox (tier, interval) to the Plinth plan id created on the dashboard.
export function planId(tier: Tier, interval: Interval): string {
  const env = process.env;
  if (tier === 'premium') return env.PLINTH_PLAN_PREMIUM_MONTHLY ?? '';
  if (interval === 'annual') return env.PLINTH_PLAN_STANDARD_ANNUAL ?? '';
  return env.PLINTH_PLAN_STANDARD_MONTHLY ?? '';
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${KEY}`,
      ...init?.headers,
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Plinth ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export const plinth = {
  /** Create (or reuse) the Plinth customer for a viewer. external_ref keeps it idempotent. */
  async ensureCustomer(input: { externalRef: string; name: string; email: string }): Promise<{ id: string }> {
    return req('/v1/customers', {
      method: 'POST',
      body: JSON.stringify({ external_ref: input.externalRef, name: input.name, email: input.email }),
    });
  },

  /** Create a subscription on a plan and return a Nomba checkout link for the first payment. */
  async subscribe(input: { customerId: string; tier: Tier; interval: Interval; rail: Rail }): Promise<{
    subscriptionId: string;
    checkoutLink: string;
  }> {
    const sub: any = await req('/v1/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        customer_id: input.customerId,
        plan_id: planId(input.tier, input.interval),
        preferred_rail: input.rail === 'transfer' ? 'transfer' : 'card',
      }),
    });
    const link: any = await req(`/v1/subscriptions/${sub.id}/checkout-link`, { method: 'POST', body: '{}' });
    return { subscriptionId: sub.id, checkoutLink: link.checkoutLink };
  },

  /** Real-time access for a customer — drives UI gating. */
  entitlements(customerId: string) {
    return req<{ has_access: boolean; tier: string | null; state: string | null; features: Record<string, unknown> }>(
      `/v1/customers/${customerId}/entitlements`,
    );
  },

  getSubscription(id: string) {
    return req<any>(`/v1/subscriptions/${id}`);
  },

  listInvoices() {
    return req<{ data: any[] }>(`/v1/invoices`);
  },
};
