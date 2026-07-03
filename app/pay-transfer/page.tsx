'use client';
import { useEffect, useState } from 'react';
import { Loader2, Check, Copy, Landmark, AlertTriangle } from 'lucide-react';
import { Brand } from '@/components/Brand';
import { naira } from '@/lib/format';

type Details = {
  amount_due_minor: string;
  virtual_account: { bank_name: string; account_number: string; account_name: string };
};

// Transfer rail: show the customer's dedicated virtual account to pay into, then poll until the
// incoming transfer reconciles and activates the subscription (Plinth handles that server-side).
export default function PayTransferPage() {
  const [details, setDetails] = useState<Details | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch('/api/plinth/transfer-details', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (alive) (d?.virtual_account ? setDetails(d) : setError('Could not load your account details.')); })
      .catch(() => alive && setError('Could not load your account details.'));

    // Poll access until the transfer lands and the subscription activates.
    const deadline = Date.now() + 5 * 60 * 1000;
    async function poll() {
      try {
        const res = await fetch('/api/plinth/account', { cache: 'no-store' });
        const d = await res.json();
        if (d?.subscription?.state === 'active' || d?.subscription?.state === 'trialing') {
          if (!alive) return;
          setConfirmed(true);
          setTimeout(() => { window.location.href = '/account'; }, 1400);
          return;
        }
      } catch { /* keep polling */ }
      if (alive && Date.now() < deadline) setTimeout(poll, 3000);
    }
    poll();
    return () => { alive = false; };
  }, []);

  function copy() {
    if (!details) return;
    navigator.clipboard?.writeText(details.virtual_account.account_number);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }

  const [checking, setChecking] = useState(false);
  async function checkNow() {
    setChecking(true);
    try {
      const d = await (await fetch('/api/plinth/account', { cache: 'no-store' })).json();
      if (d?.subscription?.state === 'active' || d?.subscription?.state === 'trialing') {
        setConfirmed(true);
        setTimeout(() => { window.location.href = '/account'; }, 800);
        return;
      }
    } catch { /* ignore */ }
    setChecking(false);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-center justify-between border-b border-line/60 bg-bg/85 px-4 py-3">
        <Brand size="sm" />
        <span className="font-display text-sm font-bold text-dim">Bank transfer</span>
      </div>

      <div className="flex flex-1 flex-col items-center px-6 py-8">
        {confirmed ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <Check size={30} />
            </span>
            <p className="mt-4 font-display text-lg font-bold">Payment received</p>
            <p className="mt-1 text-xs text-dim">Activating your plan…</p>
          </div>
        ) : error ? (
          <div className="mt-10 flex flex-col items-center text-center">
            <AlertTriangle size={22} className="text-rose" />
            <p className="mt-2 text-sm text-dim">{error}</p>
          </div>
        ) : !details ? (
          <div className="mt-16 flex flex-col items-center text-dim">
            <Loader2 size={22} className="animate-spin" />
            <p className="mt-3 text-xs">Getting your account…</p>
          </div>
        ) : (
          <div className="w-full max-w-sm">
            <div className="text-center">
              <p className="text-xs text-dim">Transfer exactly</p>
              <p className="font-display text-3xl font-extrabold text-gold">{naira(Number(details.amount_due_minor))}</p>
              <p className="mt-1 text-xs text-dim">to the account below to activate your plan</p>
            </div>

            <div className="mt-6 rounded-2xl border border-line bg-surface p-4 space-y-3">
              <Row label="Bank" value={details.virtual_account.bank_name} icon={<Landmark size={14} className="text-gold" />} />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-dim">Account number</p>
                  <p className="font-mono text-lg font-bold tracking-wider text-ink">{details.virtual_account.account_number}</p>
                </div>
                <button onClick={copy} className="tap flex items-center gap-1.5 rounded-lg bg-surface2 px-3 py-2 text-xs font-semibold text-ink ring-1 ring-line">
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}{copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <Row label="Account name" value={details.virtual_account.account_name} />
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-dim">
              <Loader2 size={13} className="animate-spin" /> Waiting for your transfer…
            </div>
            <button
              onClick={checkNow}
              disabled={checking}
              className="tap mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-surface2 py-2.5 text-xs font-bold text-ink ring-1 ring-line disabled:opacity-70"
            >
              {checking ? <><Loader2 size={13} className="animate-spin" /> Checking…</> : "I've sent it — check now"}
            </button>
            <p className="mt-2 text-center text-[11px] text-dim">
              This account is yours to keep — future renewals use the same number. It activates automatically once the transfer lands.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <p className="text-[11px] text-dim">{label}</p>
        <p className="text-sm font-medium text-ink">{value}</p>
      </div>
    </div>
  );
}
