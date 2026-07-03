'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Check, AlertTriangle } from 'lucide-react';
import { Brand } from '@/components/Brand';

type Phase = 'confirming' | 'done' | 'timeout';

// Nomba redirects here after the hosted checkout. The card payment is confirmed
// asynchronously via the payment_success webhook (Nomba → Plinth), so we poll
// Plinth for the subscription to flip to `active`/`trialing` before letting the
// user in. This rides out normal webhook latency instead of showing a blank page.
export default function CheckoutCompletePage() {
  const params = useSearchParams();
  const [phase, setPhase] = useState<Phase>('confirming');

  useEffect(() => {
    let alive = true;
    const deadline = Date.now() + 30_000;

    // A plan change (upgrade) keeps the subscription 'active' the whole time, so "state is active"
    // can't tell that the swap actually landed. store.changePlan stashes the intended target before
    // redirecting; when present, we wait until the account reflects that tier/interval before leaving.
    let target: { tier: string; interval: string } | null = null;
    let recovering = false;
    try {
      const raw = localStorage.getItem('plinth_pending_change');
      if (raw) target = JSON.parse(raw);
      recovering = localStorage.getItem('plinth_pending_recovery') === '1';
    } catch {}

    // TEMPORARY: trigger reconciliation so bank-transfer payments activate without a webhook.
    // Remove this block (and /api/plinth/activate) once production webhooks are configured.
    const orderReference = params.get('orderReference');
    if (orderReference) {
      fetch('/api/plinth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderReference }),
      }).catch(() => {});
    }

    function finish() {
      try { localStorage.removeItem('plinth_pending_change'); localStorage.removeItem('plinth_pending_recovery'); } catch {}
      if (!alive) return;
      setPhase('done');
      // Hard navigation so BillingProvider remounts and re-runs hydrateLive() with the settled
      // subscription. A client-side router.replace() keeps the old stale state in the mounted provider.
      setTimeout(() => { window.location.href = '/account'; }, 900);
    }

    async function poll() {
      try {
        const res = await fetch('/api/plinth/account', { cache: 'no-store' });
        const d = await res.json();
        const sub = d?.subscription;
        const activeNow = sub?.state === 'active' || sub?.state === 'trialing' || sub?.state === 'past_due';
        // Change: wait for the target plan. Recovery: wait for a full 'active' (dunning states still
        // report access, so we can't use activeNow). Subscribe: wait for access.
        const done = target
          ? activeNow && sub?.tier === target.tier && sub?.interval === target.interval
          : recovering
            ? sub?.state === 'active'
            : activeNow;
        if (done) { finish(); return; }
      } catch {
        // transient — keep polling
      }
      if (!alive) return;
      if (Date.now() > deadline) {
        try { localStorage.removeItem('plinth_pending_change'); localStorage.removeItem('plinth_pending_recovery'); } catch {}
        setPhase('timeout');
        return;
      }
      setTimeout(poll, 1500);
    }

    poll();
    return () => {
      alive = false;
    };
  }, [params]);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-center justify-between border-b border-line/60 bg-bg/85 px-4 py-3">
        <Brand size="sm" />
        <span className="font-display text-sm font-bold text-dim">Checkout</span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        {phase === 'confirming' && (
          <>
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-gold">
              <Loader2 size={26} className="animate-spin" />
            </span>
            <p className="mt-4 font-display text-lg font-bold">Confirming your payment…</p>
            <p className="mt-1 max-w-xs text-xs text-dim">
              Nomba is settling the charge and Plinth is activating your subscription. This takes just a few seconds.
            </p>
          </>
        )}

        {phase === 'done' && (
          <>
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <Check size={28} />
            </span>
            <p className="mt-4 font-display text-lg font-bold">You&apos;re in 🎉</p>
            <p className="mt-1 text-xs text-dim">Payment confirmed. Taking you to your account…</p>
          </>
        )}

        {phase === 'timeout' && (
          <>
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-400">
              <AlertTriangle size={26} />
            </span>
            <p className="mt-4 font-display text-lg font-bold">Still confirming…</p>
            <p className="mt-1 max-w-xs text-xs text-dim">
              We haven&apos;t heard back from Nomba yet. If you completed the payment, it will appear on your account
              shortly. If it was cancelled, you can try again.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <Link
                href="/account"
                className="tap rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-black shadow-glow"
              >
                Go to account
              </Link>
              <Link
                href="/pricing"
                className="tap rounded-xl bg-surface2 px-4 py-2.5 text-sm font-semibold text-ink ring-1 ring-line"
              >
                Try again
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
