'use client';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ENTITLEMENTS, type Entitlements, type Interval, type Rail, type Tier, planFor } from './plans';
import type { Title } from './titles';

export type SubStatus = 'none' | 'trialing' | 'active' | 'past_due' | 'on_hold' | 'canceled';

export interface Profile {
  id: string;
  name: string;
  color: string;
}

export interface Viewer {
  name: string;
  customerId: string | null; // Plinth customer id once connected (null in mock mode)
}

interface BillingState {
  viewer: Viewer | null;
  tier: Tier;
  interval: Interval;
  rail: Rail;
  status: SubStatus;
  startedAt: string | null;
  nextBillAt: string | null;
  trialEndsAt: string | null;
  profiles: Profile[];
  currentProfileId: string | null;
}

const PROFILE_COLORS = ['#f4456b', '#f5b73d', '#2dd4bf', '#6366f1', '#fb923c', '#a78bfa'];

const DEFAULT_STATE: BillingState = {
  viewer: null,
  tier: 'free',
  interval: 'monthly',
  rail: 'card',
  status: 'none',
  startedAt: null,
  nextBillAt: null,
  trialEndsAt: null,
  profiles: [{ id: 'p1', name: 'Me', color: '#f4456b' }],
  currentProfileId: 'p1',
};

const KEY = 'nollybox.billing.v1';
// Live vs mock is chosen at build time. Client-readable mirror of the server's PLINTH_MODE.
const LIVE = process.env.NEXT_PUBLIC_PLINTH_MODE === 'live';

function addDays(d: number): string {
  return new Date(Date.now() + d * 86400000).toISOString();
}
function periodDays(interval: Interval): number {
  return interval === 'annual' ? 365 : 30;
}

// Map a raw Plinth subscription state to Nollybox's SubStatus (preserves access semantics).
function mapPlinthState(s?: string | null): SubStatus {
  switch (s) {
    case 'active': return 'active';
    case 'trialing': return 'trialing';
    case 'past_due':
    case 'grace': return 'past_due';   // still has access while dunning
    case 'delinquent': return 'on_hold'; // access revoked after grace
    // Card-required trial not yet paid, or an abandoned signup → treat as "not subscribed"
    // (no access, no scary banner) rather than "on hold".
    case 'incomplete': return 'none';
    case 'canceled': return 'canceled';
    default: return 'none';
  }
}

async function postJSON(path: string, body?: unknown) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? `POST ${path} failed (${res.status})`);
  return data;
}

export interface ChangePreview {
  direction: string;
  dueNowMinor: string;
  creditMinor: string;
}

interface BillingCtx extends BillingState {
  hydrated: boolean;
  live: boolean;
  effectiveTier: Tier;
  entitlements: Entitlements;
  hasPaidAccess: boolean;
  trialDaysLeft: number;
  canWatch: (t: Title) => boolean;
  banner: { kind: 'trial' | 'past_due' | 'on_hold'; text: string } | null;
  // actions
  signIn: (name: string) => Promise<void>;
  signOut: () => void;
  // 'redirect' = navigating to Nomba checkout (keep the spinner up); 'granted' = access given, no checkout.
  subscribe: (tier: Tier, interval: Interval, rail: Rail, withTrial?: boolean) => Promise<'redirect' | 'granted'>;
  previewChange: (tier: Tier, interval: Interval) => Promise<ChangePreview | null>;
  // 'redirect' = navigating to Nomba checkout (no card → pay for the upgrade); 'done' = applied in place.
  changePlan: (tier: Tier, interval: Interval) => Promise<'redirect' | 'done'>;
  convertTrial: () => void;
  changeTier: (tier: Tier) => void;
  simulateRenewal: () => void;
  simulateFailure: () => void;
  escalate: () => void;
  recover: () => void;
  cancel: () => void;
  reset: () => void;
  addProfile: (name: string) => boolean; // false if over screen limit
  removeProfile: (id: string) => void;
  selectProfile: (id: string) => void;
}

const Ctx = createContext<BillingCtx | null>(null);

