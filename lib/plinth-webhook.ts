import { createHmac, timingSafeEqual } from 'crypto';

// Verifies a Plinth webhook signature. Header format: `t=<unix>,v1=<hex hmac>`, where the HMAC is
// HMAC-SHA256(`${t}.${rawBody}`) keyed by the endpoint's whsec_ secret. Verify against the RAW body
// (before JSON.parse) — that's what was signed. This mirrors most billing platforms' scheme.
export function verifyPlinthSignature(
  secret: string,
  header: string | null,
  rawBody: string,
  toleranceSeconds = 300,
): boolean {
  if (!secret || !header) return false;
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=')));
  const t = parseInt(parts['t'] ?? '', 10);
  const v1 = parts['v1'];
  if (!t || !v1) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - t) > toleranceSeconds) return false;

  const expected = createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex');
  // Constant-time compare (both hex strings of equal length).
  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  return a.length === b.length && timingSafeEqual(a, b);
}

// The event envelope Plinth delivers.
export interface PlinthEvent {
  id: string;
  type: string;
  api_version: string;
  created: number;
  data: { object: Record<string, unknown> };
}
