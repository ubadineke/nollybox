import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { verifyPlinthSignature, type PlinthEvent } from '@/lib/plinth-webhook';

// Inbound Plinth webhook. This is the ENTIRE integration for receiving events in Next.js:
//   1. read the raw body (needed to verify the signature)
//   2. verify the Plinth-Signature header against the endpoint secret
//   3. switch on event.type and react
// Register this URL as a webhook endpoint in Plinth and set PLINTH_WEBHOOK_SECRET to its whsec_.
const SECRET = process.env.PLINTH_WEBHOOK_SECRET ?? '';

export async function POST(request: Request) {
  const raw = await request.text(); // raw body — do NOT JSON.parse before verifying
  const sig = request.headers.get('plinth-signature');

  if (!verifyPlinthSignature(SECRET, sig, raw)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(raw) as PlinthEvent;

  // React to the events this app cares about. Nollybox has no database — it reads live from Plinth —
  // so reacting mostly means busting the cached view. A DB-backed app would update its local copy here.
  switch (event.type) {
    case 'subscription.activated':
    case 'subscription.upgraded':
    case 'subscription.downgraded':
    case 'subscription.plan_changed':
    case 'subscription.recovered':
    case 'subscription.past_due':
    case 'subscription.grace':
    case 'subscription.delinquent':
    case 'subscription.canceled':
    case 'subscription.cancel_scheduled':
    case 'subscription.cancel_reverted':
    case 'invoice.paid':
      revalidatePath('/account');
      break;
    default:
      break; // ack unknown/uninteresting events
  }

  console.log(`[plinth:webhook] ${event.type} (${event.id})`);
  return NextResponse.json({ received: true });
}