export function BillingProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<BillingState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setS({ ...DEFAULT_STATE, ...JSON.parse(raw) });
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY, JSON.stringify(s));
  }, [s, hydrated]);

  // Live: pull authoritative billing state (subscription, access) from Plinth.
  async function hydrateLive() {
    try {
      const res = await fetch('/api/plinth/account');
      const d = await res.json();
      if (!d?.connected) return;
      const sub = d.subscription;
      setS((p) => ({
        ...p,
        tier: sub?.tier ?? 'free',
        interval: sub?.interval ?? p.interval,
        status: mapPlinthState(sub?.state),
        nextBillAt: sub?.next_bill_at ?? null,
        trialEndsAt: sub?.trial_end_at ?? null,
      }));
    } catch {}
  }

  useEffect(() => {
    if (hydrated && LIVE && s.viewer) hydrateLive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, s.viewer?.name]);

  const hasPaidAccess = s.status === 'trialing' || s.status === 'active' || s.status === 'past_due';
  const effectiveTier: Tier = hasPaidAccess ? s.tier : 'free';
  const entitlements = ENTITLEMENTS[effectiveTier];

  const trialDaysLeft = useMemo(() => {
    if (s.status !== 'trialing' || !s.trialEndsAt) return 0;
    return Math.max(0, Math.ceil((new Date(s.trialEndsAt).getTime() - Date.now()) / 86400000));
  }, [s.status, s.trialEndsAt]);

  const banner = useMemo<BillingCtx['banner']>(() => {
    if (s.status === 'trialing') return { kind: 'trial', text: `Free trial — ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left` };
    if (s.status === 'past_due') return { kind: 'past_due', text: 'Payment failed — we’re retrying. Update your card to avoid interruption.' };
    if (s.status === 'on_hold') return { kind: 'on_hold', text: 'Your plan is on hold. Update payment to restore access.' };
    return null;
  }, [s.status, trialDaysLeft]);

  const value: BillingCtx = {
    ...s,
    hydrated,
    live: LIVE,
    effectiveTier,
    entitlements,
    hasPaidAccess,
    trialDaysLeft,
    banner,
    canWatch: (t) => !t.premium || entitlements.premiumCatalog,

    // Live: create/find the Plinth customer (sets a cookie), then hydrate.
    // Mock: just record the viewer locally.
    signIn: async (name) => {
      if (LIVE) await postJSON('/api/plinth/customer');
      setS((p) => ({
        ...p,
        viewer: { name, customerId: null },
        profiles: [{ id: 'p1', name, color: '#f4456b' }],
        currentProfileId: 'p1',
      }));
      if (LIVE) await hydrateLive();
    },
    signOut: () => setS(() => ({ ...DEFAULT_STATE })),

    // Live: create the subscription and redirect to the Nomba checkout link.
    // Mock: start a local 7-day trial.
    subscribe: async (tier, interval, rail, withTrial = true) => {
      if (LIVE) {
        const d = await postJSON('/api/plinth/subscribe', { tier, interval, rail });
        if (d?.error) throw new Error(d.error);
        if (d?.checkoutLink) {
          // Pay-to-unlock → go to Nomba checkout. Caller keeps the spinner until we navigate.
          window.location.href = d.checkoutLink;
          return 'redirect';
        }
        // No-card trial / active → access already granted; just refresh state.
        await hydrateLive();
        return 'granted';
      }
      setS((p) => ({
        ...p,
        tier,
        interval,
        rail,
        status: withTrial ? 'trialing' : 'active',
        startedAt: new Date().toISOString(),
        trialEndsAt: withTrial ? addDays(7) : null,
        nextBillAt: withTrial ? addDays(7) : addDays(periodDays(interval)),
        profiles: p.profiles.slice(0, planFor(tier).screens),
      }));
      return 'granted';
    },

    // Upgrade/downgrade an existing subscription. Live → Plinth proration; mock → local switch.
    previewChange: async (tier, interval) => {
      if (LIVE) {
        const d = await postJSON('/api/plinth/change', { tier, interval, commit: false });
        return d?.preview ?? null;
      }
      return null;
    },
    changePlan: async (tier, interval) => {
      if (LIVE) {
        const d = await postJSON('/api/plinth/change', { tier, interval, commit: true });
        if (d?.checkoutLink) {
          // No card on file → pay for the upgrade on Nomba; the plan swaps when payment settles.
          // Stash the target so checkout/complete waits for THIS change to land (an upgrade keeps
          // state='active' throughout, so "state is active" alone can't tell that the swap happened).
          try { localStorage.setItem('plinth_pending_change', JSON.stringify({ tier, interval })); } catch {}
          window.location.href = d.checkoutLink;
          return 'redirect';
        }
        await hydrateLive();
        return 'done';
      }
      setS((p) => ({
        ...p,
        tier,
        interval,
        status: p.status === 'none' || p.status === 'canceled' ? 'active' : p.status,
        nextBillAt: p.nextBillAt ?? addDays(periodDays(interval)),
      }));
      return 'done';
    },

    convertTrial: () =>
      setS((p) => (p.status === 'trialing' ? { ...p, status: 'active', trialEndsAt: null, nextBillAt: addDays(periodDays(p.interval)) } : p)),

    changeTier: (tier) =>
      setS((p) => ({
        ...p,
        tier,
        status: p.status === 'none' || p.status === 'canceled' ? 'active' : p.status,
        nextBillAt: p.nextBillAt ?? addDays(periodDays(p.interval)),
      })),

    simulateRenewal: () =>
      setS((p) => (p.status === 'active' ? { ...p, nextBillAt: addDays(periodDays(p.interval)) } : p)),

    simulateFailure: () => setS((p) => (p.status === 'active' || p.status === 'trialing' ? { ...p, status: 'past_due' } : p)),
    escalate: () => setS((p) => (p.status === 'past_due' ? { ...p, status: 'on_hold' } : p)),
    recover: () => setS((p) => ({ ...p, status: 'active', nextBillAt: addDays(periodDays(p.interval)) })),
    cancel: () => setS((p) => ({ ...p, status: 'canceled' })),
    // Reset billing but stay signed in as the current viewer (for repeat demos).
    reset: () =>
      setS((p) => ({
        ...DEFAULT_STATE,
        viewer: p.viewer,
        profiles: p.viewer ? [{ id: 'p1', name: p.viewer.name, color: '#f4456b' }] : DEFAULT_STATE.profiles,
        currentProfileId: 'p1',
      })),

    addProfile: (name) => {
      let ok = true;
      setS((p) => {
        const max = ENTITLEMENTS[hasPaidAccess ? p.tier : 'free'].screens;
        if (p.profiles.length >= max) {
          ok = false;
          return p;
        }
        const color = PROFILE_COLORS[p.profiles.length % PROFILE_COLORS.length];
        return { ...p, profiles: [...p.profiles, { id: `p${Date.now()}`, name, color }] };
      });
      return ok;
    },
    removeProfile: (id) =>
      setS((p) => ({
        ...p,
        profiles: p.profiles.filter((x) => x.id !== id),
        currentProfileId: p.currentProfileId === id ? p.profiles[0]?.id ?? null : p.currentProfileId,
      })),
    selectProfile: (id) => setS((p) => ({ ...p, currentProfileId: id })),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBilling(): BillingCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useBilling must be used within BillingProvider');
  return c;
}
