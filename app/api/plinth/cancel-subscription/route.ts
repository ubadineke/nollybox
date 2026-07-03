import { NextResponse } from 'next/server';
import { PLINTH_MODE, plinth } from '@/lib/plinth';
import { getOrCreateCustomerId } from '@/lib/session';

// Cancel the customer's subscription. The engine honors the tenant's cancel_policy:
// end_of_period keeps access until the period end, then ends it at the next renewal tick.
export async function POST() {
  if (PLINTH_MODE !== 'live') return NextResponse.json({ mode: 'mock', connected: false });

  const customerId = await getOrCreateCustomerId();
  const sub = await plinth.activeSubscriptionFor(customerId);
  if (!sub) return NextResponse.json({ mode: 'live', canceled: false });

  const result = await plinth.cancelSubscription(sub.id);
  return NextResponse.json({ mode: 'live', canceled: true, result });
}
