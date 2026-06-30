import { NextResponse } from 'next/server';

// Nomba posts payment_success to *Plinth*, which handles activation directly.
// This endpoint exists only if Nollybox wants to react to its own events later
// (e.g. send a "welcome" email, refresh a cache). Acknowledge for now.
export async function POST() {
  return NextResponse.json({ received: true });
}
