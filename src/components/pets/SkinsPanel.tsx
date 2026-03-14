import { Layers, X, Sparkles, SunMoon } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import type { PetVariant } from '../../lib/cosmetics';
import { parseMinecraftLore } from '../../utils/minecraftText';

interface SkinsPanelProps {
  variants: PetVariant[];
  selectedVariantId: string | null;
  onSelectVariant: (id: string | null) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function SkinsPanel({ variants, selectedVariantId, onSelectVariant, isOpen, onToggle }: SkinsPanelProps) {
  if (variants.length === 0) return null;

  return (
    <div
      className={`
        relative shrink-0 h-full overflow-visible z-20
        transition-all duration-300 ease-in-out
        ${isOpen ? 'w-72' : 'w-0'}
      `}
    >
      <div
        className={`
          absolute inset-y-0 right-0 w-72
          bg-[#222222]/95 backdrop-blur-sm border-l-4 border-[#333]
          flex flex-col shadow-2xl h-full overflow-hidden
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="shrink-0 p-3 border-b-4 border-[#1a1a1a] bg-[#1a1a1a] flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-bold text-xs uppercase text-[#aaa] tracking-wider">Skins</span>
          <span className="ml-auto mc-font text-sm font-bold text-[#555]">{variants.length}</span>
          <button
            onClick={onToggle}
            className="ml-1 p-1 hover:bg-white/10 rounded transition-colors"
            aria-label="Close skins panel"
          >
            <X className="w-4 h-4 text-slate-400 hover:text-white transition-colors" />
          </button>
        </div>

        {/* Skin list */}
        <div className="flex-1 min-h-0">
          <TooltipProvider delayDuration={200}>
            <ScrollArea className="h-full">
              <div className="p-2 flex flex-col gap-1">
                {/* Default option */}
                <button
                  onClick={() => onSelectVariant(null)}
                  className={`p-2 text-left w-full transition-all duration-150 border-2 flex items-center justify-between ${
                    selectedVariantId === null
                      ? 'bg-[#3b3b3b] border-slate-400 shadow-[inset_0_0_0_2px_#555]'
                      : 'bg-[#2b2b2b] border-[#1a1a1a] hover:bg-[#333] hover:border-[#555]'
                  }`}
                >
                  <span className="mc-font text-sm mc-shadow text-slate-300">Default</span>
                  {selectedVariantId === null && (
                    <div className="w-2 h-2 bg-slate-300 shrink-0 shadow-[0_0_8px_#cbd5e1]" />
                  )}
                </button>

                {variants.map((variant) => (
                  <Tooltip key={variant.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onSelectVariant(variant.id)}
                        className={`p-2 text-left w-full transition-all duration-150 border-2 flex items-center justify-between ${
                          selectedVariantId === variant.id
                            ? 'bg-[#3b3b3b] border-emerald-500 shadow-[inset_0_0_0_2px_#555]'
                            : 'bg-[#2b2b2b] border-[#1a1a1a] hover:bg-[#333] hover:border-[#555]'
                        }`}
                      >
                        <span className="mc-font text-sm mc-shadow pr-2 leading-relaxed flex items-center gap-1.5">
                          {variant.animation && 'day' in variant.animation && (
                            <SunMoon className="w-4 h-4 text-emerald-300 inline-block drop-shadow-md shrink-0" />
                          )}
                          {(!variant.animation || !('day' in variant.animation)) && variant.animated && (
                            <Sparkles className="w-3.5 h-3.5 text-yellow-400 inline-block drop-shadow-md animate-pulse shrink-0" />
                          )}
                          <span className="truncate">{parseMinecraftLore(variant.name || variant.id)}</span>
                        </span>
                        {selectedVariantId === variant.id && (
                          <div className="w-2 h-2 bg-emerald-400 shrink-0 shadow-[0_0_8px_#34d399]" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      align="end"
                      className="mctooltip p-3 shadow-2xl max-w-xs rounded-none"
                      avoidCollisions
                    >
                      <div className="mc-font whitespace-pre-wrap text-xs leading-relaxed">
                        {variant.lore ? parseMinecraftLore(variant.lore) : 'No skin description available.'}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </ScrollArea>
          </TooltipProvider>
        </div>
      </div>

      <button
        onClick={onToggle}
        className={`
          absolute top-4 z-30 bg-[#2b2b2b] border-y-4 border-l-4 border-[#333]
          rounded-l-lg shadow-[-4px_0_12px_rgba(0,0,0,0.6)]
          hover:bg-[#3a3a3a] active:scale-95 transition-all group
          flex flex-col items-center gap-0.5 px-1.5 py-2
          ${isOpen ? 'right-full' : 'right-0'}
        `}
        aria-label={isOpen ? 'Hide skins panel' : 'Show skins panel'}
        title={isOpen ? 'Hide skins' : 'Show skins'}
      >
        {/* Skin count badge */}
        <div className="relative flex items-center justify-center w-5 h-5">
          {!isOpen && (
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
          )}
          <span className="text-[10px] font-black text-emerald-400 leading-none relative z-10">
            {variants.length}
          </span>
        </div>
        {/* Small icon hint */}
        <Layers className="w-3 h-3 text-slate-400 group-hover:text-emerald-300 transition-colors" />
      </button>
    </div>
  );
}
