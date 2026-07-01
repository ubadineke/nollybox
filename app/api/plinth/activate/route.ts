// TEMPORARY — reconciliation shim until production webhooks are configured.
// Remove this file and the activate() call in checkout/complete/page.tsx once
// the Nomba production webhook URL is registered and delivering events.
import { NextResponse } from 'next/server';
import { PLINTH_MODE } from '@/lib/plinth';

const ENGINE = process.env.PLINTH_API_URL ?? 'http://localhost:7331';

export async function POST(request: Request) {
  if (PLINTH_MODE !== 'live') return NextResponse.json({ ok: true });

  const { orderReference } = await request.json();
  if (!orderReference?.startsWith('plinth_')) {
    return NextResponse.json({ ok: false, reason: 'not a plinth order' });
  }

  // Fire the same synthetic webhook the engine already handles, as if Nomba had sent it.
  const res = await fetch(`${ENGINE}/webhooks/nomba`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_type: 'payment_success',
      requestId:  `recon_${Date.now()}`,
      data: {
        transaction: {
          type:              'bank_transfer',
          transactionAmount: 0,
          orderReference,
        },
      },
    }),
  });

  return NextResponse.json({ ok: res.ok });
}
