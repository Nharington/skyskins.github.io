import { useEffect, useMemo, useState } from 'react';
import {
  AlignJustify,
  ChevronDown,
  ChevronUp,
  Filter,
  Grid3X3,
  PackageCheck,
  PackageX,
  Search,
  Sparkles,
  SunMoon,
  X,
} from 'lucide-react';
import { CosmeticThumb } from '../components/collection/CosmeticThumb';
import { SkinHeadThumb } from '../components/collection/SkinHeadThumb';
import { ScrollArea } from '../components/ui/scroll-area';
import {
  getCatalogLoadUnitCount,
  loadCosmeticCatalog,
  type CatalogItem,
  type CosmeticRarity,
  type OwnedCosmeticEntry,
} from '../lib/cosmetics';
import { useAppStore } from '../store/useAppStore';
import { rarityHex, compareBrowseRarity, stripMinecraftFormatting } from '../utils/skinRarity';
import { 
  type CosmeticTypeFilter, 
  getBrowseDescription, 
  getTypeIcon, 
  getTypeFilterLabel, 
  matchesBrowseQuery, 
  uniqueSortedValues 
} from '../utils/browseUtils';
import { OwnedEditor } from '../components/browse/OwnedEditor';

type SortModeAll = 'type' | 'source' | 'item' | 'rarity';
type SortModeOwned = 'date' | 'qty' | 'item' | 'source';

const PREVIEW_YAW = -42;
const PREVIEW_PITCH = 27;
const PREVIEW_ROTATION = 19;
const FILTERS: ReadonlyArray<CosmeticTypeFilter> = ['all', 'petSkin', 'dye', 'helmetSkin'];

