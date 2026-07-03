import { NextResponse } from 'next/server';
import { PLINTH_MODE, plinth } from '@/lib/plinth';
import { getOrCreateCustomerId } from '@/lib/session';

// The dedicated virtual account + amount due for the customer's current subscription (transfer rail).
// Lazily provisions the VA on first call.
export async function GET() {
  if (PLINTH_MODE !== 'live') return NextResponse.json({ mode: 'mock', connected: false });

  const customerId = await getOrCreateCustomerId();
  const sub = await plinth.activeSubscriptionFor(customerId);
  if (!sub) return NextResponse.json({ error: 'no_subscription' }, { status: 404 });

  const details = await plinth.transferDetails(sub.id);
  return NextResponse.json({ mode: 'live', state: sub.state, ...details });
}
