'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Play, Pause, Rewind, FastForward, Subtitles, Settings } from 'lucide-react';
import { getTitle } from '@/lib/titles';
import { useBilling } from '@/lib/store';

function fmt(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function WatchPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const t = getTitle(params.id);
  const { entitlements } = useBilling();
  const totalSec = (t?.durationMin ?? 100) * 60;

  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [showUI, setShowUI] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // animate the scrubber (12x speed so it visibly moves on stage)
  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => setElapsed((e) => Math.min(totalSec, e + 12)), 1000);
    return () => clearInterval(iv);
  }, [playing, totalSec]);

  // auto-hide chrome
  useEffect(() => {
    if (showUI) {
      hideTimer.current && clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setShowUI(false), 3500);
    }
    return () => {
      hideTimer.current && clearTimeout(hideTimer.current);
    };
  }, [showUI, playing]);

  if (!t) return null;
  const pct = (elapsed / totalSec) * 100;

  return (
    <div
      className="fixed inset-0 z-50 mx-auto max-w-[460px] select-none bg-black"
      onClick={() => setShowUI((v) => !v)}
    >
      {/* "video" = animated gradient backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundImage: `linear-gradient(160deg, ${t.gradient[0]}, ${t.gradient[1]})` }}
      />
      <div className="grain absolute inset-0 opacity-30" />
      <div className="absolute inset-0 bg-black/35" />

      {/* center title watermark */}
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="font-display text-2xl font-extrabold tracking-wide text-white/30">{t.name}</p>
      </div>

      {showUI && (
        <div className="absolute inset-0 animate-fade-in bg-gradient-to-t from-black/70 via-transparent to-black/60">
          {/* top bar */}
          <div className="flex items-center gap-3 p-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.back();
              }}
              className="tap flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold">{t.name}</p>
              <p className="text-[10px] text-white/60">
                {entitlements.quality} · {t.genre}
              </p>
            </div>
            <span className="ml-auto rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-bold text-gold">
              {entitlements.quality}
            </span>
          </div>

          {/* center transport */}
          <div className="absolute inset-0 flex items-center justify-center gap-9">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setElapsed((x) => Math.max(0, x - 120));
              }}
              className="tap text-white/90"
            >
              <Rewind size={28} className="fill-white/90" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPlaying((p) => !p);
              }}
              className="tap flex h-16 w-16 items-center justify-center rounded-full bg-white/15 backdrop-blur"
            >
              {playing ? <Pause size={30} className="fill-white" /> : <Play size={30} className="fill-white" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setElapsed((x) => Math.min(totalSec, x + 120));
              }}
              className="tap text-white/90"
            >
              <FastForward size={28} className="fill-white/90" />
            </button>
          </div>

          {/* bottom scrubber */}
          <div className="absolute inset-x-0 bottom-0 p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 text-[11px] tabular-nums text-white/80">
              <span>{fmt(elapsed)}</span>
              <div className="relative h-1 flex-1 rounded-full bg-white/25">
                <div className="absolute inset-y-0 left-0 rounded-full bg-gold" style={{ width: `${pct}%` }} />
                <div
                  className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-gold shadow"
                  style={{ left: `calc(${pct}% - 6px)` }}
                />
              </div>
              <span>-{fmt(totalSec - elapsed)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-white/80">
              <button className="tap flex items-center gap-1.5 text-xs">
                <Subtitles size={18} /> Subtitles
              </button>
              <button className="tap flex items-center gap-1.5 text-xs">
                <Settings size={18} /> {entitlements.quality}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
