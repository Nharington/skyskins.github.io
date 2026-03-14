import type { CosmeticRarity } from '../lib/cosmetics';

const RARITY_ORDER: CosmeticRarity[] = [
  'COMMON',
  'UNCOMMON',
  'RARE',
  'EPIC',
  'LEGENDARY',
  'MYTHIC',
  'DIVINE',
  'SPECIAL',
  'VERY SPECIAL',
  'ULTIMATE',
  'SUPREME',
  'UNKNOWN',
];

export function stripMinecraftFormatting(s: string) {
  return s.replace(/§[0-9a-fk-or]/gi, '');
}

export function parseCosmeticRarityFromLore(lore?: string): CosmeticRarity {
  if (!lore) return 'UNKNOWN';

  const clean = stripMinecraftFormatting(lore).toUpperCase();
  if (clean.includes('VERY SPECIAL')) return 'VERY SPECIAL';
  if (clean.includes('ULTIMATE')) return 'ULTIMATE';
  if (clean.includes('SUPREME')) return 'SUPREME';
  if (clean.includes('SPECIAL')) return 'SPECIAL';
  if (clean.includes('DIVINE')) return 'DIVINE';
  if (clean.includes('MYTHIC')) return 'MYTHIC';
  if (clean.includes('LEGENDARY')) return 'LEGENDARY';
  if (clean.includes('EPIC')) return 'EPIC';
  if (clean.includes('RARE')) return 'RARE';
  if (clean.includes('UNCOMMON')) return 'UNCOMMON';
  if (clean.includes('COMMON')) return 'COMMON';

  return 'UNKNOWN';
}

export function cosmeticRarityRank(rarity: CosmeticRarity) {
  const idx = RARITY_ORDER.indexOf(rarity);
  return idx === -1 ? RARITY_ORDER.length - 1 : idx;
}

