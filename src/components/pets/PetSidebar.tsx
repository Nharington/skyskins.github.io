import { Search, X, ChevronRight } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import type { RegistryEntry } from '../../lib/cosmetics';
import { parseMinecraftLore } from '../../utils/minecraftText';
import { rarityHex } from '../../utils/skinRarity';

interface PetSidebarProps {
  isOpen: boolean;
  registry: Record<string, RegistryEntry>;
  filteredPets: [string, RegistryEntry][];
  categories: string[];
  selectedPetId: string | null;
  searchQuery: string;
  activeFilter: string | null;
  showAnimatedOnly: boolean;
  onSelectPet: (id: string) => void;
  onSearchChange: (q: string) => void;
  onFilterChange: (cat: string | null) => void;
  onAnimatedOnlyChange: (val: boolean) => void;
  onRarityClick: (petId: string, rarityName: string) => void;
  onToggleSidebar: () => void;
}

const RARITY_ENTRIES = [
  { key: 'Common',    label: 'C' },
  { key: 'Uncommon',  label: 'U' },
  { key: 'Rare',      label: 'R' },
  { key: 'Epic',      label: 'E' },
  { key: 'Legendary', label: 'L' },
  { key: 'Mythic',    label: 'M' },
  { key: 'Divine',    label: 'D' },
] as const;

type RarityKey = (typeof RARITY_ENTRIES)[number]['key'];

function rarityColor(key: RarityKey): string {
  return rarityHex(key.toUpperCase() as Parameters<typeof rarityHex>[0]);
}

interface RarityBadgesProps {
  rarities: { name: string }[];
  onClick: (name: string) => void;
}

