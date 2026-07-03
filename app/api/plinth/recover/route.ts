import { NextResponse } from 'next/server';
import { PLINTH_MODE, plinth } from '@/lib/plinth';
import { getOrCreateCustomerId } from '@/lib/session';

// "Update payment" for a subscription stuck in dunning (past_due/grace/delinquent). Returns a Nomba
// checkout link to settle the outstanding invoice; the payment webhook recovers the sub to active.
export async function POST() {
  if (PLINTH_MODE !== 'live') return NextResponse.json({ mode: 'mock', connected: false });

  const customerId = await getOrCreateCustomerId();
  const sub = await plinth.activeSubscriptionFor(customerId);
  if (!sub) return NextResponse.json({ mode: 'live', error: 'no_subscription' }, { status: 400 });

  const { checkoutLink } = await plinth.recoverCheckout(sub.id);
  return NextResponse.json({ mode: 'live', checkoutLink });
}
