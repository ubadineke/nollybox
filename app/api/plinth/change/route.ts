import { NextResponse } from 'next/server';
import { PLINTH_MODE, plinth } from '@/lib/plinth';
import { getOrCreateCustomerId } from '@/lib/session';

// Upgrade/downgrade an existing subscription.
//   POST { tier, interval, commit: false } → proration preview (no charge)
//   POST { tier, interval, commit: true }  → apply the change (charges/credits per policy)
export async function POST(request: Request) {
  if (PLINTH_MODE !== 'live') return NextResponse.json({ mode: 'mock', connected: false });

  const customerId = await getOrCreateCustomerId();
  const { tier, interval, commit } = await request.json();
  const sub = await plinth.activeSubscriptionFor(customerId);
  if (!sub) return NextResponse.json({ error: 'no_active_subscription' }, { status: 400 });

  try {
    if (commit) {
      try {
        const result = await plinth.commitChange(sub.id, tier, interval);
        return NextResponse.json({ mode: 'live', committed: true, result });
      } catch (e: any) {
        // No card on file → don't dead-end; collect the prorated amount via Nomba checkout.
        // The plan swaps when the payment settles (webhook applies the pending change).
        if (e?.code === 'no_payment_method') {
          const co = await plinth.changeCheckout(sub.id, tier, interval);
          return NextResponse.json({ mode: 'live', committed: false, checkoutLink: co.checkoutLink });
        }
        throw e;
      }
    }
    const preview = await plinth.previewChange(sub.id, tier, interval);
    return NextResponse.json({ mode: 'live', preview });
  } catch (e: any) {
    // Pass the engine's reason + status through so the UI can show it (not a 500 spinner).
    return NextResponse.json({ error: e?.message ?? 'change_failed', code: e?.code }, { status: e?.status ?? 502 });
  }
}
