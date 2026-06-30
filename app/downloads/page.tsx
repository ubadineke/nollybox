'use client';
import Link from 'next/link';
import { Download, Lock } from 'lucide-react';
import { Header } from '@/components/Header';
import { useBilling } from '@/lib/store';

export default function DownloadsPage() {
  const { entitlements, effectiveTier } = useBilling();

  return (
    <div>
      <Header />
      <div className="px-4 pt-3">
        <h1 className="font-display text-xl font-bold">Downloads</h1>

        {entitlements.downloads ? (
          <div className="mt-12 flex flex-col items-center text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface2 text-gold">
              <Download size={28} />
            </span>
            <p className="mt-4 text-sm font-semibold">No downloads yet</p>
            <p className="mt-1 max-w-[260px] text-xs text-dim">
              Tap the download icon on any title to watch offline. Included with your{' '}
              <span className="capitalize text-ink">Premium</span> plan.
            </p>
            <Link href="/" className="tap mt-5 rounded-xl bg-gold px-5 py-2.5 text-sm font-bold text-black">
              Browse titles
            </Link>
          </div>
        ) : (
          <div className="mt-12 flex flex-col items-center text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface2 text-dim">
              <Lock size={26} />
            </span>
            <p className="mt-4 text-sm font-semibold">Downloads are a Premium feature</p>
            <p className="mt-1 max-w-[270px] text-xs text-dim">
              Watch offline on the go. Your <span className="capitalize text-ink">{effectiveTier}</span> plan doesn’t
              include downloads — upgrade to Premium to save titles to your device.
            </p>
            <Link
              href="/pricing"
              className="tap mt-5 rounded-xl bg-gold px-5 py-2.5 text-sm font-bold text-black shadow-glow"
            >
              Upgrade to Premium
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
