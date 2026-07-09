'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  CreditCard, Landmark, Users, RefreshCw, ArrowUpRight, AlertTriangle, Clock,
  Check, XCircle, Receipt, ChevronRight,
} from 'lucide-react';
import { useBilling } from '@/lib/store';
import { planFor } from '@/lib/plans';
import { naira, shortDate } from '@/lib/format';
import { Brand } from '@/components/Brand';

interface Invoice {
  id: string; state: string; amount_due: string; amount_paid: string;
  due_at: string | null; closed_at: string | null; created_at: string;
}

export default function AccountPage() {
  const b = useBilling();
  const [recovering, setRecovering] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Real invoices from Plinth — their dates are in simulated (engine) time, so the history is accurate.
  useEffect(() => {
    let alive = true;
    fetch('/api/plinth/invoices', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (alive && Array.isArray(d?.data)) setInvoices(d.data); })
      .catch(() => {});
    return () => { alive = false; };
  }, [b.status, b.tier]);
  const [keeping, setKeeping] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [resuming, setResuming] = useState(false);
  const plan = planFor(b.tier);
  const price = b.interval === 'annual' ? plan.priceAnnual : plan.priceMonthly;
  const per = b.interval === 'annual' ? 'year' : 'month';

  const isPaid = b.status === 'trialing' || b.status === 'active' || b.status === 'past_due' || b.status === 'on_hold';
  const needsAttention = b.status === 'past_due' || b.status === 'on_hold';

  // Canceling at period end: still has access until endsAt, then drops to Free. Shown instead of the
  // renew line / scheduled-change banner (a canceling sub won't renew, so a pending downgrade is moot).
  const cancelingAtPeriodEnd = b.cancelAtPeriodEnd && isPaid;
  // A scheduled downgrade: the current (higher) plan stays until effectiveAt, then switches.
  const sched = b.scheduledChange;
  const schedPlan = sched?.tier && !cancelingAtPeriodEnd ? planFor(sched.tier) : null;
  const billing = billingRows(b, invoices);

  async function updatePayment() {
    setRecovering(true);
    try {
      const outcome = await b.updatePayment();
      if (outcome === 'redirect') return; // navigating to Nomba checkout — keep the spinner
    } finally {
      setRecovering(false);
    }
  }

  async function keepCurrent() {
    setKeeping(true);
    try { await b.cancelScheduledChange(); } finally { setKeeping(false); }
  }

  async function cancelSub() {
    setCanceling(true);
    try { await b.cancel(); } finally { setCanceling(false); }
  }

  async function resumeSub() {
    setResuming(true);
    try { await b.reactivate(); } finally { setResuming(false); }
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
          {b.status === 'active' && b.nextBillAt && !cancelingAtPeriodEnd && (
            <p className="mt-2 text-xs text-dim">
              Renews <span className="text-ink">{shortDate(b.nextBillAt)}</span> · {naira(price)}/{per} ·{' '}
              <span className="capitalize">{b.rail === 'card' ? 'Card' : 'Bank transfer'}</span>
            </p>
          )}
          {/* Transfer-funded (no card on file): renewal needs a manual payment each cycle. */}
          {b.status === 'active' && !b.hasCard && b.effectiveTier !== 'free' && !cancelingAtPeriodEnd && (
            <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-dim">
              <Landmark size={12} className="mt-px shrink-0" />
              No card on file — you’ll pay by transfer each renewal. Add a card at your next payment for automatic renewal.
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

          {/* Scheduled change (e.g. a downgrade): keep the current plan until it switches at renewal */}
          {schedPlan && (
            <div className="mt-3 rounded-xl border border-gold/25 bg-gold/[0.06] p-3">
              <p className="flex items-start gap-1.5 text-xs text-ink">
                <Clock size={14} className="mt-px shrink-0 text-gold" />
                <span>
                  Switching to <span className="font-semibold">Nollybox {schedPlan.name}</span>
                  {sched?.effectiveAt ? <> on <span className="font-semibold">{shortDate(sched.effectiveAt)}</span></> : ' at your next renewal'}.
                  You keep {plan.name} until then.
                </span>
              </p>
              <button
                onClick={keepCurrent}
                disabled={keeping}
                className="tap mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg bg-surface2 py-2 text-xs font-bold text-ink ring-1 ring-line disabled:opacity-70"
              >
                {keeping ? <><RefreshCw size={13} className="animate-spin" /> Keeping…</> : <><XCircle size={13} /> Keep {plan.name} instead</>}
              </button>
            </div>
          )}

          {/* Canceling at period end: keep access until endsAt, then drop to Free — offer to resume */}
          {cancelingAtPeriodEnd && (
            <div className="mt-3 rounded-xl border border-rose/25 bg-rose/[0.06] p-3">
              <p className="flex items-start gap-1.5 text-xs text-ink">
                <AlertTriangle size={14} className="mt-px shrink-0 text-rose" />
                <span>
                  Canceled — you keep <span className="font-semibold">{plan.name}</span>
                  {b.endsAt ? <> until <span className="font-semibold">{shortDate(b.endsAt)}</span></> : ' until your period ends'},
                  then it switches to Nollybox Free. Won’t renew.
                </span>
              </p>
              <button
                onClick={resumeSub}
                disabled={resuming}
                className="tap mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg bg-gold py-2 text-xs font-bold text-black shadow-glow disabled:opacity-70"
              >
                {resuming ? <><RefreshCw size={13} className="animate-spin" /> Resuming…</> : <><RefreshCw size={13} /> Resume subscription</>}
              </button>
            </div>
          )}

          {/* primary CTA — on dunning, offer BOTH rails (card failed? pay by transfer to recover) */}
          {needsAttention ? (
            <div className="mt-3 space-y-2">
              <p className="px-0.5 text-[11px] text-dim">Update your payment — pay by card, or by bank transfer.</p>
              <button
                onClick={updatePayment}
                disabled={recovering}
                className="tap flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3 text-sm font-bold text-black shadow-glow disabled:opacity-70"
              >
                {recovering ? <><RefreshCw size={15} className="animate-spin" /> Updating…</> : <><CreditCard size={15} /> Pay by card</>}
              </button>
              <button
                onClick={() => { window.location.href = '/pay-transfer'; }}
                className="tap flex w-full items-center justify-center gap-2 rounded-xl bg-surface2 py-3 text-sm font-bold text-ink ring-1 ring-line"
              >
                <Landmark size={15} /> Pay by bank transfer
              </button>
            </div>
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

        {/* Quick upgrade nudge for Standard/Medium → Premium */}
        {(b.effectiveTier === 'standard' || b.effectiveTier === 'medium') && (
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
            {billing.map((h, i) => (
              <div key={i} className="flex items-center gap-3 border-b border-line/60 px-4 py-3 last:border-0">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full ${h.tone}`}>{h.icon}</span>
                <div className="flex-1">
                  <p className="text-xs font-medium text-ink">{h.label}</p>
                  <p className="text-[10px] text-dim">{h.date}</p>
                </div>
                <span className="text-xs font-semibold text-ink">{h.amount}</span>
              </div>
            ))}
            {billing.length === 0 && <p className="px-4 py-5 text-center text-xs text-dim">No charges yet.</p>}
          </div>
        </div>

        {/* Cancel / resubscribe. Hidden while already canceling (the hero banner offers Resume). */}
        {isPaid && !cancelingAtPeriodEnd && (
          <button
            onClick={cancelSub}
            disabled={canceling}
            className="tap w-full py-2 text-center text-xs font-medium text-dim hover:text-rose disabled:opacity-60"
          >
            {canceling ? 'Canceling…' : 'Cancel subscription'}
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

// Prefer REAL Plinth invoices (dates in simulated/engine time). Falls back to the derived rows in
// mock mode / before invoices load.
function billingRows(b: ReturnType<typeof useBilling>, invoices: Invoice[]) {
  if (invoices.length === 0) return history(b);
  const planName = planFor(b.tier).name;
  const dunning = b.status === 'past_due' || b.status === 'on_hold';
  const rowDate = (i: Invoice) => (i.state === 'paid' ? (i.closed_at ?? i.created_at) : (i.due_at ?? i.created_at));
  return invoices
    .filter((i) => i.state !== 'void')
    .sort((a, z) => new Date(rowDate(z)).getTime() - new Date(rowDate(a)).getTime())
    .map((i) => {
      const amount = naira(Number(i.state === 'paid' ? i.amount_paid : i.amount_due));
      const date = shortDate(rowDate(i));
      if (i.state === 'paid') {
        return { label: `${planName} subscription`, date, amount, icon: <Check size={14} className="text-emerald-400" />, tone: 'bg-emerald-500/15' };
      }
      if (i.state === 'uncollectible' || (i.state === 'open' && dunning)) {
        return { label: `${planName} renewal — failed`, date, amount, icon: <XCircle size={14} className="text-rose" />, tone: 'bg-rose/15' };
      }
      return { label: `${planName} renewal — due`, date, amount, icon: <Clock size={14} className="text-gold" />, tone: 'bg-gold/15' };
    });
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
