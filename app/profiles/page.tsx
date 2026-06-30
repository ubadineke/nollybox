'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Lock, X } from 'lucide-react';
import { useBilling } from '@/lib/store';
import { Sheet } from '@/components/Modal';
import { Brand } from '@/components/Brand';

export default function ProfilesPage() {
  const router = useRouter();
  const { profiles, entitlements, effectiveTier, selectProfile, addProfile, removeProfile } = useBilling();
  const [addOpen, setAddOpen] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(false);

  const atLimit = profiles.length >= entitlements.screens;

  function onAdd() {
    if (atLimit) {
      setLimitOpen(true);
      return;
    }
    setAddOpen(true);
  }

  function submit() {
    if (!name.trim()) return;
    const ok = addProfile(name.trim());
    setName('');
    setAddOpen(false);
    if (!ok) setLimitOpen(true);
  }

  function pick(id: string) {
    if (editing) return;
    selectProfile(id);
    router.push('/');
  }

  return (
    <div className="flex min-h-screen flex-col px-6 pt-12">
      <div className="flex items-center justify-between">
        <Brand size="sm" />
        <button onClick={() => setEditing((v) => !v)} className="tap text-sm font-semibold text-gold">
          {editing ? 'Done' : 'Edit'}
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <h1 className="mb-1 font-display text-2xl font-extrabold">Who&apos;s watching?</h1>
        <p className="mb-8 text-xs text-dim">
          {entitlements.screens} screen{entitlements.screens > 1 ? 's' : ''} on your {effectiveTier} plan
        </p>

        <div className="grid grid-cols-2 gap-5">
          {profiles.map((p) => (
            <button key={p.id} onClick={() => pick(p.id)} className="tap group flex flex-col items-center gap-2">
              <span
                className="relative flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-extrabold text-black/80 ring-2 ring-transparent transition group-hover:ring-white/40"
                style={{ background: p.color }}
              >
                {p.name[0]?.toUpperCase()}
                {editing && profiles.length > 1 && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      removeProfile(p.id);
                    }}
                    className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-rose text-white"
                  >
                    <X size={13} />
                  </span>
                )}
              </span>
              <span className="text-sm font-medium text-dim group-hover:text-ink">{p.name}</span>
            </button>
          ))}

          <button onClick={onAdd} className="tap flex flex-col items-center gap-2">
            <span className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-line text-dim">
              {atLimit ? <Lock size={22} /> : <Plus size={26} />}
            </span>
            <span className="text-sm font-medium text-dim">Add</span>
          </button>
        </div>
      </div>

      {/* Add profile sheet */}
      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="Add a profile">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Profile name"
          className="w-full rounded-xl border border-line bg-surface2 px-4 py-3 text-sm outline-none focus:border-gold/50"
        />
        <button
          onClick={submit}
          disabled={!name.trim()}
          className="tap mt-3 w-full rounded-xl bg-gold py-3 text-sm font-bold text-black disabled:opacity-40"
        >
          Add profile
        </button>
      </Sheet>

      {/* Screen-limit gate */}
      <Sheet open={limitOpen} onClose={() => setLimitOpen(false)} title="Need more screens?">
        <div className="flex items-start gap-3 rounded-xl bg-surface2 p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
            <Lock size={18} />
          </span>
          <p className="text-xs leading-relaxed text-dim">
            Your <span className="font-semibold text-ink capitalize">{effectiveTier}</span> plan includes{' '}
            <span className="font-semibold text-ink">{entitlements.screens}</span> screen
            {entitlements.screens > 1 ? 's' : ''}. Upgrade to <span className="font-semibold text-gold">Premium</span> for{' '}
            <span className="font-semibold text-ink">4 screens</span> — perfect for the whole family.
          </p>
        </div>
        <Link
          href="/pricing"
          onClick={() => setLimitOpen(false)}
          className="tap mt-3 block w-full rounded-xl bg-gold py-3 text-center text-sm font-bold text-black"
        >
          See plans
        </Link>
      </Sheet>
    </div>
  );
}
