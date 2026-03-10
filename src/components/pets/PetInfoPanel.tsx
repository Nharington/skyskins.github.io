import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { parseMinecraftLore } from '../../utils/minecraftText';
import type { PetRecord } from '../../store/useAppStore';

interface PetInfoPanelProps {
  selectedPet: PetRecord;
  selectedVariantId: string | null;
  selectedRarityIdx: number;
  onRarityChange: (idx: number) => void;
}

const RARITY_COLOR_MAP: Record<string, string> = {
  'COMMON': '§f',
  'UNCOMMON': '§2',
  'RARE': '§9',
  'EPIC': '§5',
  'LEGENDARY': '§6',
  'MYTHIC': '§d',
  'DIVINE': '§b',
  'SUPREME': '§4',
  'SPECIAL': '§c',
  'VERY SPECIAL': '§c',
};

export function PetInfoPanel({
  selectedPet,
  selectedVariantId,
  selectedRarityIdx,
  onRarityChange,
}: PetInfoPanelProps) {
  const [isVisible, setIsVisible] = useState(typeof window !== 'undefined' ? window.innerWidth > 768 : true);

  const selectedRarity = selectedPet.rarities[selectedRarityIdx] || null;
  const activeVariant = selectedVariantId
    ? selectedPet.variants.find((v) => v.id === selectedVariantId) ?? null
    : null;

  useEffect(() => {
    setIsVisible(true);
  }, [selectedPet.type, selectedRarityIdx, selectedVariantId]);

 const rarityName = selectedRarity?.name?.toUpperCase() || 'COMMON';
  const colorPrefix = RARITY_COLOR_MAP[rarityName] || '§f';
  const cleanPetName = selectedPet.name.replace(/§[0-9a-fk-or]/g, '');

  const titleNode = activeVariant
    ? parseMinecraftLore(activeVariant.name)
    : selectedRarity
    ? parseMinecraftLore(`${colorPrefix}[Lvl 100] ${cleanPetName}`)
    : parseMinecraftLore(selectedPet.name);

  const loreContent = activeVariant
    ? activeVariant.lore
      ? parseMinecraftLore(activeVariant.lore)
      : ['Cosmetic Skin Applied.']
    : selectedRarity?.lore
    ? parseMinecraftLore(selectedRarity.lore)
    : parseMinecraftLore(selectedPet.description);

  return (
    <div className="absolute bottom-4 md:bottom-6 left-4 md:left-6 z-10 flex flex-col gap-3 pointer-events-auto max-w-[calc(100vw-2rem)] md:max-w-xl">
      {/* Visibility Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="self-start flex items-center gap-2 px-3 py-1.5 bg-[#111111]/80 backdrop-blur-md border-2 border-white/10 hover:bg-[#222222] transition-colors group shadow-lg"
      >
        {isVisible ? (
          <EyeOff className="w-4 h-4 text-[#aaaaaa] group-hover:text-white" />
        ) : (
          <Eye className="w-4 h-4 text-emerald-400" />
        )}
        <span className="mc-font text-xs text-[#aaaaaa] group-hover:text-white uppercase tracking-wider">
          {isVisible ? 'Hide Info' : 'Show Info'}
        </span>
      </button>

      {isVisible && (
        <>
          {/* Tooltip Container */}
          <div className="mctooltip border-image-slice-1 w-fit min-w-[320px] max-w-[480px] flex flex-col max-h-[70vh] !pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
            
            {/* Title row */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-2 gap-4 shrink-0">
              <div className="mc-font text-2xl truncate min-w-0 font-normal">
                {titleNode}
              </div>

              {/* Rarity cycler */}
              {!selectedVariantId && selectedPet.rarities.length > 1 && (
                <div className="flex items-center shrink-0 bg-[#333333]/40 border border-[#555555]/50 overflow-hidden">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRarityChange(
                        selectedRarityIdx > 0 ? selectedRarityIdx - 1 : selectedPet.rarities.length - 1,
                      );
                    }}
                    className="hover:bg-white/20 p-1 text-[#aaaaaa] transition-colors border-r border-[#555555]/30 group"
                    title="Previous Rarity"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 group-active:scale-90 transition-transform" />
                  </button>
                  <span className="mc-font text-[10px] uppercase px-2 min-w-[70px] text-center text-[#dddddd] py-0.5 !text-shadow-none">
                    {selectedRarity?.name || 'Rarity'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRarityChange(
                        selectedRarityIdx < selectedPet.rarities.length - 1 ? selectedRarityIdx + 1 : 0,
                      );
                    }}
                    className="hover:bg-white/20 p-1 text-[#aaaaaa] transition-colors border-l border-[#555555]/30 group"
                    title="Next Rarity"
                  >
                    <ChevronRight className="w-3.5 h-3.5 group-active:scale-90 transition-transform" />
                  </button>
                </div>
              )}
            </div>

            {/* Lore / Description */}
            <ScrollArea className="flex-1 w-full overflow-y-auto pr-1">
              <div className="mc-font leading-relaxed py-1 flex flex-col gap-1">
                {loreContent}
              </div>
            </ScrollArea>
          </div>

          {/* Wiki buttons */}
          {selectedPet.infoUrls?.length > 0 && (
            <div className="flex gap-2 w-fit animate-in fade-in slide-in-from-bottom-1 duration-400">
              {selectedPet.infoUrls.map((url, i) => {
                const isFandom = url.includes('fandom');
                const style = isFandom
                  ? 'bg-[#1e1332] border-[#3b205e] hover:bg-[#2c1a4b]'
                  : 'bg-[#1b2b2b] border-[#224444] hover:bg-[#244040]';
                return (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 border-2 ${style} mc-font text-sm text-white/90 shadow-lg transition-colors`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {isFandom ? 'Fandom' : 'Wiki'}
                  </a>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
