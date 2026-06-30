'use client';
import { useState } from 'react';
import { useBilling } from '@/lib/store';
import { Sliders, X, RotateCcw } from 'lucide-react';

// Presenter-only panel: jump the billing lifecycle between states during the demo.
export function DemoControls() {
  const [open, setOpen] = useState(false);
  const b = useBilling();

  const Action = ({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) => (
    <button
      onClick={onClick}
      className={`tap rounded-lg border px-2.5 py-2 text-left text-[11px] font-medium ${
        danger ? 'border-rose/30 text-rose' : 'border-line text-ink hover:border-gold/40'
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="tap fixed bottom-24 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-surface2 text-gold ring-1 ring-gold/30 shadow-card"
        aria-label="Demo controls"
      >
        {open ? <X size={18} /> : <Sliders size={18} />}
      </button>

      {open && (
        <div className="fixed bottom-40 right-4 z-50 w-60 animate-fade-up rounded-2xl border border-line bg-surface p-3 shadow-card">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-display text-xs font-bold text-dim">Demo controls</p>
            <span className="rounded bg-surface2 px-1.5 py-0.5 text-[10px] font-semibold text-gold">{b.status}</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <Action label="Convert trial → active" onClick={b.convertTrial} />
            <Action label="Renew (next period)" onClick={b.simulateRenewal} />
            <Action label="Card fails → past due" onClick={b.simulateFailure} />
            <Action label="Escalate → on hold" onClick={b.escalate} />
            <Action label="Recover → active" onClick={b.recover} />
            <Action label="Cancel plan" onClick={b.cancel} danger />
          </div>
          <button
            onClick={b.reset}
            className="tap mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-surface2 py-2 text-[11px] font-semibold text-dim hover:text-ink"
          >
            <RotateCcw size={12} /> Reset to Free
          </button>
        </div>
      )}
    </>
  );
}
