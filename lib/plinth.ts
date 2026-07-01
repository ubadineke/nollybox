// Server-only Plinth client. Holds the live API key and proxies calls on behalf of
// viewers. Never import this into a client component.
//
// Flip to live with env (no plan ids needed — plans are resolved by lookup_key):
//   PLINTH_MODE=live
//   PLINTH_API_URL=https://api.useplinth.xyz   (or http://localhost:7331)
//   PLINTH_API_KEY=sk_live_...                  (Nollybox's tenant key)
//
// On the Plinth dashboard, set each plan's lookup_key to the matching handle below.

import type { Interval, Rail, Tier } from './plans';

export type PlinthMode = 'mock' | 'live';
export const PLINTH_MODE: PlinthMode = (process.env.PLINTH_MODE as PlinthMode) ?? 'mock';

const BASE = process.env.PLINTH_API_URL ?? 'http://localhost:7331';
const KEY = process.env.PLINTH_API_KEY ?? '';

interface PlinthPlan {
  id: string;
  name: string;
  amount_minor: string;
  interval: string;
  trial_period_days: number;
  lookup_key: string | null;
}

// The stable lookup_key each Nollybox (tier, interval) maps to — set these on the
// dashboard when creating the plans. The app references roles, never UUIDs.
export function lookupKey(tier: Tier, interval: Interval): string {
  if (tier === 'premium') return 'premium_monthly';
  if (tier === 'medium')  return 'medium_monthly';
  return interval === 'annual' ? 'standard_annual' : 'standard_monthly';
}

// Reverse: map a plan's lookup_key back to Nollybox's (tier, interval).
export function tierFromLookupKey(key: string | null): { tier: Tier; interval: Interval } | null {
  switch (key) {
    case 'premium_monthly': return { tier: 'premium', interval: 'monthly' };
    case 'standard_annual': return { tier: 'standard', interval: 'annual' };
    case 'standard_monthly': return { tier: 'standard', interval: 'monthly' };
    case 'medium_monthly':  return { tier: 'medium',   interval: 'monthly' };
    default: return null;
  }
}

interface PlinthSubscription {
  id: string;
  customer_id: string;
  plan_id: string;
  state: string;
  quantity: number;
  current_period_end: string;
  next_bill_at: string;
  trial_end_at: string | null;
}

// A customer's "current" subscription is any non-canceled one (there's at most one live at a time here).
const LIVE_STATES = ['active', 'trialing', 'past_due', 'grace', 'delinquent', 'incomplete'];

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
  if (!res.ok) {
    // Surface the engine's real error (e.g. no_payment_method) instead of a bare status.
    const body = await res.json().catch(() => null as any);
    const msg = body?.error?.message ?? body?.error ?? body?.message ?? `Plinth ${path} → ${res.status}`;
    const err = new Error(typeof msg === 'string' ? msg : JSON.stringify(msg)) as Error & { status?: number; code?: string };
    err.status = res.status;
    err.code = body?.error?.code;
    throw err;
  }
  return res.json() as Promise<T>;
}

