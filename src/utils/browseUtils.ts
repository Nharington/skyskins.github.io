import { Filter, Palette, Shield, Sparkles } from 'lucide-react';
import { getCosmeticTypeLabel, type CatalogItem, type CosmeticKind } from '../lib/cosmetics';
import { stripMinecraftFormatting } from './skinRarity';

export type CosmeticTypeFilter = 'all' | CosmeticKind;

export function getBrowseDescription(item: CatalogItem) {
  const description = item.description?.trim();
  if (!description) return null;

  const normalizedDescription = stripMinecraftFormatting(description).trim().toLowerCase();
  const redundantPetSkinLabel = `${item.parentNamePlain.trim().toLowerCase()} skin`;

  if (normalizedDescription === redundantPetSkinLabel) {
    return null;
  }

  return description;
}

export function getTypeIcon(type: CosmeticTypeFilter) {
  switch (type) {
    case 'all':
      return Filter;
    case 'petSkin':
      return Sparkles;
    case 'dye':
      return Palette;
    case 'helmetSkin':
      return Shield;
    default: {
      const exhaustiveCheck: never = type;
      return exhaustiveCheck;
    }
  }
}

export function getTypeFilterLabel(type: CosmeticTypeFilter) {
  if (type === 'all') return 'All';
  return getCosmeticTypeLabel(type);
}

export function matchesBrowseQuery(item: CatalogItem, query: string) {
  if (!query) return true;

  const haystacks = [
    item.itemNamePlain,
    item.parentNamePlain,
    item.category,
    item.typeLabel,
    stripMinecraftFormatting(item.description ?? ''),
  ];

  return haystacks.some((value) => value.toLowerCase().includes(query));
}

export function uniqueSortedValues<T extends string>(values: Iterable<T>, compare?: (a: T, b: T) => number) {
  return [...new Set(values)].sort(compare);
}
