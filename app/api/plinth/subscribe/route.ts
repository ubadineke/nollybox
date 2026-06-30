import { NextResponse } from 'next/server';
import { PLINTH_MODE, plinth } from '@/lib/plinth';
import { getCustomerId } from '@/lib/session';

// Create a subscription + return a Nomba checkout link for the first payment.
export async function POST(request: Request) {
  if (PLINTH_MODE !== 'live') return NextResponse.json({ mode: 'mock', connected: false });

  const customerId = getCustomerId();
  if (!customerId) return NextResponse.json({ error: 'no_customer' }, { status: 400 });

  const { tier, interval, rail } = await request.json();
  const result = await plinth.subscribe({ customerId, tier, interval, rail });
  return NextResponse.json({ mode: 'live', ...result });
}
