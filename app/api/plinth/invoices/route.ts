import { NextResponse } from 'next/server';
import { PLINTH_MODE, plinth } from '@/lib/plinth';
import { getOrCreateCustomerId } from '@/lib/session';

// The viewer's real invoices from Plinth — dates are in the engine's (simulated) time, so the billing
// history reflects the actual timeline (not the wall clock).
export async function GET() {
  if (PLINTH_MODE !== 'live') return NextResponse.json({ mode: 'mock', data: [] });

  const customerId = await getOrCreateCustomerId();
  const { data } = await plinth.listInvoices();
  const mine = (data ?? []).filter((i: { customer_id?: string }) => i.customer_id === customerId);
  return NextResponse.json({ mode: 'live', data: mine });
}
