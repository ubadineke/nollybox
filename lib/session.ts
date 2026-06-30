import { cookies } from 'next/headers';

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

export function setCustomerId(id: string): void {
  cookies().set(COOKIE, id, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 });
}

export function clearCustomer(): void {
  cookies().delete(COOKIE);
}
