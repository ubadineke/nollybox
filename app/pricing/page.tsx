'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Check, Sparkles } from 'lucide-react';
import { PLANS, type Interval, type Tier } from '@/lib/plans';
import { naira } from '@/lib/format';
import { useBilling } from '@/lib/store';
import { CheckoutSheet } from '@/components/CheckoutSheet';
import { ChangePlanSheet } from '@/components/ChangePlanSheet';

export default function PricingPage() {
  const router = useRouter();
  const { effectiveTier, hasPaidAccess, interval: currentInterval } = useBilling();
  const [interval, setInterval] = useState<Interval>('monthly');
  const [checkout, setCheckout] = useState<Tier | null>(null);
  const [change, setChange] = useState<Tier | null>(null);

  // Already paying → any different (tier, interval) is an upgrade/downgrade (proration).
  // Not paying yet → a fresh subscription (checkout).
  function onSelect(tier: Tier) {
    if (hasPaidAccess && effectiveTier === tier && currentInterval === interval) return; // current plan
    if (hasPaidAccess) setChange(tier);
    else setCheckout(tier);
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-line/60 bg-bg/85 px-4 py-3 backdrop-blur-lg">
        <button onClick={() => router.back()} className="tap -ml-1 rounded-full p-1.5 text-dim hover:text-ink">
          <ChevronLeft size={20} />
        </button>
        <h1 className="font-display text-lg font-bold">Choose your plan</h1>
      </div>

      <div className="px-4 pt-4">
        <p className="text-center text-sm text-dim">
          Stream the best of Nollywood. <span className="text-ink">Cancel anytime.</span>
        </p>

        {/* Interval toggle */}
        <div className="mx-auto mt-4 flex w-fit items-center gap-1 rounded-full border border-line bg-surface p-1">
          <ToggleBtn active={interval === 'monthly'} onClick={() => setInterval('monthly')} label="Monthly" />
          <ToggleBtn active={interval === 'annual'} onClick={() => setInterval('annual')} label="Annual" badge="Save 17%" />
        </div>

        {/* Plan cards */}
        <div className="mt-5 space-y-3">
          {PLANS.map((p) => {
            const price = interval === 'annual' ? p.priceAnnual : p.priceMonthly;
            const per = interval === 'annual' ? 'yr' : 'mo';
            const isCurrent = hasPaidAccess ? effectiveTier === p.tier && currentInterval === interval : effectiveTier === p.tier;
            const label = isCurrent
              ? 'Your current plan'
              : hasPaidAccess
              ? (p.tier === 'premium' ? 'Upgrade' : 'Switch to this plan')
              : 'Subscribe';
            return (
              <div
                key={p.tier}
                className={`relative rounded-2xl border p-4 ${
                  p.highlight ? 'border-gold/50 bg-gold/[0.06]' : 'border-line bg-surface'
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-2.5 left-4 flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-black">
                    <Sparkles size={10} /> MOST POPULAR
                  </span>
                )}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-lg font-bold">{p.name}</h3>
                    <p className="text-[11px] text-dim">{p.tagline}</p>
                  </div>
                  <div className="text-right">
                    {p.tier === 'free' ? (
                      <p className="font-display text-xl font-extrabold">Free</p>
                    ) : (
                      <p className="font-display text-xl font-extrabold">
                        {naira(price)}
                        <span className="text-xs font-normal text-dim">/{per}</span>
                      </p>
                    )}
                  </div>
                </div>

                <ul className="mt-3 space-y-1.5">
                  {p.perks.map((perk) => (
                    <li key={perk} className="flex items-center gap-2 text-xs text-white/85">
                      <Check size={14} className={p.highlight ? 'text-gold' : 'text-emerald-400'} />
                      {perk}
                    </li>
                  ))}
                </ul>

                {p.tier === 'free' ? (
                  <button
                    disabled
                    className="tap mt-4 w-full rounded-xl border border-line py-2.5 text-sm font-semibold text-dim"
                  >
                    {isCurrent ? 'Your current plan' : 'Free forever'}
                  </button>
                ) : (
                  <button
                    onClick={() => onSelect(p.tier)}
                    disabled={isCurrent}
                    className={`tap mt-4 w-full rounded-xl py-2.5 text-sm font-bold disabled:opacity-60 ${
                      p.highlight ? 'bg-gold text-black shadow-glow' : 'bg-surface2 text-ink ring-1 ring-line'
                    }`}
                  >
                    {label}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-dim">
          Billing handled by <span className="font-semibold text-gold">Plinth</span> on Nomba. Pay by card or bank
          transfer. Billed today · cancel anytime.
        </p>
        <div className="h-6" />
      </div>

      <CheckoutSheet
        open={checkout !== null}
        onClose={() => setCheckout(null)}
        tier={checkout ?? 'standard'}
        interval={interval}
      />
      <ChangePlanSheet
        open={change !== null}
        onClose={() => setChange(null)}
        tier={change ?? 'premium'}
        interval={interval}
      />
    </div>
  );
}

function ToggleBtn({ active, onClick, label, badge }: { active: boolean; onClick: () => void; label: string; badge?: string }) {
  return (
    <button
      onClick={onClick}
      className={`tap flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold ${
        active ? 'bg-gold text-black' : 'text-dim'
      }`}
    >
      {label}
      {badge && (
        <span className={`rounded px-1 py-px text-[9px] font-bold ${active ? 'bg-black/20 text-black' : 'bg-emerald-500/20 text-emerald-400'}`}>
          {badge}
        </span>
      )}
    </button>
  );
}
