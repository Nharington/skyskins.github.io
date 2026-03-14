import { useEffect, useMemo, useState } from 'react';
import {
  AlignJustify,
  Calendar,
  ChevronDown,
  ChevronUp,
  Coins,
  Filter,
  Grid3X3,
  PackageCheck,
  PackagePlus,
  Palette,
  Search,
  Shield,
  Sparkles,
} from 'lucide-react';
import { CosmeticThumb } from '../components/collection/CosmeticThumb';
import { ScrollArea } from '../components/ui/scroll-area';
import {
  getCatalogLoadUnitCount,
  getCosmeticTypeLabel,
  loadCosmeticCatalog,
  type CatalogItem,
  type CosmeticKind,
  type CosmeticRarity,
  type OwnedCosmeticEntry,
} from '../lib/cosmetics';
import { useAppStore } from '../store/useAppStore';
import { cosmeticRarityRank, stripMinecraftFormatting } from '../utils/skinRarity';

type SortModeAll = 'type' | 'source' | 'item' | 'rarity';
type SortModeOwned = 'date' | 'qty' | 'item' | 'source';
type CosmeticTypeFilter = 'all' | CosmeticKind;

const PREVIEW_YAW = -42;
const PREVIEW_PITCH = 27;
const PREVIEW_ROTATION = 19;
const FILTERS: ReadonlyArray<CosmeticTypeFilter> = ['all', 'petSkin', 'dye', 'helmetSkin'];