function RarityBadges({ rarities, onClick }: RarityBadgesProps) {
  const names = new Set(rarities.map((r) => r.name));
  const visible = RARITY_ENTRIES.filter((r) => names.has(r.key));
  if (visible.length === 0) return null;

  return (
    <div className="flex items-center gap-0.5 mt-0.5">
      {visible.map((b, idx) => (
        <Tooltip key={b.key}>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              <span
                className="mc-font text-[10px] font-bold leading-none cursor-pointer opacity-60 hover:opacity-100 hover:scale-125 transition-all"
                style={{ color: rarityColor(b.key), textShadow: '1px 1px 0 rgba(0,0,0,0.8)' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onClick(b.key);
                }}
              >
                {b.label}
              </span>
              {idx < visible.length - 1 && (
                <span className="text-[10px] text-[#444] mx-0.5 font-bold">,</span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-[#111] border-[#333] px-2 py-1 rounded-none shadow-2xl">
            <span className="mc-font text-xs" style={{ color: rarityColor(b.key) }}>{b.key}</span>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

export function PetSidebar({
  isOpen,
  registry,
  filteredPets,
  categories,
  selectedPetId,
  searchQuery,
  activeFilter,
  showAnimatedOnly,
  onSelectPet,
  onSearchChange,
  onFilterChange,
  onAnimatedOnlyChange,
  onRarityClick,
  onToggleSidebar,
}: PetSidebarProps) {
  return (
    /**
     * Outer wrapper: fixed-width 320px on desktop that collapses via negative margin.
     * `overflow-visible` so the toggle tab can protrude beyond the edge.
     */
    <div
      className={`
        relative shrink-0 h-full overflow-visible z-30
        transition-all duration-300 ease-in-out
        ${isOpen ? 'w-80' : 'w-0'}
      `}
    >
      <div
        className={`
          absolute inset-y-0 left-0 w-80 bg-[#2b2b2b] border-r-4 border-[#1f1f1f]
          flex flex-col shadow-2xl h-full overflow-hidden
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="shrink-0 p-4 border-b-4 border-[#1f1f1f] bg-[#222] flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm uppercase tracking-widest text-[#aaa] font-black">Pets</h2>
            <span className="text-xs text-[#555] font-bold">
              {filteredPets.length} / {Object.keys(registry).length}
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#777]" />
            <input
              type="text"
              placeholder="Search pets…"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-[#111] border-2 border-[#1a1a1a] focus:border-emerald-500 outline-none pl-9 pr-8 py-2 text-sm font-bold placeholder:text-[#555] transition-colors"
              autoComplete="off"
              spellCheck={false}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#777] hover:text-[#aaa] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category filter */}
          <div className="relative">
            <select
              value={activeFilter ?? ''}
              onChange={(e) => onFilterChange(e.target.value || null)}
              className="w-full appearance-none bg-[#111] border-2 border-[#1a1a1a] focus:border-emerald-500 outline-none px-3 py-2 pr-8 text-sm font-bold text-[#aaa] cursor-pointer transition-colors"
              style={{ colorScheme: 'dark' }}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[#777]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Animated only toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none group">
            <div className={`w-4 h-4 border-2 flex items-center justify-center transition-colors ${
              showAnimatedOnly ? 'bg-emerald-500 border-emerald-500' : 'bg-[#111] border-[#333] group-hover:border-[#555]'
            }`}>
              {showAnimatedOnly && <div className="w-2 h-2 bg-white" />}
            </div>
            <input
              type="checkbox"
              checked={showAnimatedOnly}
              onChange={(e) => onAnimatedOnlyChange(e.target.checked)}
              className="sr-only"
            />
            <span className="text-xs font-bold text-[#aaa] group-hover:text-emerald-400 transition-colors uppercase tracking-widest">
              Animated Only
            </span>
          </label>
        </div>

        <div className="flex-1 min-h-0 bg-[#1a1a1a]">
          <TooltipProvider delayDuration={100}>
            <ScrollArea className="h-full">
              {filteredPets.length === 0 ? (
                <p className="p-6 text-center text-[#555] text-sm font-bold uppercase">No pets found.</p>
              ) : (
                <div className="p-2 flex flex-col gap-1">
                  {filteredPets.map(([id, pet]) => {
                    const isSelected = selectedPetId === id;
                    return (
                      <button
                        key={id}
                        onClick={() => onSelectPet(id)}
                        className={`p-3 text-left w-full transition-all duration-150 border-2 flex flex-col gap-2 group ${
                          isSelected
                            ? 'bg-[#333] border-white shadow-[inset_0_0_0_2px_#444]'
                            : 'bg-[#262626] border-[#1a1a1a] hover:bg-[#2d2d2d] hover:border-[#444]'
                        }`}
                      >
                        <div className="w-full flex justify-between items-start gap-2">
                          <div className="mc-font font-bold text-xl truncate drop-shadow-md flex-1">
                            {parseMinecraftLore(pet.name)}
                          </div>
                          {pet.variantsCount > 0 && (
                            <div className={`px-1.5 py-0.5 bg-[#141414] border border-[#111] text-[10px] font-bold rounded-sm shrink-0 transition-colors ${
                              isSelected ? 'text-emerald-400 border-emerald-500/30' : 'text-[#555]'
                            }`}>
                              {pet.variantsCount} Skins
                            </div>
                          )}
                        </div>

                        <div className="w-full flex items-center justify-between border-t border-white/5 pt-1.5">
                          <span className="text-[10px] text-[#888] font-bold uppercase tracking-[0.15em]">
                            {pet.category}
                          </span>
                          <RarityBadges rarities={pet.rarities} onClick={(name) => onRarityClick(id, name)} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TooltipProvider>
        </div>
      </div>

      <button
        onClick={onToggleSidebar}
        className={`
          absolute top-4 z-40 bg-[#2b2b2b] border-y-4 border-r-4 border-[#1f1f1f] p-2 rounded-r-lg
          shadow-[4px_0_12px_rgba(0,0,0,0.6)] hover:bg-[#3a3a3a] active:scale-95 transition-all group
          ${isOpen ? 'left-full' : 'left-0'}
        `}
        aria-label={isOpen ? 'Hide pet sidebar' : 'Show pet sidebar'}
        title={isOpen ? 'Hide sidebar' : 'Show sidebar'}
      >
        <ChevronRight className={`w-4 h-4 text-slate-300 group-hover:text-white transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
}
