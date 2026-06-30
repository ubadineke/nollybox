'use client';
import { useBilling } from '@/lib/store';
import { TITLES, type Title } from '@/lib/titles';
import { Poster } from './Poster';

export function Row({ label, ids, ranked = false }: { label: string; ids: string[]; ranked?: boolean }) {
  const { canWatch } = useBilling();
  const titles = ids.map((id) => TITLES.find((t) => t.id === id)).filter(Boolean) as Title[];

  return (
    <section className="mt-6">
      <h2 className="mb-2.5 px-4 font-display text-base font-bold text-ink">{label}</h2>
      <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1">
        {titles.map((t, i) => (
          <Poster
            key={t.id}
            title={t}
            locked={!canWatch(t)}
            rank={ranked ? i + 1 : undefined}
            className={ranked ? 'w-28 ml-5 first:ml-7' : 'w-28'}
          />
        ))}
      </div>
    </section>
  );
}
