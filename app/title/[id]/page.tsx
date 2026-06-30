'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Play, Lock, Download, Plus, Share2, Check } from 'lucide-react';
import { getTitle, TITLES } from '@/lib/titles';
import { useBilling } from '@/lib/store';
import { runtime } from '@/lib/format';
import { Poster } from '@/components/Poster';

export default function TitlePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const t = getTitle(params.id);
  const { canWatch, entitlements } = useBilling();

  if (!t) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-dim">Title not found.</p>
        <Link href="/" className="text-gold">Back to home</Link>
      </div>
    );
  }

  const locked = !canWatch(t);
  const similar = TITLES.filter((x) => x.genre === t.genre && x.id !== t.id).slice(0, 6);
  const more = (similar.length ? similar : TITLES.filter((x) => x.id !== t.id)).slice(0, 6);

  return (
    <div>
      {/* Backdrop */}
      <div className="relative aspect-[4/5] overflow-hidden">
        <div
          className="grain absolute inset-0"
          style={{ backgroundImage: `linear-gradient(160deg, ${t.gradient[0]}, ${t.gradient[1]})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/20 to-transparent" />

        <button
          onClick={() => router.back()}
          className="tap absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="absolute inset-x-0 bottom-0 p-4">
          {t.tag && <span className="text-[10px] font-bold tracking-[0.2em] text-gold">{t.tag}</span>}
          <h1 className="mt-1 font-display text-3xl font-extrabold leading-none">{t.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-white/80">
            <span className="font-semibold text-emerald-400">{t.year}</span>
            <span>·</span>
            <span>{runtime(t.durationMin)}</span>
            <span>·</span>
            <span className="rounded border border-white/25 px-1.5 py-px text-[10px] font-bold">{t.rating}+</span>
            <span>·</span>
            <span>{t.genre}</span>
            {t.badge4k && <span className="rounded bg-white/15 px-1.5 py-px text-[10px] font-bold text-gold">4K</span>}
          </div>
        </div>
      </div>

      <div className="px-4">
        {/* Primary action */}
        <Link
          href={locked ? '/pricing' : `/watch/${t.id}`}
          className="tap mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3 text-sm font-bold text-black shadow-glow"
        >
          {locked ? (
            <>
              <Lock size={16} /> Upgrade to watch
            </>
          ) : (
            <>
              <Play size={16} className="fill-black" /> Play
            </>
          )}
        </Link>

        {locked && (
          <p className="mt-2 text-center text-[11px] text-dim">
            This title is included with <span className="font-semibold text-gold">Standard</span> &amp; Premium.
          </p>
        )}

        {/* Secondary actions */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] text-dim">
          <button className="tap flex flex-col items-center gap-1.5 py-1">
            <Plus size={20} className="text-ink" />
            My List
          </button>
          <DownloadAction allowed={entitlements.downloads} />
          <button className="tap flex flex-col items-center gap-1.5 py-1">
            <Share2 size={20} className="text-ink" />
            Share
          </button>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-white/85">{t.synopsis}</p>
        <p className="mt-3 text-xs text-dim">
          <span className="text-white/60">Starring:</span> {t.cast.join(', ')}
        </p>
      </div>

      {/* More like this */}
      <section className="mt-7">
        <h2 className="mb-2.5 px-4 font-display text-base font-bold">More Like This</h2>
        <div className="grid grid-cols-3 gap-3 px-4">
          {more.map((m) => (
            <Poster key={m.id} title={m} locked={!canWatch(m)} className="w-full" />
          ))}
        </div>
      </section>
      <div className="h-6" />
    </div>
  );
}

function DownloadAction({ allowed }: { allowed: boolean }) {
  return (
    <button className="tap flex flex-col items-center gap-1.5 py-1">
      {allowed ? <Download size={20} className="text-ink" /> : <Lock size={20} className="text-dim" />}
      <span className={allowed ? '' : 'text-dim/70'}>Download{allowed ? '' : ' · Premium'}</span>
    </button>
  );
}
