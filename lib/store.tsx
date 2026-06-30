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
function addDays(d: number): string {
  return new Date(Date.now() + d * 86400000).toISOString();
}
function periodDays(interval: Interval): number {
  return interval === 'annual' ? 365 : 30;
}

interface BillingCtx extends BillingState {
  hydrated: boolean;
  effectiveTier: Tier;
  entitlements: Entitlements;
  hasPaidAccess: boolean;
  trialDaysLeft: number;
  canWatch: (t: Title) => boolean;
  banner: { kind: 'trial' | 'past_due' | 'on_hold'; text: string } | null;
  // actions
  signIn: (name: string) => void;
  signOut: () => void;
  subscribe: (tier: Tier, interval: Interval, rail: Rail, withTrial?: boolean) => void;
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
    effectiveTier,
    entitlements,
    hasPaidAccess,
    trialDaysLeft,
    banner,
    canWatch: (t) => !t.premium || entitlements.premiumCatalog,

    // In live mode the server route would create/find the Plinth customer here and
    // return the customerId; in mock mode we just record the viewer locally.
    signIn: (name) =>
      setS((p) => ({
        ...p,
        viewer: { name, customerId: null },
        profiles: [{ id: 'p1', name, color: '#f4456b' }],
        currentProfileId: 'p1',
      })),
    signOut: () => setS(() => ({ ...DEFAULT_STATE })),

    subscribe: (tier, interval, rail, withTrial = true) =>
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
      })),

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
