import { NextResponse } from 'next/server';
import { PLINTH_MODE, plinth } from '@/lib/plinth';
import { ADA, getCustomerId, setCustomerId } from '@/lib/session';

// "Continue as Ada" → create/find the Plinth customer, remember it in a cookie.
export async function POST() {
  if (PLINTH_MODE !== 'live') return NextResponse.json({ mode: 'mock', connected: false });

  let id = getCustomerId();
  if (!id) {
    const c = await plinth.ensureCustomer(ADA);
    id = c.id;
    setCustomerId(id);
  }
  return NextResponse.json({ mode: 'live', customerId: id });
}
