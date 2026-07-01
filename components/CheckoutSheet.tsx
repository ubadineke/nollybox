'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Landmark, ShieldCheck, Check, Loader2, Copy } from 'lucide-react';
import { Sheet } from './Modal';
import { useBilling } from '@/lib/store';
import { planFor, type Interval, type Rail, type Tier } from '@/lib/plans';
import { naira } from '@/lib/format';

export function CheckoutSheet({
  open,
  onClose,
  tier,
  interval,
}: {
  open: boolean;
  onClose: () => void;
  tier: Tier;
  interval: Interval;
}) {
  const router = useRouter();
  const { subscribe, live } = useBilling();
  const [rail, setRail] = useState<Rail>('card');
  const [phase, setPhase] = useState<'form' | 'processing' | 'done'>('form');
  const [error, setError] = useState<string | null>(null);

  const plan = planFor(tier);
  const price = interval === 'annual' ? plan.priceAnnual : plan.priceMonthly;
  const per = interval === 'annual' ? 'year' : 'month';

  async function pay() {
    setPhase('processing');
    setError(null);
    // Live: subscribe() either navigates away to Nomba checkout (pay-to-unlock), starts a
    // no-card trial (returns, access granted), or throws.
    if (live) {
      try {
        const result = await subscribe(tier, interval, rail, true);
        if (result === 'redirect') {
          // Browser is navigating to Nomba checkout — keep the "Redirecting…" spinner; do NOT
          // show success (payment hasn't happened yet).
          return;
        }
        // 'granted' (no-card trial / already active) → safe to show success.
        setPhase('done');
        setTimeout(() => {
          onClose();
          setPhase('form');
          router.push('/account');
        }, 1000);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not start checkout. Check the Plinth API key and plan lookup keys.');
        setPhase('form');
      }
      return;
    }
    // Mock: simulate the charge locally.
    setTimeout(() => {
      subscribe(tier, interval, rail, true);
      setPhase('done');
      setTimeout(() => {
        onClose();
        setPhase('form');
        router.push('/account');
      }, 1100);
    }, 1300);
  }

  function reset() {
    setPhase('form');
    onClose();
  }

  return (
    <Sheet open={open} onClose={reset} title={phase === 'done' ? '' : `Subscribe to ${plan.name}`}>
      {phase === 'done' ? (
        <div className="flex flex-col items-center py-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
            <Check size={28} />
          </span>
          <p className="mt-3 font-display text-lg font-bold">You&apos;re in 🎉</p>
          <p className="mt-1 text-xs text-dim">You&apos;re subscribed to Nollybox {plan.name}. Enjoy!</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="rounded-xl bg-surface2 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">
                {plan.name} · <span className="capitalize text-dim">{interval}</span>
              </span>
              <span className="font-display text-base font-bold text-gold">
                {naira(price)}
                <span className="text-xs font-normal text-dim">/{per}</span>
              </span>
            </div>
            <p className="mt-1.5 text-[11px] text-dim">
              <span className="text-ink">{naira(price)}</span>/{per} · billed today · cancel anytime.
            </p>
          </div>

          {live ? (
            /* Live: Nomba's hosted page collects the card/transfer — we just hand off. */
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-line bg-surface2 p-3.5">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-400" />
              <p className="text-[11px] leading-relaxed text-dim">
                You&apos;ll enter your card (or pay by transfer) on <span className="text-ink">Nomba&apos;s secure checkout</span>.
                Your card is tokenized so renewals happen automatically.
              </p>
            </div>
          ) : (
            <>
              {/* Rail toggle (mock) */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <RailBtn active={rail === 'card'} onClick={() => setRail('card')} icon={<CreditCard size={15} />} label="Card" />
                <RailBtn active={rail === 'transfer'} onClick={() => setRail('transfer')} icon={<Landmark size={15} />} label="Bank transfer" />
              </div>

              {rail === 'card' ? (
                <div className="mt-3 space-y-2.5">
                  <Field label="Card number" value="5434 6210 7425 2808" />
                  <div className="grid grid-cols-2 gap-2.5">
                    <Field label="Expiry" value="12/30" />
                    <Field label="CVV" value="•••" />
                  </div>
                </div>
              ) : (
                <div className="mt-3 rounded-xl border border-line bg-surface2 p-3.5">
                  <p className="text-[11px] text-dim">Transfer to this Nomba account, then tap below.</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div>
                      <p className="font-display text-lg font-bold tracking-wide">7083 9921 04</p>
                      <p className="text-[11px] text-dim">Wema Bank · Nollybox / Nomba</p>
                    </div>
                    <button className="tap flex items-center gap-1 rounded-lg bg-surface px-2 py-1.5 text-[11px] text-gold">
                      <Copy size={12} /> Copy
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {error && (
            <p className="mt-3 rounded-lg bg-rose/10 px-3 py-2 text-[11px] text-rose">{error}</p>
          )}

          {/* Pay */}
          <button
            onClick={pay}
            disabled={phase === 'processing'}
            className="tap mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3 text-sm font-bold text-black shadow-glow disabled:opacity-70"
          >
            {phase === 'processing' ? (
              <>
                <Loader2 size={16} className="animate-spin" /> {live ? 'Redirecting…' : 'Processing…'}
              </>
            ) : live ? (
              'Continue to secure checkout'
            ) : rail === 'card' ? (
              'Subscribe'
            ) : (
              "I've made the transfer"
            )}
          </button>

          <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-dim">
            <ShieldCheck size={12} className="text-emerald-400" /> Secured by Nomba · Card tokenized for renewals
          </div>
        </>
      )}
    </Sheet>
  );
}

function RailBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`tap flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold ${
        active ? 'border-gold/50 bg-gold/10 text-gold' : 'border-line text-dim'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface2 px-3.5 py-2.5">
      <p className="text-[10px] text-dim">{label}</p>
      <p className="text-sm font-medium tracking-wide">{value}</p>
    </div>
  );
}
