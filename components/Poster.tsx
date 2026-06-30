import Link from 'next/link';
import { Lock } from 'lucide-react';
import type { Title } from '@/lib/titles';

export function Poster({
  title,
  locked = false,
  className = '',
  rank,
}: {
  title: Title;
  locked?: boolean;
  className?: string;
  rank?: number;
}) {
  return (
    <Link
      href={`/title/${title.id}`}
      className={`tap group relative block shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10 shadow-card aspect-[2/3] ${className}`}
    >
      <div
        className="grain vignette absolute inset-0"
        style={{ backgroundImage: `linear-gradient(155deg, ${title.gradient[0]}, ${title.gradient[1]})` }}
      />

      <div className="relative flex h-full flex-col justify-between p-2.5">
        <div className="flex items-start justify-between">
          {title.tag ? (
            <span className="rounded bg-black/40 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white backdrop-blur">
              {title.tag}
            </span>
          ) : (
            <span />
          )}
          {title.badge4k && (
            <span className="rounded bg-black/40 px-1.5 py-0.5 text-[9px] font-bold text-gold backdrop-blur">4K</span>
          )}
        </div>

        <div>
          <p className="font-display text-[15px] font-bold leading-tight text-white drop-shadow-md">{title.name}</p>
          <p className="mt-0.5 text-[10px] text-white/75">
            {title.genre} · {title.year}
          </p>
        </div>
      </div>

      {typeof rank === 'number' && (
        <span className="absolute -left-1 bottom-1 font-display text-5xl font-black leading-none text-white/85 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
          {rank}
        </span>
      )}

      {locked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-[1px]">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/65 ring-1 ring-white/20">
            <Lock size={15} className="text-gold" />
          </span>
        </div>
      )}
    </Link>
  );
}
