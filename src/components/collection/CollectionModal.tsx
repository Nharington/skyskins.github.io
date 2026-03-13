import { useEffect, useMemo, useState } from 'react';
import { Calendar, Coins, Filter, Grid3X3, PackageCheck, PackagePlus, Search, X } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { useAppStore, type CosmeticRarity, type OwnedSkinEntry, type PetRecord } from '../../store/useAppStore';
import { cosmeticRarityRank, parseCosmeticRarityFromLore, stripMinecraftFormatting } from '../../utils/skinRarity';
import { SkinHeadThumb } from './SkinHeadThumb';

function assetUrl(path: string) {
  const base = import.meta.env.BASE_URL || '';
  return `${base}${path.replace(/^\//, '')}`;
}

type SortModeAll = 'pet' | 'skin' | 'rarity';
type SortModeOwned = 'date' | 'qty' | 'skin' | 'pet';

type SkinIndexItem = {
  petId: string;
  petName: string;
  petNamePlain: string;
  skinId: string;
  skinName: string;
  skinNamePlain: string;
  rarity: CosmeticRarity;
  rarityRank: number;
  texturePath: string;
  lore?: string;
  animated?: boolean;
};

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewIn3D: (petId: string, skinId: string) => void;
}

export function CollectionModal({ isOpen, onClose, onViewIn3D }: CollectionModalProps) {
  const { registry, ownedSkins, upsertOwnedSkin, updateOwnedSkin, removeOwnedSkin } = useAppStore();

  const petIds = useMemo(() => Object.keys(registry), [registry]);

  const [loading, setLoading] = useState(false);
  const [loadDone, setLoadDone] = useState(0);
  const [allSkins, setAllSkins] = useState<SkinIndexItem[]>([]);

  const [query, setQuery] = useState('');
  const [ownedOnly, setOwnedOnly] = useState(false);
  const [sortAll, setSortAll] = useState<SortModeAll>('pet');
  const [sortOwned, setSortOwned] = useState<SortModeOwned>('date');

  const [selectedSkinId, setSelectedSkinId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setLoadDone(0);
      setAllSkins([]);
      setSelectedSkinId(null);

      const items: SkinIndexItem[] = [];
      const ids = petIds;

      await Promise.all(
        ids.map(async (petId) => {
          try {
            const res = await fetch(assetUrl(`/assets/pet_data/${petId}.json`));
            if (!res.ok) return;
            const data = (await res.json()) as PetRecord;
            for (const v of data.variants ?? []) {
              const petNamePlain = stripMinecraftFormatting(data.name ?? registry[petId]?.name ?? petId);
              const skinNamePlain = stripMinecraftFormatting(v.name ?? v.id);
              const rarity = parseCosmeticRarityFromLore(v.lore);
              items.push({
                petId,
                petName: data.name ?? registry[petId]?.name ?? petId,
                petNamePlain,
                skinId: v.id,
                skinName: v.name ?? v.id,
                skinNamePlain,
                rarity,
                rarityRank: cosmeticRarityRank(rarity),
                texturePath: v.texturePath,
                lore: v.lore,
                animated: v.animated,
              });
            }
          } finally {
            if (!cancelled) setLoadDone((d) => d + 1);
          }
        }),
      );

      if (cancelled) return;
      items.sort((a, b) => a.petNamePlain.localeCompare(b.petNamePlain) || a.skinNamePlain.localeCompare(b.skinNamePlain));
      setAllSkins(items);
      setLoading(false);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [isOpen, petIds.join('|')]);

  const filteredSkins = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = allSkins;

    if (ownedOnly) {
      list = list.filter((s) => (ownedSkins[`${s.petId}::${s.skinId}`]?.quantity ?? 0) > 0);
    }

    if (!q) return list;
    return list.filter((s) => s.petNamePlain.toLowerCase().includes(q) || s.skinNamePlain.toLowerCase().includes(q));
  }, [allSkins, ownedOnly, ownedSkins, query]);

  const sortedSkins = useMemo(() => {
    const list = [...filteredSkins];
    if (!ownedOnly) {
      switch (sortAll) {
        case 'pet':
          list.sort((a, b) => a.petNamePlain.localeCompare(b.petNamePlain) || a.skinNamePlain.localeCompare(b.skinNamePlain));
          break;
        case 'skin':
          list.sort((a, b) => a.skinNamePlain.localeCompare(b.skinNamePlain) || a.petNamePlain.localeCompare(b.petNamePlain));
          break;
        case 'rarity':
          list.sort((a, b) => b.rarityRank - a.rarityRank || a.petNamePlain.localeCompare(b.petNamePlain) || a.skinNamePlain.localeCompare(b.skinNamePlain));
          break;
      }
      return list;
    }

    switch (sortOwned) {
      case 'date':
        list.sort((a, b) => {
          const ad = ownedSkins[`${a.petId}::${a.skinId}`]?.acquiredDate;
          const bd = ownedSkins[`${b.petId}::${b.skinId}`]?.acquiredDate;
          const at = ad ? Date.parse(ad) : -1;
          const bt = bd ? Date.parse(bd) : -1;
          return bt - at || a.petNamePlain.localeCompare(b.petNamePlain) || a.skinNamePlain.localeCompare(b.skinNamePlain);
        });
        break;
      case 'qty':
        list.sort(
          (a, b) =>
            (ownedSkins[`${b.petId}::${b.skinId}`]?.quantity ?? 0) - (ownedSkins[`${a.petId}::${a.skinId}`]?.quantity ?? 0) ||
            a.petNamePlain.localeCompare(b.petNamePlain),
        );
        break;
      case 'skin':
        list.sort((a, b) => a.skinNamePlain.localeCompare(b.skinNamePlain) || a.petNamePlain.localeCompare(b.petNamePlain));
        break;
      case 'pet':
        list.sort((a, b) => a.petNamePlain.localeCompare(b.petNamePlain) || a.skinNamePlain.localeCompare(b.skinNamePlain));
        break;
    }
    return list;
  }, [filteredSkins, ownedOnly, ownedSkins, sortAll, sortOwned]);

  const selected = useMemo(() => {
    if (!selectedSkinId) return null;
    return allSkins.find((s) => s.skinId === selectedSkinId) ?? null;
  }, [allSkins, selectedSkinId]);

  const selectedOwned = selected ? ownedSkins[`${selected.petId}::${selected.skinId}`] : undefined;

  const [formQty, setFormQty] = useState(1);
  const [formDate, setFormDate] = useState<string>('');
  const [formPrice, setFormPrice] = useState<string>('');

  useEffect(() => {
    if (!selected) return;
    const owned = ownedSkins[`${selected.petId}::${selected.skinId}`];
    setFormQty(owned?.quantity ?? 1);
    setFormDate(owned?.acquiredDate ?? '');
    setFormPrice(owned?.pricePaid != null ? String(owned.pricePaid) : '');
  }, [selected?.skinId, ownedSkins]);

  const handleSaveOwned = () => {
    if (!selected) return;
    const qty = Math.max(0, Math.floor(Number.isFinite(formQty) ? formQty : 0));
    if (qty <= 0) {
      removeOwnedSkin(`${selected.petId}::${selected.skinId}`);
      return;
    }

    const priceNum = formPrice.trim() === '' ? undefined : Number(formPrice);
    const pricePaid = priceNum != null && Number.isFinite(priceNum) ? priceNum : undefined;
    const acquiredDate = formDate.trim() === '' ? undefined : formDate;
    const key = `${selected.petId}::${selected.skinId}`;

    const base: Omit<OwnedSkinEntry, 'updatedAt'> = {
      key,
      skinId: selected.skinId,
      petId: selected.petId,
      petName: selected.petName,
      skinName: selected.skinName,
      rarity: selected.rarity,
      quantity: qty,
      acquiredDate,
      pricePaid,
    };

    if (ownedSkins[key]) {
      updateOwnedSkin(key, base);
    } else {
      upsertOwnedSkin(base);
    }
  };

  const headerCount = ownedOnly ? sortedSkins.length : allSkins.length;
  const ownedCount = Object.keys(ownedSkins).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1e1e1e] border-4 border-[#333] w-full max-w-7xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b-4 border-[#333] bg-[#252525] gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Grid3X3 className="w-5 h-5 text-emerald-400 shrink-0" />
            <h2 className="text-sm sm:text-lg font-black tracking-widest text-white uppercase truncate">
              Collection
            </h2>
            <div className="hidden sm:flex items-center gap-2 ml-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#777]">
              <span className="px-2 py-1 bg-black/30 border border-white/10">
                {loading ? `${loadDone}/${petIds.length} loading` : `${headerCount} skins`}
              </span>
              <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                {ownedCount} owned
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#333] border-2 border-transparent hover:border-[#444] rounded transition-all text-[#aaa] hover:text-white"
            aria-label="Close collection"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-white/10 bg-[#1a1a1a] flex flex-col gap-3">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#777777]" />
              <input
                type="text"
                placeholder="Search by pet or skin name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-[#111111] border-2 border-[#1a1a1a] focus:border-emerald-500 outline-none pl-10 pr-3 py-2 text-sm font-bold placeholder:text-[#555555] rounded-none transition-colors"
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none group px-3 py-2 bg-[#111111] border-2 border-[#1a1a1a] hover:border-[#333333] transition-colors">
              <Filter className="w-4 h-4 text-[#888888] group-hover:text-emerald-400" />
              <div className={`w-4 h-4 border-2 transition-colors flex items-center justify-center ${
                ownedOnly ? 'bg-emerald-500 border-emerald-500' : 'bg-[#0b0b0b] border-[#333333] group-hover:border-[#555555]'
              }`}>
                {ownedOnly && <div className="w-2 h-2 bg-white" />}
              </div>
              <input
                type="checkbox"
                checked={ownedOnly}
                onChange={(e) => setOwnedOnly(e.target.checked)}
                className="hidden"
              />
              <span className="text-xs font-bold text-[#aaaaaa] group-hover:text-emerald-400 transition-colors uppercase tracking-widest whitespace-nowrap">
                Owned only
              </span>
            </label>

            {!ownedOnly ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-[#111111] border-2 border-[#1a1a1a]">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#666] whitespace-nowrap">
                  Sort
                </span>
                <select
                  value={sortAll}
                  onChange={(e) => setSortAll(e.target.value as SortModeAll)}
                  className="bg-[#0b0b0b] border border-[#222] px-2 py-1 text-xs font-bold text-[#ddd] outline-none focus:border-emerald-500"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="pet">Pet name</option>
                  <option value="skin">Skin name</option>
                  <option value="rarity">Skin rarity</option>
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 bg-[#111111] border-2 border-[#1a1a1a]">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#666] whitespace-nowrap">
                  Sort
                </span>
                <select
                  value={sortOwned}
                  onChange={(e) => setSortOwned(e.target.value as SortModeOwned)}
                  className="bg-[#0b0b0b] border border-[#222] px-2 py-1 text-xs font-bold text-[#ddd] outline-none focus:border-emerald-500"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="date">Date acquired</option>
                  <option value="qty">Quantity</option>
                  <option value="skin">Item name</option>
                  <option value="pet">Pet name</option>
                </select>
              </div>
            )}
          </div>

          {loading && (
            <div className="w-full bg-black/30 border border-white/10 p-3">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#777]">
                Indexing skins… {loadDone}/{petIds.length}
              </div>
              <div className="mt-2 h-2 bg-[#0b0b0b] border border-[#222]">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: petIds.length ? `${Math.min(100, Math.round((loadDone / petIds.length) * 100))}%` : '0%' }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_360px] overflow-hidden">
          <ScrollArea className="h-full">
            {sortedSkins.length === 0 ? (
              <div className="p-8 text-center text-[#666] font-bold uppercase tracking-widest">
                No skins found.
              </div>
            ) : (
              <div className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                  {sortedSkins.map((s) => {
                    const isSelected = selectedSkinId === s.skinId;
                    const owned = ownedSkins[`${s.petId}::${s.skinId}`];
                    return (
                      <button
                        key={s.skinId}
                        onClick={() => setSelectedSkinId(s.skinId)}
                        className={`text-left border-2 transition-all duration-150 p-3 bg-[#111111] hover:bg-[#151515] focus:outline-none ${
                          isSelected ? 'border-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.25)]' : 'border-[#222222] hover:border-[#333333]'
                        }`}
                      >
                        <div className="aspect-square w-full bg-black/30 border border-white/10 p-2 flex items-center justify-center overflow-hidden">
                          <SkinHeadThumb frames={[assetUrl(s.texturePath)]} background={false} yawDeg={26.8} pitchDeg={10.6} className="w-full h-full" />
                        </div>

                        <div className="mt-2 flex flex-col gap-1">
                          <div className="text-xs font-black text-white leading-snug line-clamp-2">
                            {s.skinNamePlain}
                          </div>
                          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#777] truncate">
                            {s.petNamePlain}
                          </div>

                          <div className="flex items-center justify-between gap-2 mt-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#aaa] bg-black/30 border border-white/10 px-2 py-1">
                              {s.rarity === 'UNKNOWN' ? '—' : s.rarity}
                            </span>
                            {owned ? (
                              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1">
                                x{owned.quantity}
                              </span>
                            ) : (
                              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#666] bg-black/20 border border-white/5 px-2 py-1">
                                not owned
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </ScrollArea>

          <div className="border-l-4 border-[#222] bg-[#141414] p-4 flex flex-col gap-3 overflow-hidden">
            {!selected ? (
              <div className="flex-1 flex items-center justify-center text-center p-6">
                <div className="max-w-xs">
                  <div className="text-sm font-black uppercase tracking-widest text-[#aaa]">
                    Select a skin
                  </div>
                  <div className="mt-2 text-xs text-[#666] leading-relaxed">
                    Pick any skin card to view details and add it to your owned collection (quantity, acquired date, price).
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="border-2 border-[#222] bg-[#0f0f0f] p-3 flex gap-3">
                  <div className="w-16 h-16 bg-black/30 border border-white/10 p-2 shrink-0 flex items-center justify-center">
                    <SkinHeadThumb
                      frames={[assetUrl(selected.texturePath)]}
                      background={false}
                      yawDeg={26.8}
                      pitchDeg={10.6}
                      className="w-full h-full"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-black text-white leading-snug truncate">
                      {selected.skinNamePlain}
                    </div>
                    <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#777] truncate">
                      {selected.petNamePlain}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#aaa] bg-black/30 border border-white/10 px-2 py-1">
                        {selected.rarity === 'UNKNOWN' ? 'Rarity —' : selected.rarity}
                      </span>
                      {selected.animated && (
                        <span className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-1">
                          Animated
                        </span>
                      )}
                      {selectedOwned && (
                        <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1">
                          Owned x{selectedOwned.quantity}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-2 border-[#222] bg-[#111111] p-3 flex flex-col gap-3">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#777]">
                    Owned details
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#666]">Quantity</span>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={formQty}
                        onChange={(e) => setFormQty(Number(e.target.value))}
                        className="w-full bg-[#0b0b0b] border-2 border-[#1a1a1a] focus:border-emerald-500 outline-none px-3 py-2 text-sm font-bold text-white"
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#666] flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#666]" />
                        Acquired date
                      </span>
                      <input
                        type="date"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="w-full bg-[#0b0b0b] border-2 border-[#1a1a1a] focus:border-emerald-500 outline-none px-3 py-2 text-sm font-bold text-white"
                        style={{ colorScheme: 'dark' }}
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#666] flex items-center gap-2">
                        <Coins className="w-3.5 h-3.5 text-[#666]" />
                        Price paid
                      </span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        inputMode="decimal"
                        placeholder="Optional"
                        value={formPrice}
                        onChange={(e) => setFormPrice(e.target.value)}
                        className="w-full bg-[#0b0b0b] border-2 border-[#1a1a1a] focus:border-emerald-500 outline-none px-3 py-2 text-sm font-bold text-white placeholder:text-[#444]"
                      />
                    </label>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      onClick={handleSaveOwned}
                      className="w-full flex items-center justify-center gap-2 py-2 border-b-4 active:border-b-0 active:translate-y-[2px] transition-all font-black uppercase tracking-widest text-[10px] bg-emerald-500 hover:bg-emerald-400 border-emerald-700 text-black"
                    >
                      {selectedOwned ? <PackageCheck className="w-4 h-4" /> : <PackagePlus className="w-4 h-4" />}
                      {selectedOwned ? 'Save owned changes' : 'Add to owned'}
                    </button>

                    {selectedOwned && (
                      <button
                        onClick={() => removeOwnedSkin(`${selected.petId}::${selected.skinId}`)}
                        className="w-full py-2 border-2 border-[#333] hover:border-[#555] bg-[#1a1a1a] hover:bg-[#202020] transition-colors font-black uppercase tracking-widest text-[10px] text-[#ddd]"
                      >
                        Remove from owned
                      </button>
                    )}

                    <button
                      onClick={() => onViewIn3D(selected.petId, selected.skinId)}
                      className="w-full py-2 border-2 border-[#224444] hover:border-emerald-500 bg-[#102020] hover:bg-[#143030] transition-colors font-black uppercase tracking-widest text-[10px] text-emerald-200"
                    >
                      View in 3D
                    </button>
                  </div>
                </div>

                {selected.lore && (
                  <ScrollArea className="flex-1 border-2 border-[#222] bg-[#0f0f0f]">
                    <div className="p-3 text-xs text-[#aaa] leading-relaxed whitespace-pre-wrap">
                      {stripMinecraftFormatting(selected.lore)}
                    </div>
                  </ScrollArea>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

