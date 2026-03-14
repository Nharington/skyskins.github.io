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

export function compareBrowseRarity(a: CosmeticRarity, b: CosmeticRarity) {
  if (a === 'UNKNOWN') return 1;
  if (b === 'UNKNOWN') return -1;
  return cosmeticRarityRank(b) - cosmeticRarityRank(a) || a.localeCompare(b);
}

export function rarityHex(rarity: CosmeticRarity) {
  switch (rarity) {
    case 'COMMON':
      return '#aaaaaa';
    case 'UNCOMMON':
      return '#55ff55';
    case 'RARE':
      return '#5555ff';
    case 'EPIC':
      return '#aa00aa';
    case 'LEGENDARY':
      return '#ffaa00';
    case 'MYTHIC':
      return '#ff55ff';
    case 'DIVINE':
      return '#55ffff';
    case 'SPECIAL':
    case 'VERY SPECIAL':
      return '#ff5555';
    case 'ULTIMATE':
    case 'SUPREME':
      return '#aa0000';
    case 'UNKNOWN':
      return '#777777';
    default: {
      const exhaustiveCheck: never = rarity;
      return exhaustiveCheck;
    }
  }
}

