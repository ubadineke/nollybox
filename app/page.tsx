'use client';
import Link from 'next/link';
import { Play, Info, Lock, Plus } from 'lucide-react';
import { Header } from '@/components/Header';
import { LifecycleBanner } from '@/components/LifecycleBanner';
import { Row } from '@/components/Row';
import { GENRES, getTitle } from '@/lib/titles';
import { useBilling } from '@/lib/store';

export default function HomePage() {
  const { canWatch } = useBilling();
  const hero = getTitle('lagos-nights')!;
  const locked = !canWatch(hero);

  return (
    <div>
      <Header />
      <LifecycleBanner />

      {/* Hero */}
      <div className="px-4 pt-3">
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl ring-1 ring-white/10">
          <div
            className="grain absolute inset-0"
            style={{ backgroundImage: `linear-gradient(160deg, ${hero.gradient[0]}, ${hero.gradient[1]})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <span className="text-[10px] font-bold tracking-[0.2em] text-gold">NOLLYBOX ORIGINAL</span>
            <h1 className="mt-1 font-display text-[34px] font-extrabold leading-none">{hero.name}</h1>
            <p className="mt-2 line-clamp-2 text-xs text-white/75">{hero.synopsis}</p>
            <div className="mt-3.5 flex gap-2">
              <Link
                href={locked ? '/pricing' : `/watch/${hero.id}`}
                className="tap flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gold py-3 text-sm font-bold text-black shadow-glow"
              >
                {locked ? (
                  <>
                    <Lock size={15} /> Upgrade to watch
                  </>
                ) : (
                  <>
                    <Play size={15} className="fill-black" /> Play
                  </>
                )}
              </Link>
              <Link
                href={`/title/${hero.id}`}
                className="tap flex items-center justify-center rounded-xl bg-white/15 px-4 text-sm font-semibold backdrop-blur"
              >
                <Info size={18} />
              </Link>
              <button className="tap flex items-center justify-center rounded-xl bg-white/15 px-4 backdrop-blur">
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <Row label="Trending Now" ids={GENRES[0].ids} />
      <Row label="Top 10 in Nigeria Today" ids={GENRES[2].ids} ranked />
      <Row label="Nollybox Originals" ids={GENRES[1].ids} />
      <Row label="Comedy & Family" ids={GENRES[3].ids} />
      <Row label="Drama" ids={GENRES[4].ids} />
      <div className="h-6" />
    </div>
  );
}
