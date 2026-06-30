'use client';
import Link from 'next/link';
import { useBilling } from '@/lib/store';
import { Brand } from './Brand';

export function Header() {
  const { effectiveTier, profiles, currentProfileId, hydrated } = useBilling();
  const prof = profiles.find((p) => p.id === currentProfileId) ?? profiles[0];
  const tierLabel = effectiveTier === 'standard' ? 'Standard' : effectiveTier === 'premium' ? 'Premium' : 'Free';
  const isFree = effectiveTier === 'free';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line/60 bg-bg/85 px-4 py-3 backdrop-blur-lg">
      <Brand size="sm" />
      <div className="flex items-center gap-2.5">
        {hydrated && (
          <Link
            href={isFree ? '/pricing' : '/account'}
            className={`tap rounded-full px-2.5 py-1 text-[11px] font-bold ${
              isFree ? 'bg-gold text-black' : 'bg-surface2 text-gold ring-1 ring-gold/30'
            }`}
          >
            {isFree ? 'Go Premium' : tierLabel}
          </Link>
        )}
        <Link
          href="/profiles"
          aria-label="Switch profile"
          className="tap flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold text-black/80 ring-1 ring-white/15"
          style={{ background: prof?.color ?? '#f4456b' }}
        >
          {prof?.name?.[0]?.toUpperCase() ?? 'M'}
        </Link>
      </div>
    </header>
  );
}
