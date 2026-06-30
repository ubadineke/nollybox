import type { Metadata, Viewport } from 'next';
import { Inter, Sora } from 'next/font/google';
import './globals.css';
import { BillingProvider } from '@/lib/store';
import { BottomNav } from '@/components/BottomNav';
import { DemoControls } from '@/components/DemoControls';
import { ViewerGate } from '@/components/ViewerGate';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const sora = Sora({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-sora', display: 'swap' });

export const metadata: Metadata = {
  title: 'Nollybox — Stream Nollywood',
  description: 'The home of Nollywood. Powered by Plinth on Nomba.',
};

export const viewport: Viewport = {
  themeColor: '#0a0a0e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`}>
      <body className="bg-black font-sans">
        {/* Phone-width column: full-bleed on mobile, centered "device" on desktop */}
        <div className="relative mx-auto min-h-screen w-full max-w-[460px] bg-bg shadow-[0_0_80px_rgba(0,0,0,0.6)]">
          <BillingProvider>
            <ViewerGate>
              <main className="pb-safe min-h-screen">{children}</main>
              <BottomNav />
              <DemoControls />
            </ViewerGate>
          </BillingProvider>
        </div>
      </body>
    </html>
  );
}
