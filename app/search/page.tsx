'use client';
import { useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { Header } from '@/components/Header';
import { Poster } from '@/components/Poster';
import { TITLES } from '@/lib/titles';
import { useBilling } from '@/lib/store';

export default function SearchPage() {
  const { canWatch } = useBilling();
  const [q, setQ] = useState('');
  const results = q.trim()
    ? TITLES.filter((t) => (t.name + ' ' + t.genre + ' ' + t.cast.join(' ')).toLowerCase().includes(q.toLowerCase()))
    : TITLES;

  return (
    <div>
      <Header />
      <div className="px-4 pt-3">
        <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5">
          <SearchIcon size={16} className="text-dim" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search films, genres, actors"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-dim"
          />
        </div>

        <p className="mb-2 mt-4 text-xs font-semibold text-dim">
          {q.trim() ? `${results.length} result${results.length === 1 ? '' : 's'}` : 'Popular on Nollybox'}
        </p>
        <div className="grid grid-cols-3 gap-3">
          {results.map((t) => (
            <Poster key={t.id} title={t} locked={!canWatch(t)} className="w-full" />
          ))}
        </div>
        {q.trim() && results.length === 0 && (
          <p className="py-12 text-center text-sm text-dim">No matches for “{q}”.</p>
        )}
      </div>
      <div className="h-6" />
    </div>
  );
}
