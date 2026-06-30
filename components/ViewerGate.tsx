'use client';
import { useBilling } from '@/lib/store';
import { Brand } from './Brand';
import { Play } from 'lucide-react';
import { getTitle } from '@/lib/titles';

// Gates the app behind a one-tap "Continue as Ada" identity.
// No password, no auth — in live mode this is where the Plinth customer gets created.
export function ViewerGate({ children }: { children: React.ReactNode }) {
  const { hydrated, viewer, signIn } = useBilling();

  if (!hydrated) {
    return <div className="min-h-screen bg-bg" />;
  }

  if (viewer) return <>{children}</>;

  const a = getTitle('lagos-nights')!;
  const b = getTitle('afrobeat-dreams')!;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* cinematic backdrop */}
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(160deg, ${a.gradient[0]}, ${b.gradient[1]})` }} />
        <div className="grain absolute inset-0 opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/30" />
      </div>

      <div className="relative flex items-center justify-between px-5 pt-6">
        <Brand />
      </div>

      <div className="relative flex flex-1 flex-col justify-end px-6 pb-12">
        <h1 className="font-display text-4xl font-extrabold leading-tight">
          The home of <span className="text-gold">Nollywood.</span>
        </h1>
        <p className="mt-2 max-w-[300px] text-sm text-white/75">
          Thousands of films and series. Stream the best of Naija cinema — anywhere, any screen.
        </p>

        <button
          onClick={() => signIn('Ada')}
          className="tap mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3.5 text-sm font-bold text-black shadow-glow"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-black/15 text-xs font-extrabold text-black">A</span>
          Continue as Ada
        </button>

        <p className="mt-4 text-center text-[11px] text-white/55">
          Billing powered by <span className="font-semibold text-gold">Plinth</span> · settled on Nomba
        </p>
      </div>
    </div>
  );
}
