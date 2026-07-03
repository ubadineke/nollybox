import { NextResponse } from 'next/server';
import { PLINTH_MODE, plinth } from '@/lib/plinth';
import { getOrCreateCustomerId } from '@/lib/session';

// Cancel the pending period-end change on the customer's active subscription
// (e.g. "Keep Standard" instead of the scheduled downgrade to Medium).
export async function POST() {
  if (PLINTH_MODE !== 'live') return NextResponse.json({ mode: 'mock', connected: false });

  const customerId = await getOrCreateCustomerId();
  const sub = await plinth.activeSubscriptionFor(customerId);
  if (!sub?.scheduled_change) return NextResponse.json({ mode: 'live', canceled: false });

  await plinth.cancelScheduledChange(sub.id, sub.scheduled_change.id);
  return NextResponse.json({ mode: 'live', canceled: true });
}
