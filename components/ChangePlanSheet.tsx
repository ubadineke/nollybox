'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Loader2, Check, Clock } from 'lucide-react';
import { Sheet } from './Modal';
import { useBilling, type ChangePreview } from '@/lib/store';
import { planFor, type Interval, type Tier } from '@/lib/plans';
import { naira, shortDate } from '@/lib/format';

// Upgrade/downgrade an existing subscription — shows the proration preview, then commits.
export function ChangePlanSheet({
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
  const { live, previewChange, changePlan, tier: currentTier } = useBilling();
  const [preview, setPreview] = useState<ChangePreview | null>(null);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'working' | 'done'>('loading');
  const [error, setError] = useState<string | null>(null);

  const plan = planFor(tier);
  const price = interval === 'annual' ? plan.priceAnnual : plan.priceMonthly;
  const isUpgrade = tier === 'premium' && currentTier !== 'premium';

  useEffect(() => {
    if (!open) return;
    setPhase('loading');
    setPreview(null);
    setError(null);
    (async () => {
      if (live) {
        const p = await previewChange(tier, interval).catch(() => null);
        setPreview(p);
      }
      setPhase('ready');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tier, interval]);

  async function confirm() {
    setPhase('working');
    setError(null);
    try {
      const outcome = await changePlan(tier, interval);
      // No card → redirecting to Nomba checkout; keep the spinner while the browser navigates away.
      if (outcome === 'redirect') return;
    } catch (e: any) {
      // e.g. no_payment_method — surface it and let the user retry instead of hanging.
      const msg = String(e?.message ?? '');
      setError(
        /payment method|no_payment_method|add a card/i.test(msg)
          ? 'You paid by bank transfer, so there’s no card on file to charge the upgrade. Pay for the new plan by transfer instead, or add a card first.'
          : msg || 'Could not switch plans. Please try again.',
      );
      setPhase('ready');
      return;
    }
    setPhase('done');
    setTimeout(() => {
      onClose();
      setPhase('loading');
      router.push('/account');
    }, 1000);
  }

  return (
    <Sheet open={open} onClose={onClose} title={phase === 'done' ? '' : `Switch to ${plan.name}`}>
      {phase === 'done' ? (
        preview?.scheduledFor ? (
          // Deferred change (e.g. a downgrade): current plan stays until the switch date.
          <div className="flex flex-col items-center py-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-gold">
              <Clock size={26} />
            </span>
            <p className="mt-3 font-display text-lg font-bold">{plan.name} scheduled</p>
            <p className="mt-1 max-w-xs text-xs text-dim">
              Switches on <span className="text-ink font-semibold">{shortDate(preview.scheduledFor)}</span>. You keep your
              current plan until then — you can undo this from Account.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center py-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <Check size={28} />
            </span>
            <p className="mt-3 font-display text-lg font-bold">You&apos;re on {plan.name}</p>
          </div>
        )
      ) : (
        <>
          <div className="rounded-xl bg-surface2 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">
                {plan.name} · <span className="capitalize text-dim">{interval}</span>
              </span>
              <span className="font-display text-base font-bold text-gold">
                {naira(price)}
                <span className="text-xs font-normal text-dim">/{interval === 'annual' ? 'yr' : 'mo'}</span>
              </span>
            </div>

            {/* Proration */}
            {phase === 'loading' ? (
              <p className="mt-2 flex items-center gap-1.5 text-[11px] text-dim">
                <Loader2 size={12} className="animate-spin" /> Calculating proration…
              </p>
            ) : live && preview ? (
              Number(preview.dueNowMinor) > 0 ? (
                <p className="mt-1.5 text-[11px] text-dim">
                  You&apos;ll be charged <span className="text-ink font-semibold">{naira(Number(preview.dueNowMinor))}</span> now
                  (prorated for the rest of this period).
                </p>
              ) : Number(preview.creditMinor) > 0 ? (
                <p className="mt-1.5 text-[11px] text-dim">
                  <span className="text-ink font-semibold">{naira(Number(preview.creditMinor))}</span> credit applied — the new
                  price takes effect at your next renewal.
                </p>
              ) : (
                <p className="mt-1.5 text-[11px] text-dim">Change takes effect at your next renewal — nothing due now.</p>
              )
            ) : (
              <p className="mt-1.5 text-[11px] text-dim">
                {isUpgrade
                  ? 'Upgrade now — you’ll be charged the prorated difference.'
                  : 'Your plan will change at the next renewal.'}
              </p>
            )}
          </div>

          {error && (
            <p className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-[11px] leading-relaxed text-rose-300">
              {error}
            </p>
          )}

          <button
            onClick={confirm}
            disabled={phase === 'working'}
            className="tap mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3 text-sm font-bold text-black shadow-glow disabled:opacity-70"
          >
            {phase === 'working' ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Applying…
              </>
            ) : (
              <>
                {isUpgrade ? 'Upgrade' : 'Switch'} to {plan.name} <ArrowUpRight size={15} />
              </>
            )}
          </button>
        </>
      )}
    </Sheet>
  );
}
