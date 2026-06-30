'use client';
import Link from 'next/link';
import { useBilling } from '@/lib/store';
import { AlertTriangle, Clock, ChevronRight } from 'lucide-react';

export function LifecycleBanner() {
  const { banner } = useBilling();
  if (!banner) return null;

  const styles =
    banner.kind === 'trial'
      ? 'bg-gold/12 text-gold border-gold/30'
      : banner.kind === 'past_due'
      ? 'bg-amber-500/12 text-amber-300 border-amber-500/30'
      : 'bg-rose/12 text-rose border-rose/30';

  const Icon = banner.kind === 'trial' ? Clock : AlertTriangle;

  return (
    <Link href="/account" className={`tap mx-4 mt-3 flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 ${styles}`}>
      <Icon size={16} className="shrink-0" />
      <span className="flex-1 text-xs font-medium leading-snug">{banner.text}</span>
      <ChevronRight size={16} className="shrink-0 opacity-70" />
    </Link>
  );
}