interface BrowsePageProps {
  onViewIn3D: (petId: string, skinId: string) => void;
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
  const [mobileInfoOpen, setMobileInfoOpen] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
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
      <div className="border-b border-[#252525] bg-[#111] shrink-0">
        <div className="flex flex-col gap-2 p-2 md:p-3 xl:px-4 xl:py-3 cursor-default">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2 xl:gap-4">
            <div className="flex flex-nowrap md:flex-wrap overflow-x-auto gap-1.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden w-full xl:w-auto">
              {FILTERS.map((filterValue) => {
                const Icon = getTypeIcon(filterValue);
                const isActive = typeFilter === filterValue;
                return (
                  <button
                    key={filterValue}
                    onClick={() => setTypeFilter(filterValue)}
                    className={`shrink-0 flex items-center h-9 gap-1.5 border px-2.5 text-[10px] md:text-[11px] font-black uppercase tracking-[0.16em] transition-colors ${
                      isActive
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                        : 'border-[#222] bg-[#151515] text-[#888] hover:border-[#444] hover:text-[#ccc]'
                    }`}
                  >
                    <Icon className="h-3 w-3 md:h-3.5 md:w-3.5" />
                    <span>{getTypeFilterLabel(filterValue)}</span>
                    <span className="border border-white/5 bg-black/40 px-1 py-0.5 text-[9px] text-[#aaa]">
                      {typeCounts[filterValue]}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative w-full xl:flex-1 shrink-0 h-9">
              <Search className="absolute left-2.5 top-[11px] h-3.5 w-3.5 text-[#555]" />
              <input
                type="text"
                placeholder="Search catalog..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-full bg-[#151515] border border-[#222] focus:border-emerald-500/50 outline-none pl-8 pr-8 text-xs font-bold text-[#eee] placeholder:text-[#555] transition-colors"
                autoComplete="off"
                spellCheck={false}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-2.5 top-[11px] text-[#555] hover:text-[#aaa] transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="xl:hidden flex w-full h-9 items-center justify-between border border-[#222] bg-[#151515] px-3 text-left transition-colors hover:bg-white/[0.03]"
          >
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-[#777]" />
              <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-[#999]">Filters & Settings</span>
            </div>
            {showMobileFilters ? (
              <ChevronUp className="h-3.5 w-3.5 text-[#777]" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-[#777]" />
            )}
          </button>

          <div className={`flex flex-col xl:flex-row xl:items-center justify-between gap-2 xl:gap-4 ${showMobileFilters ? 'flex' : 'hidden xl:flex'} transition-all`}>
            <div className="flex gap-2">
              <div className="flex items-center h-9 gap-2 border border-[#222] bg-[#151515] px-2.5 text-[9px] md:text-[10px] font-black uppercase tracking-[0.16em] text-[#777]">
                <span>Catalog</span>
                <span className="text-white border-l border-[#333] pl-2">{allItems.length}</span>
              </div>
              <div className="flex items-center h-9 gap-2 border border-[#222] bg-[#151515] px-2.5 text-[9px] md:text-[10px] font-black uppercase tracking-[0.16em] text-[#777]">
                <span>Owned</span>
                <span className="text-emerald-400 border-l border-[#333] pl-2">{ownedEntries.length}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center h-9 gap-1.5 border border-[#222] bg-[#151515] px-2.5 text-[9px] md:text-[10px] font-black uppercase tracking-[0.16em] text-[#aaa] cursor-pointer hover:border-[#444] transition-colors select-none">
                <div
                  className={`flex shrink-0 h-3 w-3 items-center justify-center border transition-colors ${
                    ownedOnly ? 'border-emerald-500 bg-emerald-500' : 'border-[#444] bg-[#0b0b0b]'
                  }`}
                >
                  {ownedOnly && <div className="h-1.5 w-1.5 bg-white" />}
                </div>
                <input type="checkbox" checked={ownedOnly} onChange={(e) => setOwnedOnly(e.target.checked)} className="hidden" />
                <span>Owned only</span>
              </label>

              <div className="flex flex-1 xl:flex-none h-9 items-center gap-2 border border-[#222] bg-[#151515] px-2.5 relative">
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.18em] text-[#666]">Sort</span>
                {!ownedOnly ? (
                  <select
                    value={sortAll}
                    onChange={(e) => setSortAll(e.target.value as SortModeAll)}
                    className="bg-transparent text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#ccc] outline-none w-full xl:w-auto cursor-pointer"
                  >
                    <option value="type" className="bg-[#111]">Cosmetic type</option>
                    <option value="source" className="bg-[#111]">Source name</option>
                    <option value="item" className="bg-[#111]">Item name</option>
                    <option value="rarity" className="bg-[#111]">Rarity</option>
                  </select>
                ) : (
                  <select
                    value={sortOwned}
                    onChange={(e) => setSortOwned(e.target.value as SortModeOwned)}
                    className="bg-transparent text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#ccc] outline-none w-full xl:w-auto cursor-pointer"
                  >
                    <option value="date" className="bg-[#111]">Date acquired</option>
                    <option value="qty" className="bg-[#111]">Quantity</option>
                    <option value="item" className="bg-[#111]">Item name</option>
                    <option value="source" className="bg-[#111]">Source name</option>
                  </select>
                )}
              </div>

              <div className="flex items-center h-9 gap-0.5 border border-[#222] bg-[#151515] p-1">
                <button
                  onClick={() => setBrowseLayout('grid')}
                  className={`flex items-center h-full gap-1 px-2 text-[9px] md:text-[10px] font-black uppercase tracking-[0.16em] transition-colors ${
                    browseLayout === 'grid'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'text-[#888] hover:text-[#ccc]'
                  }`}
                >
                  <Grid3X3 className="h-3 w-3" />
                  Grid
                </button>
                <button
                  onClick={() => setBrowseLayout('list')}
                  className={`flex items-center h-full gap-1 px-2 text-[9px] md:text-[10px] font-black uppercase tracking-[0.16em] transition-colors ${
                    browseLayout === 'list'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'text-[#888] hover:text-[#ccc]'
                  }`}
                >
                  <AlignJustify className="h-3 w-3" />
                  List
                </button>
              </div>

              <div className="relative w-full xl:w-[220px] h-9 shrink-0 border border-[#222] bg-[#151515]">
                <button
                  onClick={() => setRarityFilterOpen((current) => !current)}
                  className="flex h-full w-full items-center justify-between gap-2 px-2.5 text-left transition-colors hover:bg-white/[0.03]"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.18em] text-[#666]">Rarity</span>
                    <span className="truncate text-[9px] md:text-[10px] font-bold uppercase tracking-[0.14em] text-[#aaa]">{raritySummary}</span>
                  </div>
                  {rarityFilterOpen ? (
                    <ChevronUp className="h-3.5 w-3.5 shrink-0 text-[#888]" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#888]" />
                  )}
                </button>

                {rarityFilterOpen && (
                  <div className="absolute z-20 top-[100%] left-[-1px] w-[calc(100%+2px)] border border-[#222] border-t-0 bg-[#151515] shadow-2xl">
                    <div className="flex flex-col p-1.5 gap-1 max-h-[40vh] overflow-y-auto">
                      {rarityOptions.map((rarity) => {
                        const isActive = rarityFilters.includes(rarity);
                        return (
                          <button
                            key={rarity}
                            onClick={() => toggleRarityFilter(rarity)}
                            className={`flex items-center justify-between gap-2 border px-2 py-1 text-left transition-colors ${
                              isActive
                                ? 'border-emerald-500/20 bg-emerald-500/10'
                                : 'border-transparent hover:bg-white/5'
                            }`}
                          >
                            <span className="mc-font text-[10px] md:text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: rarityHex(rarity) }}>
                              {rarity}
                            </span>
                            <div
                              className={`flex shrink-0 h-3 w-3 items-center justify-center border transition-colors ${
                                isActive ? 'border-emerald-500 bg-emerald-500' : 'border-[#444] bg-[#0b0b0b]'
                              }`}
                            >
                              {isActive && <div className="h-1.5 w-1.5 bg-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-[#222] p-2 bg-[#111]">
                      <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-[0.16em] text-[#666]">No selection shows all</span>
                      {hasAdvancedFilters && (
                        <button
                          onClick={() => setRarityFilters([])}
                          className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.16em] text-[#aaa] hover:text-white"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {loading && (
            <div className="w-full border border-emerald-500/20 bg-emerald-500/5 p-2 md:p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#888]">Building index...</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black text-white px-2 py-0.5 border border-white/10 bg-black/20">{loadDone} / {loadTotal}</div>
                </div>
              </div>
              <div className="mt-2 h-0.5 bg-[#111] w-full">
                <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: loadTotal ? `${Math.min(100, Math.round((loadDone / loadTotal) * 100))}%` : '0%' }} />
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
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                  {sortedItems.map((item) => {
                    const isSelected = resolvedSelectedKey === item.key;
                    const owned = ownedCosmetics[item.key];
                    const hex = rarityHex(item.rarity);
                    const browseDescription = getBrowseDescription(item);

                    return (
                      <button
                        key={item.key}
                        onClick={() => { setSelectedKey(item.key); setMobileInfoOpen(true); }}
                        onMouseEnter={() => setHoveredKey(item.key)}
                        onMouseLeave={() => setHoveredKey((current) => (current === item.key ? null : current))}
                        className={`group relative flex flex-col border-2 p-4 text-left transition-all duration-300 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                            : 'border-[#222222] bg-[#111111] hover:border-[#444444] hover:bg-[#151515]'
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

                        <div className="mt-4 flex flex-1 flex-col gap-2">
                          <div className="flex flex-wrap gap-1.5">
                            <span className="border border-white/10 bg-black/20 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-[#aaa]">
                              {item.typeLabel}
                            </span>
                            {item.animation && 'day' in item.animation ? (
                              <span className="flex items-center gap-1 border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-300" title="Day/Night Animated">
                                <SunMoon className="h-3 w-3" />
                              </span>
                            ) : item.animated ? (
                              <span className="flex items-center gap-1 border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-amber-300" title="Animated">
                                <Sparkles className="h-3 w-3" />
                              </span>
                            ) : null}
                          </div>

                          <div
                            className="mc-font line-clamp-2 leading-snug"
                            style={{ color: hex, fontSize: '16px', lineHeight: 1.35 }}
                          >
                            {item.itemNamePlain}
                          </div>
                          <div className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-[#777]">{item.parentNamePlain}</div>
                          {browseDescription && (
                            <div className="line-clamp-2 text-[11px] leading-relaxed text-[#8a8a8a]">{browseDescription}</div>
                          )}

                          <div className="mt-1 flex items-center justify-between gap-2">
                            {owned ? (
                              <span className="flex items-center gap-1 border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-emerald-300">
                                <PackageCheck className="h-3 w-3" />
                                x{owned.quantity}
                              </span>
                            ) : (
                              <span className="flex items-center border border-white/5 bg-black/20 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#555]" title="Not owned">
                                <PackageX className="h-3 w-3" />
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
                        onClick={() => { setSelectedKey(item.key); setMobileInfoOpen(true); }}
                        onMouseEnter={() => setHoveredKey(item.key)}
                        onMouseLeave={() => setHoveredKey((current) => (current === item.key ? null : current))}
                        className={`group relative grid grid-cols-[96px_minmax(0,1fr)] gap-4 border-2 p-4 text-left transition-all duration-300 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                            : 'border-[#222222] bg-[#111111] hover:border-[#444444] hover:bg-[#151515]'
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
                            <div className="flex flex-wrap gap-1.5 h-fit">
                              <span className="border border-white/10 bg-black/20 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-[#aaa]">
                                {item.typeLabel}
                              </span>
                              {item.animation && 'day' in item.animation ? (
                                <span className="flex items-center border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-300" title="Day/Night Animated">
                                  <SunMoon className="h-3 w-3" />
                                </span>
                              ) : item.animated ? (
                                <span className="flex items-center border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-amber-300" title="Animated">
                                  <Sparkles className="h-3 w-3" />
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div className="grid gap-3 text-xs text-[#8e8e8e] md:grid-cols-[minmax(0,1fr)_180px]">
                            <div className="leading-relaxed">{browseDescription ?? item.category}</div>
                            <div className="flex flex-wrap items-center justify-start gap-1.5 md:justify-end">
                              <span className="border border-white/10 bg-black/20 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#aaa]">
                                {item.category}
                              </span>
                              {owned ? (
                                <span className="flex items-center gap-1 border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-emerald-300">
                                  <PackageCheck className="h-3 w-3" />
                                  x{owned.quantity}
                                </span>
                              ) : (
                                <span className="flex items-center border border-white/5 bg-black/20 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#555]" title="Not owned">
                                  <PackageX className="h-3 w-3" />
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

        {mobileInfoOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileInfoOpen(false)}
          />
        )}

        <div
          className={`fixed inset-x-0 bottom-0 z-40 max-h-[85vh] overflow-y-auto transition-transform duration-300 lg:static lg:inset-auto lg:z-auto lg:max-h-none lg:overflow-y-auto lg:transition-none ${
            mobileInfoOpen ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'
          } flex flex-col gap-4 border-t-4 border-[#222] bg-[#141414] p-4 md:p-5 lg:border-l-4 lg:border-t-0`}
        >
          <div className="flex items-center justify-between lg:hidden mb-2">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#666]">Item details</div>
            <button
              onClick={() => setMobileInfoOpen(false)}
              className="p-1.5 text-[#888] hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
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
                {selected.previewMode === 'skin-head' ? (
                  <div className="h-28 w-28 shrink-0 overflow-hidden border border-white/10 bg-black">
                    <SkinHeadThumb
                      frames={selected.frames}
                      ticks={selected.ticks}
                      play
                      background={false}
                      yawDeg={PREVIEW_YAW}
                      pitchDeg={PREVIEW_PITCH}
                      rotationDeg={PREVIEW_ROTATION}
                      className="h-full w-full"
                    />
                  </div>
                ) : (
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
                )}
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
