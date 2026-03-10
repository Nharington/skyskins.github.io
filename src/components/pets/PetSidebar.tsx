import { Search, X } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { parseMinecraftLore } from '../../utils/minecraftText';
import type { RegistryEntry } from '../../store/useAppStore';
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
}

const RARITY_MAP: { key: string; label: string; color: string }[] = [
  { key: 'Common',    label: 'C', color: '#aaaaaa' },
  { key: 'Uncommon',  label: 'U', color: '#55ff55' },
  { key: 'Rare',      label: 'R', color: '#5555ff' },
  { key: 'Epic',      label: 'E', color: '#aa00aa' },
  { key: 'Legendary', label: 'L', color: '#ffaa00' },
  { key: 'Mythic',    label: 'M', color: '#ff55ff' },
  { key: 'Divine',    label: 'D', color: '#55ffff' },
];

function RarityBadges({ rarities, onClick }: { rarities: { name: string }[], onClick: (name: string) => void }) {
  const names = new Set(rarities.map((r) => r.name));
  const badges = RARITY_MAP.filter((r) => names.has(r.key));
  if (badges.length === 0) return null;

  return (
    <div className="flex items-center gap-0.5 mt-0.5">
      {badges.map((b, idx) => (
        <Tooltip key={b.key}>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              <span
                className="mc-font text-[10px] font-bold leading-none cursor-pointer opacity-60 hover:opacity-100 hover:scale-125 transition-all"
                style={{ color: b.color, textShadow: '1px 1px 0 rgba(0,0,0,0.8)' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onClick(b.key);
                }}
              >
                {b.label}
              </span>
              {idx < badges.length - 1 && (
                <span className="text-[10px] text-[#444444] mx-0.5 font-bold">,</span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-[#111111] border-[#333333] px-2 py-1 rounded-none shadow-2xl">
             <span className="mc-font text-xs" style={{ color: b.color }}>{b.key}</span>
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
}: PetSidebarProps) {
  return (
    <div
      className={`
        absolute md:relative w-80 bg-[#2b2b2b] border-r-4 border-[#1f1f1f] flex flex-col z-30 shadow-2xl shrink-0 h-full
        transition-transform duration-300 ease-in-out md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      <div className="p-4 border-b-4 border-[#1f1f1f] bg-[#222222] flex flex-col gap-3">
        <div className="flex justify-between items-end">
          <h2 className="text-sm uppercase tracking-widest text-[#aaaaaa] font-bold">Pets Collection</h2>
          <div className="text-xs text-[#555555] font-bold">
            {filteredPets.length} / {Object.keys(registry).length}
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#777777]" />
          <input
            type="text"
            placeholder="Search pets..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#111111] border-2 border-[#1a1a1a] focus:border-emerald-500 outline-none px-9 py-2 text-sm font-bold placeholder:text-[#555555] rounded-none transition-colors"
            autoComplete="off"
            spellCheck={false}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2.5 text-[#777777] hover:text-[#aaaaaa] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="relative">
          <select
            value={activeFilter ?? ''}
            onChange={(e) => onFilterChange(e.target.value || null)}
            className="w-full appearance-none bg-[#111111] border-2 border-[#1a1a1a] focus:border-emerald-500 outline-none px-3 py-2 text-sm font-bold text-[#aaaaaa] rounded-none transition-colors cursor-pointer pr-8"
            style={{ colorScheme: 'dark' }}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[#777777]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer mt-1 select-none group">
          <div className={`w-4 h-4 border-2 transition-colors flex items-center justify-center ${
            showAnimatedOnly ? 'bg-emerald-500 border-emerald-500' : 'bg-[#111111] border-[#333333] group-hover:border-[#555555]'
          }`}>
            {showAnimatedOnly && <div className="w-2 h-2 bg-white" />}
          </div>
          <input
            type="checkbox"
            checked={showAnimatedOnly}
            onChange={(e) => onAnimatedOnlyChange(e.target.checked)}
            className="hidden"
          />
          <span className="text-xs font-bold text-[#aaaaaa] group-hover:text-emerald-400 transition-colors uppercase tracking-widest">Animated Skins Only</span>
        </label>
      </div>

      <TooltipProvider delayDuration={100}>
        <ScrollArea className="flex-1 w-full bg-[#1a1a1a]">
          {filteredPets.length === 0 ? (
            <div className="p-6 text-center text-[#555555] text-sm font-bold uppercase">No pets found.</div>
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
                        ? 'bg-[#333333] border-white shadow-[inset_0_0_0_2px_#444444]'
                        : 'bg-[#262626] border-[#1a1a1a] hover:bg-[#2d2d2d] hover:border-[#444444]'
                    }`}
                  >
                    <div className="w-full flex justify-between items-start gap-2">
                      <div className="mc-font font-bold text-xl truncate drop-shadow-md flex-1">
                        {parseMinecraftLore(pet.name)}
                      </div>
                      {pet.variantsCount > 0 && (
                        <div
                          className={`px-1.5 py-0.5 bg-[#141414] border border-[#111111] shadow-inner text-[10px] font-bold rounded-sm shrink-0 transition-colors ${
                            isSelected ? 'text-emerald-400 border-emerald-500/30' : 'text-[#555555]'
                          }`}
                        >
                          {pet.variantsCount} Skins
                        </div>
                      )}
                    </div>

                    <div className="w-full flex items-center justify-between border-t border-white/5 pt-1.5">
                      <div className="text-[10px] text-[#888888] font-bold uppercase tracking-[0.15em] shrink-0">
                        {pet.category}
                      </div>
                      <div className="flex-1" />
                      <RarityBadges rarities={pet.rarities} onClick={(rarityName) => onRarityClick(id, rarityName)} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </TooltipProvider>
    </div>
  );
}
