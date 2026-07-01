import { NextResponse } from 'next/server';
import { PLINTH_MODE, plinth, tierFromLookupKey } from '@/lib/plinth';
import { getCustomerId } from '@/lib/session';

// Full billing state for the client to hydrate from in live mode:
// the current subscription (mapped to Nollybox tier/interval/state), access, and invoices.
export async function GET() {
  if (PLINTH_MODE !== 'live') return NextResponse.json({ mode: 'mock', connected: false });

  const customerId = getCustomerId();
  if (!customerId) return NextResponse.json({ mode: 'live', connected: true, subscription: null });

  const [sub, plans, entitlements, invoices] = await Promise.all([
    plinth.activeSubscriptionFor(customerId),
    plinth.listPlans(),
    plinth.entitlements(customerId).catch(() => ({ has_access: false, tier: null })),
    plinth.listInvoices().catch(() => ({ data: [] as any[] })),
  ]);

  let subscription = null;
  if (sub) {
    const key = plans.find((p) => p.id === sub.plan_id)?.lookup_key ?? null;
    const mapped = tierFromLookupKey(key);
    subscription = {
      id: sub.id,
      tier: mapped?.tier ?? 'standard',
      interval: mapped?.interval ?? 'monthly',
      state: sub.state, // raw Plinth state; the client maps it to its SubStatus
      next_bill_at: sub.next_bill_at,
      trial_end_at: sub.trial_end_at,
    };
  }

  return NextResponse.json({
    mode: 'live',
    connected: true,
    subscription,
    entitlements,
    invoices: (invoices as { data: any[] }).data ?? [],
  });
}
