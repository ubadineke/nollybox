'use client';
import { useEffect } from 'react';
import { X } from 'lucide-react';

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button aria-label="Close" className="absolute inset-0 bg-black/60 animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-[460px] animate-sheet-up rounded-t-2xl border-t border-line bg-surface pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-card">
        <div className="flex items-center justify-between px-5 pt-4">
          <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
          <button onClick={onClose} className="tap -mr-1 rounded-full p-1.5 text-dim hover:text-ink">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 pt-3">{children}</div>
      </div>
    </div>
  );
}