export const plinth = {
  /** Create (or reuse) the Plinth customer for a viewer. Idempotent via external_ref. */
  async ensureCustomer(input: { externalRef: string; name: string; email: string }): Promise<{ id: string }> {
    try {
      return await req('/v1/customers', {
        method: 'POST',
        body: JSON.stringify({ external_ref: input.externalRef, name: input.name, email: input.email }),
      });
    } catch {
      // Already exists (409) or transient — look them up by external_ref.
      const { data } = await req<{ data: { id: string; external_ref: string }[] }>('/v1/customers');
      const found = data.find((c) => c.external_ref === input.externalRef);
      if (found) return { id: found.id };
      throw new Error('Could not create or find customer (check your Plinth API key)');
    }
  },

  /** Fetch the tenant's catalogue. Used to resolve plans by lookup_key (and to render pricing). */
  async listPlans(): Promise<PlinthPlan[]> {
    const { data } = await req<{ data: PlinthPlan[] }>('/v1/plans');
    return data;
  },

  /** Resolve a (tier, interval) to its Plinth plan id via lookup_key — no UUIDs in config. */
  async resolvePlanId(tier: Tier, interval: Interval): Promise<string> {
    const key = lookupKey(tier, interval);
    const plan = (await this.listPlans()).find((p) => p.lookup_key === key);
    if (!plan) throw new Error(`No Plinth plan with lookup_key "${key}" — set it on the dashboard.`);
    return plan.id;
  },

  /**
   * Create a subscription. The initial state decides what happens next:
   *  - `incomplete` (strict / pay-to-unlock) → generate a Nomba checkout link (charges period 1).
   *  - `trialing` / `active` (no-card trial or arrears) → access is already granted, no checkout.
   */
  async subscribe(input: { customerId: string; tier: Tier; interval: Interval; rail: Rail }): Promise<{
    subscriptionId: string;
    state: string;
    checkoutLink: string | null;
  }> {
    // Never create duplicates: reuse the viewer's existing (non-canceled) subscription.
    // - incomplete → resume its checkout (they haven't paid yet)
    // - active/trialing/past_due → already subscribed, nothing to do
    const existing = await this.activeSubscriptionFor(input.customerId);
    if (existing) {
      if (existing.state === 'incomplete') {
        const link: any = await req(`/v1/subscriptions/${existing.id}/checkout-link`, { method: 'POST', body: '{}' });
        return { subscriptionId: existing.id, state: existing.state, checkoutLink: link.checkoutLink };
      }
      return { subscriptionId: existing.id, state: existing.state, checkoutLink: null };
    }

    const planId = await this.resolvePlanId(input.tier, input.interval);
    const sub: any = await req('/v1/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        customer_id: input.customerId,
        plan_id: planId,
        preferred_rail: input.rail === 'transfer' ? 'transfer' : 'card',
      }),
    });
    if (sub.state === 'incomplete') {
      const link: any = await req(`/v1/subscriptions/${sub.id}/checkout-link`, { method: 'POST', body: '{}' });
      return { subscriptionId: sub.id, state: sub.state, checkoutLink: link.checkoutLink };
    }
    return { subscriptionId: sub.id, state: sub.state, checkoutLink: null };
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

  /** The customer's current (non-canceled) subscription, if any. */
  async activeSubscriptionFor(customerId: string): Promise<PlinthSubscription | null> {
    const { data } = await req<{ data: PlinthSubscription[] }>('/v1/subscriptions');
    const mine = data.filter((s) => s.customer_id === customerId);
    return mine.find((s) => LIVE_STATES.includes(s.state)) ?? null;
  },

  /** Preview the proration of moving to (tier, interval) — no charge. */
  async previewChange(subscriptionId: string, tier: Tier, interval: Interval) {
    const planId = await this.resolvePlanId(tier, interval);
    return req<{ direction: string; dueNowMinor: string; creditMinor: string; scheduledFor: string | null }>(
      `/v1/subscriptions/${subscriptionId}/preview-change`,
      { method: 'POST', body: JSON.stringify({ plan_id: planId }) },
    );
  },

  /** Commit a plan change (upgrade/downgrade) — charges/credits per policy. */
  async commitChange(subscriptionId: string, tier: Tier, interval: Interval) {
    const planId = await this.resolvePlanId(tier, interval);
    return req<any>(`/v1/subscriptions/${subscriptionId}/change`, {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId }),
    });
  },

  /** No-card upgrade fallback: get a Nomba checkout link for the prorated amount. The plan
   *  swaps once the payment settles (the webhook applies the pending change). */
  async changeCheckout(subscriptionId: string, tier: Tier, interval: Interval) {
    const planId = await this.resolvePlanId(tier, interval);
    return req<{ checkoutLink: string; orderReference: string; dueMinor: string; newPlanName: string }>(
      `/v1/subscriptions/${subscriptionId}/change-checkout`,
      { method: 'POST', body: JSON.stringify({ plan_id: planId }) },
    );
  },

  listInvoices() {
    return req<{ data: any[] }>(`/v1/invoices`);
  },
};
