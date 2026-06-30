export type Tier = 'free' | 'standard' | 'premium';
export type Interval = 'monthly' | 'annual';
export type Rail = 'card' | 'transfer';

export interface Entitlements {
  premiumCatalog: boolean; // unlock premium titles
  hd: boolean;
  downloads: boolean;
  screens: number; // quantity / profiles allowed
  adFree: boolean;
  quality: 'SD' | 'HD' | '4K';
}

export const ENTITLEMENTS: Record<Tier, Entitlements> = {
  free: { premiumCatalog: false, hd: false, downloads: false, screens: 1, adFree: false, quality: 'SD' },
  standard: { premiumCatalog: true, hd: true, downloads: false, screens: 1, adFree: true, quality: 'HD' },
  premium: { premiumCatalog: true, hd: true, downloads: true, screens: 4, adFree: true, quality: '4K' },
};

export interface PlanDef {
  tier: Tier;
  name: string;
  tagline: string;
  priceMonthly: number; // kobo
  priceAnnual: number; // kobo
  screens: number;
  quality: string;
  perks: string[];
  highlight?: boolean;
}

// Prices in kobo (₦1 = 100 kobo), mirroring how Plinth stores amounts.
export const PLANS: PlanDef[] = [
  {
    tier: 'free',
    name: 'Free',
    tagline: 'Ad-supported taster',
    priceMonthly: 0,
    priceAnnual: 0,
    screens: 1,
    quality: 'SD',
    perks: ['Limited catalogue', 'With ads', 'SD quality', '1 screen'],
  },
  {
    tier: 'standard',
    name: 'Standard',
    tagline: 'The full library, ad-free',
    priceMonthly: 290000,
    priceAnnual: 2900000,
    screens: 1,
    quality: 'HD',
    perks: ['Full catalogue', 'No ads', 'HD quality', '1 screen', '7-day free trial'],
    highlight: true,
  },
  {
    tier: 'premium',
    name: 'Premium',
    tagline: 'For the whole family',
    priceMonthly: 440000,
    priceAnnual: 4400000,
    screens: 4,
    quality: '4K',
    perks: ['Everything in Standard', '4 screens', '4K + downloads', 'Pay by card or transfer'],
  },
];

export function planFor(tier: Tier): PlanDef {
  return PLANS.find((p) => p.tier === tier)!;
}
