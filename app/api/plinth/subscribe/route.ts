import { NextResponse } from 'next/server';
import { PLINTH_MODE, plinth } from '@/lib/plinth';
import { getOrCreateCustomerId } from '@/lib/session';

// Create a subscription. Returns { state, checkoutLink }:
//  - checkoutLink set  → strict/pay-to-unlock → client redirects to Nomba
//  - checkoutLink null → no-card trial / active → access already granted
export async function POST(request: Request) {
  if (PLINTH_MODE !== 'live') return NextResponse.json({ mode: 'mock', connected: false });

  const customerId = await getOrCreateCustomerId();
  const { tier, interval, rail } = await request.json();
  const result = await plinth.subscribe({ customerId, tier, interval, rail });
  return NextResponse.json({ mode: 'live', ...result });
}