function rarityHex(rarity: CosmeticRarity) {
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

function getBrowseDescription(item: CatalogItem) {
  const description = item.description?.trim();
  if (!description) return null;

  const normalizedDescription = stripMinecraftFormatting(description).trim().toLowerCase();
  const redundantPetSkinLabel = `${item.parentNamePlain.trim().toLowerCase()} skin`;

  if (normalizedDescription === redundantPetSkinLabel) {
    return null;
  }

  return description;
}

function getTypeIcon(type: CosmeticTypeFilter) {
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

function getTypeFilterLabel(type: CosmeticTypeFilter) {
  if (type === 'all') return 'All';
  return getCosmeticTypeLabel(type);
}

function matchesBrowseQuery(item: CatalogItem, query: string) {
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

function compareBrowseRarity(a: CosmeticRarity, b: CosmeticRarity) {
  if (a === 'UNKNOWN') return 1;
  if (b === 'UNKNOWN') return -1;
  return cosmeticRarityRank(b) - cosmeticRarityRank(a) || a.localeCompare(b);
}

function uniqueSortedValues<T extends string>(values: Iterable<T>, compare?: (a: T, b: T) => number) {
  return [...new Set(values)].sort(compare);
}

interface BrowsePageProps {
  onViewIn3D: (petId: string, skinId: string) => void;
}

interface OwnedEditorProps {
  canViewIn3D: boolean;
  onRemove: () => void;
  onSave: (draft: { quantity: number; acquiredDate?: string; pricePaid?: number }) => void;
  onViewIn3D: () => void;
  selectedOwned?: OwnedCosmeticEntry;
}

function OwnedEditor({ canViewIn3D, onRemove, onSave, onViewIn3D, selectedOwned }: OwnedEditorProps) {
  const [quantity, setQuantity] = useState(selectedOwned?.quantity ?? 1);
  const [acquiredDate, setAcquiredDate] = useState(selectedOwned?.acquiredDate ?? '');
  const [pricePaid, setPricePaid] = useState(selectedOwned?.pricePaid != null ? String(selectedOwned.pricePaid) : '');

  return (
    <div className="flex flex-col gap-4 border-2 border-[#222] bg-[#111111] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#777]">Owned details</div>
        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#666]">
          {canViewIn3D ? '3D preview ready' : 'Browse-only preview'}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#666]">Quantity</span>
          <input
            type="number"
            min={0}
            step={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full border-2 border-[#1a1a1a] bg-[#0b0b0b] px-3 py-3 text-sm font-bold text-white outline-none focus:border-emerald-500"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#666]">
            <Calendar className="h-3.5 w-3.5 text-[#666]" />
            Acquired date
          </span>
          <input
            type="date"
            value={acquiredDate}
            onChange={(e) => setAcquiredDate(e.target.value)}
            className="w-full border-2 border-[#1a1a1a] bg-[#0b0b0b] px-3 py-3 text-sm font-bold text-white outline-none focus:border-emerald-500"
            style={{ colorScheme: 'dark' }}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#666]">
            <Coins className="h-3.5 w-3.5 text-[#666]" />
            Price paid
          </span>
          <input
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            placeholder="Optional"
            value={pricePaid}
            onChange={(e) => setPricePaid(e.target.value)}
            className="w-full border-2 border-[#1a1a1a] bg-[#0b0b0b] px-3 py-3 text-sm font-bold text-white outline-none focus:border-emerald-500 placeholder:text-[#444]"
          />
        </label>
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <button
          onClick={() =>
            onSave({
              quantity,
              acquiredDate: acquiredDate.trim() === '' ? undefined : acquiredDate,
              pricePaid: pricePaid.trim() === '' ? undefined : Number(pricePaid),
            })
          }
          className="flex w-full items-center justify-center gap-2 border-b-4 border-emerald-700 bg-emerald-500 py-3 text-[10px] font-black uppercase tracking-widest text-black transition-all hover:bg-emerald-400 active:translate-y-[2px] active:border-b-0"
        >
          {selectedOwned ? <PackageCheck className="h-4 w-4" /> : <PackagePlus className="h-4 w-4" />}
          {selectedOwned ? 'Save owned changes' : 'Add to owned'}
        </button>

        {selectedOwned && (
          <button
            onClick={onRemove}
            className="w-full border-2 border-[#333] bg-[#1a1a1a] py-3 text-[10px] font-black uppercase tracking-widest text-[#ddd] transition-colors hover:border-[#555] hover:bg-[#202020]"
          >
            Remove from owned
          </button>
        )}

        <button
          onClick={onViewIn3D}
          disabled={!canViewIn3D}
          className={`w-full border-2 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${
            canViewIn3D
              ? 'border-[#224444] bg-[#102020] text-emerald-200 hover:border-emerald-500 hover:bg-[#143030]'
              : 'cursor-not-allowed border-[#2d2d2d] bg-[#171717] text-[#666]'
          }`}
        >
          {canViewIn3D ? 'View in 3D' : '3D preview unavailable'}
        </button>
      </div>
    </div>
  );
}

export function BrowsePage({ onViewIn3D }: BrowsePageProps) {
  const {
    registry,
    browseLayout,
    ownedCosmetics,
    setBrowseLayout,
    upsertOwnedCosmetic,
    updateOwnedCosmetic,
    removeOwnedCosmetic,
  } = useAppStore();

  const petIds = useMemo(() => Object.keys(registry), [registry]);
  const loadTotal = useMemo(() => getCatalogLoadUnitCount(registry), [registry]);

  const [loading, setLoading] = useState(false);
  const [loadDone, setLoadDone] = useState(0);
  const [allItems, setAllItems] = useState<CatalogItem[]>([]);

  const [query, setQuery] = useState('');
  const [ownedOnly, setOwnedOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState<CosmeticTypeFilter>('all');
  const [rarityFilters, setRarityFilters] = useState<CosmeticRarity[]>([]);
  const [rarityFilterOpen, setRarityFilterOpen] = useState(false);
  const [sortAll, setSortAll] = useState<SortModeAll>('type');
  const [sortOwned, setSortOwned] = useState<SortModeOwned>('date');

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const petCatalogKey = useMemo(() => petIds.join('|'), [petIds]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (petIds.length === 0) return;

      setLoading(true);
      setLoadDone(0);
      setAllItems([]);
      setSelectedKey(null);

      const items = await loadCosmeticCatalog(registry, () => {
        if (!cancelled) setLoadDone((current) => current + 1);
      });

      if (cancelled) return;
      setAllItems(items);
      setLoading(false);
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [petCatalogKey, petIds.length, registry]);

  const itemsByKey = useMemo(() => {
    const map = new Map<string, CatalogItem>();
    for (const item of allItems) map.set(item.key, item);
    return map;
  }, [allItems]);

  const ownedEntries = useMemo(
    () => Object.values(ownedCosmetics).filter((entry) => (entry?.quantity ?? 0) > 0),
    [ownedCosmetics],
  );

  const typeCounts = useMemo(() => {
    const counts: Record<CosmeticTypeFilter, number> = {
      all: allItems.length,
      petSkin: 0,
      dye: 0,
      helmetSkin: 0,
    };

    for (const item of allItems) counts[item.type] += 1;
    return counts;
  }, [allItems]);

  const scopedItems = useMemo(() => {
    const items: CatalogItem[] = ownedOnly
      ? ownedEntries.map((entry) => itemsByKey.get(entry.key)).filter((item): item is CatalogItem => Boolean(item))
      : allItems;

    if (typeFilter !== 'all') {
      return items.filter((item) => item.type === typeFilter);
    }

    return items;
  }, [allItems, itemsByKey, ownedEntries, ownedOnly, typeFilter]);

  const rarityOptions = useMemo(
    () =>
      uniqueSortedValues(
        scopedItems.map((item) => item.rarity),
        compareBrowseRarity,
      ),
    [scopedItems],
  );

  useEffect(() => {
    setRarityFilters((current) => current.filter((rarity) => rarityOptions.includes(rarity)));
  }, [rarityOptions]);

  const toggleRarityFilter = (rarity: CosmeticRarity) => {
    setRarityFilters((current) =>
      current.includes(rarity) ? current.filter((value) => value !== rarity) : [...current, rarity].sort(compareBrowseRarity),
    );
  };

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const hasRarityFilters = rarityFilters.length > 0;

    return scopedItems
      .filter((item) => (hasRarityFilters ? rarityFilters.includes(item.rarity) : true))
      .filter((item) => matchesBrowseQuery(item, q));
  }, [query, rarityFilters, scopedItems]);

  const hasAdvancedFilters = rarityFilters.length > 0;
  const raritySummary = hasAdvancedFilters ? `${rarityFilters.length} selected` : 'All rarities';

  const sortedItems = useMemo(() => {
    const items = [...filteredItems];

    if (!ownedOnly) {
      switch (sortAll) {
        case 'type':
          items.sort(
            (a, b) =>
              a.typeLabel.localeCompare(b.typeLabel) ||
              a.parentNamePlain.localeCompare(b.parentNamePlain) ||
              a.itemNamePlain.localeCompare(b.itemNamePlain),
          );
          break;
        case 'source':
          items.sort((a, b) => a.parentNamePlain.localeCompare(b.parentNamePlain) || a.itemNamePlain.localeCompare(b.itemNamePlain));
          break;
        case 'item':
          items.sort((a, b) => a.itemNamePlain.localeCompare(b.itemNamePlain) || a.parentNamePlain.localeCompare(b.parentNamePlain));
          break;
        case 'rarity':
          items.sort(
            (a, b) =>
              b.rarityRank - a.rarityRank ||
              a.typeLabel.localeCompare(b.typeLabel) ||
              a.itemNamePlain.localeCompare(b.itemNamePlain),
          );
          break;
        default: {
          const exhaustiveCheck: never = sortAll;
          return exhaustiveCheck;
        }
      }

      return items;
    }

    switch (sortOwned) {
      case 'date':
        items.sort((a, b) => {
          const ad = ownedCosmetics[a.key]?.acquiredDate;
          const bd = ownedCosmetics[b.key]?.acquiredDate;
          const at = ad ? Date.parse(ad) : -1;
          const bt = bd ? Date.parse(bd) : -1;
          return bt - at || a.typeLabel.localeCompare(b.typeLabel) || a.itemNamePlain.localeCompare(b.itemNamePlain);
        });
        break;
      case 'qty':
        items.sort(
          (a, b) =>
            (ownedCosmetics[b.key]?.quantity ?? 0) - (ownedCosmetics[a.key]?.quantity ?? 0) ||
            a.itemNamePlain.localeCompare(b.itemNamePlain),
        );
        break;
      case 'item':
        items.sort((a, b) => a.itemNamePlain.localeCompare(b.itemNamePlain) || a.parentNamePlain.localeCompare(b.parentNamePlain));
        break;
      case 'source':
        items.sort((a, b) => a.parentNamePlain.localeCompare(b.parentNamePlain) || a.itemNamePlain.localeCompare(b.itemNamePlain));
        break;
      default: {
        const exhaustiveCheck: never = sortOwned;
        return exhaustiveCheck;
      }
    }

    return items;
  }, [filteredItems, ownedCosmetics, ownedOnly, sortAll, sortOwned]);

  const resolvedSelectedKey = useMemo(() => {
    if (selectedKey && itemsByKey.has(selectedKey)) return selectedKey;
    return sortedItems[0]?.key ?? null;
  }, [itemsByKey, selectedKey, sortedItems]);

  const selected = useMemo(
    () => (resolvedSelectedKey ? itemsByKey.get(resolvedSelectedKey) ?? null : null),
    [itemsByKey, resolvedSelectedKey],
  );
  const selectedOwned = selected ? ownedCosmetics[selected.key] : undefined;

  const handleSaveOwned = (draft: { quantity: number; acquiredDate?: string; pricePaid?: number }) => {
    if (!selected) return;

    const qty = Math.max(0, Math.floor(Number.isFinite(draft.quantity) ? draft.quantity : 0));
    if (qty <= 0) {
      removeOwnedCosmetic(selected.key);
      return;
    }

    const pricePaid = draft.pricePaid != null && Number.isFinite(draft.pricePaid) ? draft.pricePaid : undefined;

    const base: Omit<OwnedCosmeticEntry, 'updatedAt'> = {
      key: selected.key,
      type: selected.type,
      parentId: selected.parentId,
      parentName: selected.parentName,
      itemId: selected.itemId,
      itemName: selected.itemName,
      rarity: selected.rarity,
      quantity: qty,
      acquiredDate: draft.acquiredDate,
      pricePaid,
    };

    if (ownedCosmetics[selected.key]) updateOwnedCosmetic(selected.key, base);
    else upsertOwnedCosmetic(base);
  };

  const selectedLore = selected?.lore ? stripMinecraftFormatting(selected.lore) : null;
  const selectedCanViewIn3D = Boolean(selected?.viewerSupport === 'petViewer' && selected.viewIn3D);
  const selectedHex = selected ? rarityHex(selected.rarity) : null;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-white/10 bg-[#181818]">
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="grid grid-cols-2 gap-3 xl:min-w-[260px]">
              <div className="border-2 border-[#252525] bg-[#111111] px-4 py-3">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#666]">Catalog</div>
                <div className="mt-2 text-lg font-black text-white">{allItems.length}</div>
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#777]">Total cosmetics</div>
              </div>
              <div className="border-2 border-[#252525] bg-[#111111] px-4 py-3">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#666]">Owned</div>
                <div className="mt-2 text-lg font-black text-emerald-300">{ownedEntries.length}</div>
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#777]">Tracked entries</div>
              </div>
            </div>

            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-[#777777]" />
              <input
                type="text"
                placeholder="Search by item, source, category, or cosmetic type..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-[#111111] border-2 border-[#252525] focus:border-emerald-500 outline-none pl-11 pr-4 py-3 text-sm font-bold placeholder:text-[#555555] rounded-none transition-colors"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((filterValue) => {
                const Icon = getTypeIcon(filterValue);
                const isActive = typeFilter === filterValue;

                return (
                  <button
                    key={filterValue}
                    onClick={() => setTypeFilter(filterValue)}
                    className={`flex items-center gap-2 border-2 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] transition-colors ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-500/12 text-emerald-200'
                        : 'border-[#252525] bg-[#111111] text-[#9a9a9a] hover:border-[#3a3a3a] hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{getTypeFilterLabel(filterValue)}</span>
                    <span className="border border-white/10 bg-black/20 px-2 py-1 text-[10px] text-[#d4d4d4]">
                      {typeCounts[filterValue]}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-2">
              <label className="flex cursor-pointer select-none items-center gap-2 border-2 border-[#252525] bg-[#111111] px-4 py-3 transition-colors hover:border-[#333333]">
                <Filter className="h-4 w-4 text-[#888888]" />
                <div
                  className={`flex h-4 w-4 items-center justify-center border-2 transition-colors ${
                    ownedOnly ? 'border-emerald-500 bg-emerald-500' : 'border-[#333333] bg-[#0b0b0b]'
                  }`}
                >
                  {ownedOnly && <div className="h-2 w-2 bg-white" />}
                </div>
                <input type="checkbox" checked={ownedOnly} onChange={(e) => setOwnedOnly(e.target.checked)} className="hidden" />
                <span className="whitespace-nowrap text-xs font-bold uppercase tracking-widest text-[#aaaaaa]">Owned only</span>
              </label>

              <div className="flex items-center gap-2 border-2 border-[#252525] bg-[#111111] px-4 py-3">
                <span className="whitespace-nowrap text-[10px] font-black uppercase tracking-[0.18em] text-[#666]">Sort</span>
                {!ownedOnly ? (
                  <select
                    value={sortAll}
                    onChange={(e) => setSortAll(e.target.value as SortModeAll)}
                    className="bg-[#0b0b0b] border border-[#222] px-2 py-1 text-xs font-bold text-[#ddd] outline-none focus:border-emerald-500"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="type">Cosmetic type</option>
                    <option value="source">Source name</option>
                    <option value="item">Item name</option>
                    <option value="rarity">Rarity</option>
                  </select>
                ) : (
                  <select
                    value={sortOwned}
                    onChange={(e) => setSortOwned(e.target.value as SortModeOwned)}
                    className="bg-[#0b0b0b] border border-[#222] px-2 py-1 text-xs font-bold text-[#ddd] outline-none focus:border-emerald-500"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="date">Date acquired</option>
                    <option value="qty">Quantity</option>
                    <option value="item">Item name</option>
                    <option value="source">Source name</option>
                  </select>
                )}
              </div>

              <div className="flex items-center gap-2 border-2 border-[#252525] bg-[#111111] px-2 py-2">
                <button
                  onClick={() => setBrowseLayout('grid')}
                  className={`flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${
                    browseLayout === 'grid'
                      ? 'border border-emerald-500/40 bg-emerald-500/12 text-emerald-200'
                      : 'border border-transparent text-[#888] hover:text-white'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                  Grid
                </button>
                <button
                  onClick={() => setBrowseLayout('list')}
                  className={`flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${
                    browseLayout === 'list'
                      ? 'border border-emerald-500/40 bg-emerald-500/12 text-emerald-200'
                      : 'border border-transparent text-[#888] hover:text-white'
                  }`}
                >
                  <AlignJustify className="h-4 w-4" />
                  List
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="w-full max-w-[230px] border-2 border-[#252525] bg-[#111111]">
              <button
                onClick={() => setRarityFilterOpen((current) => !current)}
                className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition-colors hover:bg-white/[0.03]"
              >
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#666]">Rarity</div>
                  <div className="mt-1 truncate text-[10px] font-bold uppercase tracking-[0.14em] text-[#8a8a8a]">{raritySummary}</div>
                </div>
                {rarityFilterOpen ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-[#888]" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-[#888]" />
                )}
              </button>

              {rarityFilterOpen && (
                <div className="border-t border-[#252525] px-3 py-3">
                  <div className="flex flex-col gap-1.5">
                    {rarityOptions.map((rarity) => {
                      const isActive = rarityFilters.includes(rarity);

                      return (
                        <button
                          key={rarity}
                          onClick={() => toggleRarityFilter(rarity)}
                          className={`flex items-center justify-between gap-3 border px-3 py-2 text-left transition-colors ${
                            isActive
                              ? 'border-white/25 bg-black/25'
                              : 'border-[#222222] bg-[#0b0b0b] hover:border-[#3a3a3a] hover:bg-[#121212]'
                          }`}
                        >
                          <span className="mc-font text-xs font-black uppercase tracking-[0.14em]" style={{ color: rarityHex(rarity) }}>
                            {rarity}
                          </span>
                          <span
                            className={`h-4 w-4 border-2 ${
                              isActive ? 'border-emerald-500 bg-emerald-500' : 'border-[#333333] bg-transparent'
                            }`}
                          >
                            {isActive && <span className="block h-full w-full scale-[0.45] bg-white" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#666]">No selection shows all</div>
                    {hasAdvancedFilters && (
                      <button
                        onClick={() => setRarityFilters([])}
                        className="text-[10px] font-black uppercase tracking-[0.16em] text-[#9e9e9e] transition-colors hover:text-white"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {loading && (
            <div className="w-full border border-white/10 bg-black/30 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#777]">Building unified cosmetic index</div>
                  <div className="mt-2 text-sm font-bold text-[#d0d0d0]">
                    Loading pets, dyes, and helmet skins into one browse catalog.
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-white">
                    {loadDone}/{loadTotal}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#666]">Sources indexed</div>
                </div>
              </div>
              <div className="mt-4 h-2 border border-[#222] bg-[#0b0b0b]">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: loadTotal ? `${Math.min(100, Math.round((loadDone / loadTotal) * 100))}%` : '0%' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_380px]">
        <ScrollArea className="h-full">
          {sortedItems.length === 0 ? (
            <div className="flex h-full items-center justify-center p-8">
              <div className="max-w-md border-2 border-[#252525] bg-[#121212] p-8 text-center">
                <div className="text-sm font-black uppercase tracking-widest text-[#aaa]">No cosmetics found</div>
                <div className="mt-3 text-sm leading-relaxed text-[#777]">
                  Try broadening your search, clearing the active type filter, or disabling the owned-only view.
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 md:p-5">
              {browseLayout === 'grid' ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {sortedItems.map((item) => {
                    const isSelected = resolvedSelectedKey === item.key;
                    const owned = ownedCosmetics[item.key];
                    const hex = rarityHex(item.rarity);
                    const browseDescription = getBrowseDescription(item);

                    return (
                      <button
                        key={item.key}
                        onClick={() => setSelectedKey(item.key)}
                        onMouseEnter={() => setHoveredKey(item.key)}
                        onMouseLeave={() => setHoveredKey((current) => (current === item.key ? null : current))}
                        className={`border-2 p-4 text-left transition-all duration-150 ${
                          isSelected
                            ? 'border-emerald-500 bg-[#111111] shadow-[0_0_0_2px_rgba(16,185,129,0.25)]'
                            : 'border-[#222222] bg-[#111111] hover:border-[#333333] hover:bg-[#151515]'
                        }`}
                      >
                        <div className="aspect-square w-full overflow-hidden border border-white/10 bg-black/20">
                          <CosmeticThumb
                            item={item}
                            play={hoveredKey === item.key || resolvedSelectedKey === item.key}
                            background={false}
                            yawDeg={PREVIEW_YAW}
                            pitchDeg={PREVIEW_PITCH}
                            rotationDeg={PREVIEW_ROTATION}
                            className="h-full w-full"
                          />
                        </div>

                        <div className="mt-4 flex flex-col gap-2">
                          <div className="flex flex-wrap gap-2">
                            <span className="border border-white/10 bg-black/20 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#aaa]">
                              {item.typeLabel}
                            </span>
                            {item.animated && (
                              <span className="border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-amber-300">
                                Animated
                              </span>
                            )}
                          </div>

                          <div
                            className="mc-font line-clamp-2 leading-snug"
                            style={{ color: hex, fontSize: '16px', lineHeight: 1.35 }}
                          >
                            {item.itemNamePlain}
                          </div>
                          <div className="truncate text-[11px] font-bold uppercase tracking-[0.16em] text-[#777]">{item.parentNamePlain}</div>
                          {browseDescription && (
                            <div className="line-clamp-2 text-xs leading-relaxed text-[#8a8a8a]">{browseDescription}</div>
                          )}

                          <div className="mt-1 flex items-center justify-between gap-2">
                            {owned ? (
                              <span className="border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-300">
                                x{owned.quantity} owned
                              </span>
                            ) : (
                              <span className="border border-white/5 bg-black/20 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#666]">
                                not owned
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {sortedItems.map((item) => {
                    const isSelected = resolvedSelectedKey === item.key;
                    const owned = ownedCosmetics[item.key];
                    const hex = rarityHex(item.rarity);
                    const browseDescription = getBrowseDescription(item);

                    return (
                      <button
                        key={item.key}
                        onClick={() => setSelectedKey(item.key)}
                        onMouseEnter={() => setHoveredKey(item.key)}
                        onMouseLeave={() => setHoveredKey((current) => (current === item.key ? null : current))}
                        className={`grid grid-cols-[96px_minmax(0,1fr)] gap-4 border-2 p-4 text-left transition-all duration-150 ${
                          isSelected
                            ? 'border-emerald-500 bg-[#141414] shadow-[0_0_0_2px_rgba(16,185,129,0.22)]'
                            : 'border-[#222222] bg-[#111111] hover:border-[#333333] hover:bg-[#151515]'
                        }`}
                      >
                        <div className="aspect-square w-24 overflow-hidden border border-white/10 bg-black/20">
                          <CosmeticThumb
                            item={item}
                            play={hoveredKey === item.key || resolvedSelectedKey === item.key}
                            background={false}
                            yawDeg={PREVIEW_YAW}
                            pitchDeg={PREVIEW_PITCH}
                            rotationDeg={PREVIEW_ROTATION}
                            className="h-full w-full"
                          />
                        </div>

                        <div className="flex min-w-0 flex-col gap-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div
                                className="mc-font leading-tight"
                                style={{ color: hex, fontSize: '16px', lineHeight: 1.35 }}
                              >
                                {item.itemNamePlain}
                              </div>
                              <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#777]">{item.parentNamePlain}</div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <span className="border border-white/10 bg-black/20 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#aaa]">
                                {item.typeLabel}
                              </span>
                              {item.animated && (
                                <span className="border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-amber-300">
                                  Animated
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid gap-3 text-sm text-[#8e8e8e] md:grid-cols-[minmax(0,1fr)_180px]">
                            <div className="leading-relaxed">{browseDescription ?? item.category}</div>
                            <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
                              <span className="border border-white/10 bg-black/20 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#aaa]">
                                {item.category}
                              </span>
                              {owned ? (
                                <span className="border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-300">
                                  x{owned.quantity} owned
                                </span>
                              ) : (
                                <span className="border border-white/5 bg-black/20 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#666]">
                                  not owned
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="flex flex-col gap-4 overflow-hidden border-l-4 border-[#222] bg-[#141414] p-4 md:p-5">
          {!selected ? (
            <div className="flex flex-1 items-center justify-center p-6 text-center">
              <div className="max-w-sm">
                <div className="text-sm font-black uppercase tracking-widest text-[#aaa]">Select a cosmetic</div>
                <div className="mt-3 text-sm leading-relaxed text-[#666]">
                  Pick an entry from the catalog to manage owned quantities, inspect metadata, and jump into the pet viewer when a 3D preview is supported.
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex gap-4 border-2 border-[#222] bg-[#0f0f0f] p-4">
                <div className="h-24 w-24 shrink-0 overflow-hidden border border-white/10 bg-black/20">
                  <CosmeticThumb
                    item={selected}
                    play={selected.animated}
                    background={false}
                    yawDeg={PREVIEW_YAW}
                    pitchDeg={PREVIEW_PITCH}
                    rotationDeg={PREVIEW_ROTATION}
                    className="h-full w-full"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className="mc-font leading-snug"
                    style={{ color: selectedHex ?? '#ffffff', fontSize: '17px', lineHeight: 1.35 }}
                  >
                    {selected.itemNamePlain}
                  </div>
                  <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#777]">{selected.parentNamePlain}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selected.animated && (
                      <span className="border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-amber-300">
                        Animated
                      </span>
                    )}
                    {selectedOwned && (
                      <span className="border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-300">
                        Owned x{selectedOwned.quantity}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <OwnedEditor
                key={`${selected.key}:${selectedOwned?.updatedAt ?? 'new'}`}
                canViewIn3D={selectedCanViewIn3D}
                onRemove={() => removeOwnedCosmetic(selected.key)}
                onSave={handleSaveOwned}
                onViewIn3D={() => {
                  if (selectedCanViewIn3D && selected.viewIn3D) {
                    onViewIn3D(selected.viewIn3D.petId, selected.viewIn3D.skinId);
                  }
                }}
                selectedOwned={selectedOwned}
              />

              {(selectedLore || selected.infoUrls.length > 0) && (
                <div className="flex min-h-0 flex-1 flex-col gap-3">
                  {selectedLore && (
                    <ScrollArea className="min-h-0 flex-1 border-2 border-[#222] bg-[#0f0f0f]">
                      <div className="whitespace-pre-wrap p-4 text-sm leading-relaxed text-[#aaa]">{selectedLore}</div>
                    </ScrollArea>
                  )}

                  {selected.infoUrls.length > 0 && (
                    <div className="grid gap-2">
                      {selected.infoUrls.map((url) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="border-2 border-[#2c3f3f] bg-[#102020] px-4 py-3 text-center text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200 transition-colors hover:border-emerald-500 hover:bg-[#143030]"
                        >
                          Open reference
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
