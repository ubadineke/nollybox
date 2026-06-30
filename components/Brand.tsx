import Link from 'next/link';
import { Play } from 'lucide-react';

export function Brand({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const text = size === 'sm' ? 'text-lg' : 'text-xl';
  return (
    <Link href="/" className="tap flex items-center gap-1.5">
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gold shadow-glow">
        <Play size={13} className="fill-black text-black" />
      </span>
      <span className={`font-display font-extrabold tracking-tight ${text}`}>
        Nolly<span className="text-gold">box</span>
      </span>
    </Link>
  );
}
