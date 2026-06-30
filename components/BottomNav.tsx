'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Download, User } from 'lucide-react';

const TABS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/downloads', label: 'Downloads', icon: Download },
  { href: '/account', label: 'Account', icon: User },
];

// Routes that should be full-screen (no bottom nav)
const HIDE_ON = ['/watch', '/profiles'];

export function BottomNav() {
  const pathname = usePathname();
  if (HIDE_ON.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav className="bottom-safe pointer-events-auto fixed inset-x-0 z-40 mx-auto flex max-w-[460px] items-stretch border-t border-line bg-bg/90 backdrop-blur-lg">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`tap flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium ${
              active ? 'text-gold' : 'text-dim'
            }`}
          >
            <Icon size={20} strokeWidth={active ? 2.4 : 2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
