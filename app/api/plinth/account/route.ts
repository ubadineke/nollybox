import { NextResponse } from 'next/server';
import { PLINTH_MODE, plinth } from '@/lib/plinth';
import { getCustomerId } from '@/lib/session';

// Billing data for the Account page (invoices, and subscription if its id is known).
export async function GET() {
  if (PLINTH_MODE !== 'live') return NextResponse.json({ mode: 'mock', connected: false });

  const customerId = getCustomerId();
  if (!customerId) return NextResponse.json({ error: 'no_customer' }, { status: 400 });

  const invoices = await plinth.listInvoices();
  return NextResponse.json({ mode: 'live', invoices: invoices.data });
}
