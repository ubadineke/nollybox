import { cookies } from 'next/headers';
import { plinth } from './plinth';

// The whole "session" is one signed-ish cookie holding the Plinth customer id.
// No auth, no DB — the cookie is the identity once "Continue as Ada" is tapped.
const COOKIE = 'nollybox_customer';

export const ADA = {
  name: 'Ada',
  email: 'ada@nollybox.demo',
  externalRef: 'ada@nollybox.demo',
};

export function getCustomerId(): string | null {
  return cookies().get(COOKIE)?.value ?? null;
}

// Lazily resolve the customer: if the cookie is missing (e.g. a returning viewer whose
// cookie expired, or client localStorage out of sync), create/find Ada and set it. This
// makes `no_customer` impossible on the routes that need a customer.
export async function getOrCreateCustomerId(): Promise<string> {
  const existing = getCustomerId();
  if (existing) return existing;
  const c = await plinth.ensureCustomer(ADA);
  setCustomerId(c.id);
  return c.id;
}

export function setCustomerId(id: string): void {
  cookies().set(COOKIE, id, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 });
}

export function clearCustomer(): void {
  cookies().delete(COOKIE);
}
