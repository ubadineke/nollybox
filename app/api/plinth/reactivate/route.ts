import { NextResponse } from 'next/server';
import { PLINTH_MODE, plinth } from '@/lib/plinth';
import { getOrCreateCustomerId } from '@/lib/session';

// Undo a still-pending end_of_period cancel — keep the subscription.
export async function POST() {
  if (PLINTH_MODE !== 'live') return NextResponse.json({ mode: 'mock', connected: false });

  const customerId = await getOrCreateCustomerId();
  const sub = await plinth.activeSubscriptionFor(customerId);
  if (!sub) return NextResponse.json({ mode: 'live', reactivated: false });

  const result = await plinth.reactivateSubscription(sub.id);
  return NextResponse.json({ mode: 'live', reactivated: true, result });
}
