import { NextResponse } from 'next/server';
import { PLINTH_MODE, plinth } from '@/lib/plinth';
import { getCustomerId } from '@/lib/session';

// Real-time access for the signed-in viewer — drives UI gating in live mode.
export async function GET() {
  if (PLINTH_MODE !== 'live') return NextResponse.json({ mode: 'mock', connected: false });

  const customerId = getCustomerId();
  if (!customerId) return NextResponse.json({ has_access: false, tier: null });

  return NextResponse.json({ mode: 'live', ...(await plinth.entitlements(customerId)) });
}
