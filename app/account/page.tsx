'use client';
import Link from 'next/link';
import { useState } from 'react';
import {
  CreditCard, Landmark, Users, RefreshCw, ArrowUpRight, AlertTriangle, Clock,
  Check, XCircle, Receipt, ChevronRight,
} from 'lucide-react';
import { useBilling } from '@/lib/store';
import { planFor } from '@/lib/plans';
import { naira, shortDate } from '@/lib/format';
import { Brand } from '@/components/Brand';

export default function AccountPage() {
  const b = useBilling();
  const [recovering, setRecovering] = useState(false);
  const plan = planFor(b.tier);
  const price = b.interval === 'annual' ? plan.priceAnnual : plan.priceMonthly;
  const per = b.interval === 'annual' ? 'year' : 'month';

  const isPaid = b.status === 'trialing' || b.status === 'active' || b.status === 'past_due' || b.status === 'on_hold';
  const needsAttention = b.status === 'past_due' || b.status === 'on_hold';

  function updatePayment() {
    setRecovering(true);
    setTimeout(() => {
      b.recover();
      setRecovering(false);
    }, 1200);
  }

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-line/60 bg-bg/85 px-4 py-3 backdrop-blur-lg">
        <Brand size="sm" />
        <span className="font-display text-sm font-bold text-dim">Account</span>
      </div>

      <div className="space-y-4 px-4 py-4">
        {/* Plan hero */}
        <div className={`rounded-2xl border p-4 ${needsAttention ? 'border-rose/40 bg-rose/[0.06]' : 'border-line bg-surface'}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] text-dim">Current plan</p>
              <h1 className="font-display text-2xl font-extrabold">
                Nollybox {b.effectiveTier === 'free' ? 'Free' : plan.name}
              </h1>
            </div>
            <StatusPill status={b.status} />
          </div>

          {/* status-specific line */}
          {b.status === 'trialing' && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-gold">
              <Clock size={14} /> Free trial — {b.trialDaysLeft} day{b.trialDaysLeft === 1 ? '' : 's'} left. First charge{' '}
              {b.nextBillAt ? shortDate(b.nextBillAt) : ''}.
            </p>
          )}
          {b.status === 'active' && b.nextBillAt && (
            <p className="mt-2 text-xs text-dim">
              Renews <span className="text-ink">{shortDate(b.nextBillAt)}</span> · {naira(price)}/{per} ·{' '}
              <span className="capitalize">{b.rail === 'card' ? 'Card' : 'Bank transfer'}</span>
            </p>
          )}
          {needsAttention && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-rose">
              <AlertTriangle size={14} className="mt-px shrink-0" />
              {b.status === 'past_due'
                ? 'We couldn’t charge your card. We’re retrying — update payment to avoid losing access.'
                : 'Your plan is on hold. Premium titles are locked until payment is restored.'}
            </p>
          )}

          {/* primary CTA */}
          {needsAttention ? (
            <button
              onClick={updatePayment}
              disabled={recovering}
              className="tap mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3 text-sm font-bold text-black shadow-glow disabled:opacity-70"
            >
              {recovering ? <><RefreshCw size={15} className="animate-spin" /> Updating…</> : <><CreditCard size={15} /> Update payment</>}
            </button>
          ) : b.effectiveTier === 'free' ? (
            <Link
              href="/pricing"
              className="tap mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3 text-sm font-bold text-black shadow-glow"
            >
              Go Premium <ArrowUpRight size={15} />
            </Link>
          ) : (
            <Link
              href="/pricing"
              className="tap mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-surface2 py-3 text-sm font-bold text-ink ring-1 ring-line"
            >
              Change plan
            </Link>
          )}
        </div>

        {/* Details (only when on a paid plan) */}
        {isPaid && (
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            <DetailRow
              icon={b.rail === 'card' ? <CreditCard size={16} /> : <Landmark size={16} />}
              label="Payment method"
              value={b.rail === 'card' ? 'Card •••• 2808' : 'Bank transfer · Wema'}
            />
            <DetailRow
              icon={<Users size={16} />}
              label="Screens"
              value={`${b.profiles.length} of ${b.entitlements.screens} in use`}
              href="/profiles"
            />
            <DetailRow
              icon={<Receipt size={16} />}
              label="Next charge"
              value={b.status === 'trialing' ? `${naira(price)} on ${b.nextBillAt ? shortDate(b.nextBillAt) : '—'}` : b.nextBillAt ? shortDate(b.nextBillAt) : '—'}
            />
          </div>
        )}

        {/* Quick upgrade nudge for Standard → Premium */}
        {b.effectiveTier === 'standard' && (
          <Link href="/pricing" className="tap flex items-center gap-3 rounded-2xl border border-gold/30 bg-gold/[0.06] p-3.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/15 text-gold">
              <Users size={17} />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink">Upgrade to Premium</p>
              <p className="text-[11px] text-dim">4 screens, 4K & downloads for the family</p>
            </div>
            <ChevronRight size={18} className="text-gold" />
          </Link>
        )}

        {/* Billing history */}
        <div>
          <h2 className="mb-2 px-1 font-display text-sm font-bold text-dim">Billing history</h2>
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            {history(b).map((h, i) => (
              <div key={i} className="flex items-center gap-3 border-b border-line/60 px-4 py-3 last:border-0">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full ${h.tone}`}>{h.icon}</span>
                <div className="flex-1">
                  <p className="text-xs font-medium text-ink">{h.label}</p>
                  <p className="text-[10px] text-dim">{h.date}</p>
                </div>
                <span className="text-xs font-semibold text-ink">{h.amount}</span>
              </div>
            ))}
            {history(b).length === 0 && <p className="px-4 py-5 text-center text-xs text-dim">No charges yet.</p>}
          </div>
        </div>

        {/* Cancel / resubscribe */}
        {isPaid && (
          <button onClick={b.cancel} className="tap w-full py-2 text-center text-xs font-medium text-dim hover:text-rose">
            Cancel subscription
          </button>
        )}
        {b.status === 'canceled' && (
          <Link href="/pricing" className="tap block w-full rounded-xl bg-gold py-3 text-center text-sm font-bold text-black">
            Resubscribe
          </Link>
        )}

        <button onClick={b.signOut} className="tap mx-auto block py-1 text-center text-[11px] font-medium text-dim hover:text-ink">
          Sign out
        </button>

        <p className="pt-1 text-center text-[10px] text-dim">
          Subscriptions powered by <span className="font-semibold text-gold">Plinth</span> · settled on Nomba
        </p>
        <div className="h-2" />
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    none: 'bg-surface2 text-dim',
    trialing: 'bg-gold/15 text-gold',
    active: 'bg-emerald-500/15 text-emerald-400',
    past_due: 'bg-amber-500/15 text-amber-300',
    on_hold: 'bg-rose/15 text-rose',
    canceled: 'bg-surface2 text-dim',
  };
  const label = status === 'past_due' ? 'past due' : status === 'on_hold' ? 'on hold' : status;
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${map[status] ?? map.none}`}>{label}</span>;
}

function DetailRow({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  const inner = (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="text-dim">{icon}</span>
      <span className="text-xs text-dim">{label}</span>
      <span className="ml-auto flex items-center gap-1 text-xs font-medium text-ink">
        {value}
        {href && <ChevronRight size={14} className="text-dim" />}
      </span>
    </div>
  );
  return href ? (
    <Link href={href} className="tap block border-b border-line/60 last:border-0">
      {inner}
    </Link>
  ) : (
    <div className="border-b border-line/60 last:border-0">{inner}</div>
  );
}

function history(b: ReturnType<typeof useBilling>) {
  const plan = planFor(b.tier);
  const price = b.interval === 'annual' ? plan.priceAnnual : plan.priceMonthly;
  const today = shortDate(new Date().toISOString());
  const rows: { label: string; date: string; amount: string; icon: React.ReactNode; tone: string }[] = [];

  if (b.status === 'none') return rows;

  if (b.status === 'on_hold' || b.status === 'past_due') {
    rows.push({
      label: `${plan.name} renewal — failed`,
      date: today,
      amount: naira(price),
      icon: <XCircle size={14} className="text-rose" />,
      tone: 'bg-rose/15',
    });
  }
  if (b.status === 'active') {
    rows.push({
      label: `${plan.name} subscription`,
      date: today,
      amount: naira(price),
      icon: <Check size={14} className="text-emerald-400" />,
      tone: 'bg-emerald-500/15',
    });
  }
  rows.push({
    label: 'Free trial started',
    date: b.startedAt ? shortDate(b.startedAt) : today,
    amount: naira(0),
    icon: <Clock size={14} className="text-gold" />,
    tone: 'bg-gold/15',
  });
  return rows;
}
