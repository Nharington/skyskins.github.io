import { Layers, X, Sparkles, SunMoon } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { parseMinecraftLore } from '../../utils/minecraftText';
import type { PetVariant } from '../../store/useAppStore';

interface SkinsPanelProps {
  variants: PetVariant[];
  selectedVariantId: string | null;
  onSelectVariant: (id: string | null) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function SkinsPanel({ variants, selectedVariantId, onSelectVariant, isOpen, onClose }: SkinsPanelProps) {
  if (variants.length === 0) return null;

  return (
    <div className={`
      absolute right-4 md:right-6 top-16 md:top-6 w-[calc(100vw-2rem)] sm:w-64 md:w-72 
      border-4 border-[#333333] bg-[#222222]/95 backdrop-blur-sm shadow-2xl z-20 
      flex flex-col max-h-[60vh] md:max-h-[70vh] transition-all duration-300
      ${isOpen ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-[120%] md:translate-x-0 opacity-0 md:opacity-100 scale-95 md:scale-100 pointer-events-none md:pointer-events-auto'}
    `}>
      {/* Panel header */}
      <div className="p-3 border-b-4 border-[#1a1a1a] bg-[#1a1a1a] flex items-center gap-2">
        <Layers className="w-4 h-4 text-emerald-400" />
        <span className="font-bold text-xs uppercase text-[#aaaaaa] tracking-wider">
          Skins
        </span>
        <span className="ml-auto mc-font text-sm font-bold text-[#555555]">{variants.length}</span>
        
        {onClose && (
          <button 
            onClick={onClose}
            className="md:hidden ml-2 p-1 hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 flex flex-col gap-1">
          {/* Default button */}
          <button
            onClick={() => onSelectVariant(null)}
            className={`p-2 text-left w-full transition-all duration-150 border-2 flex items-center justify-between ${
              selectedVariantId === null
                ? 'bg-[#3b3b3b] border-slate-400 shadow-[inset_0_0_0_2px_#555555]'
                : 'bg-[#2b2b2b] border-[#1a1a1a] hover:bg-[#333333] hover:border-[#555555]'
            }`}
          >
            <span className="mc-font text-sm mc-shadow text-slate-300">Default</span>
            {selectedVariantId === null && (
              <div className="w-2 h-2 bg-slate-300 shrink-0 shadow-[0_0_8px_#cbd5e1]" />
            )}
          </button>

          {/* Skin variants */}
          {variants.map((variant) => (
            <Tooltip key={variant.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onSelectVariant(variant.id)}
                  className={`p-2 text-left w-full transition-all duration-150 border-2 flex items-center justify-between ${
                    selectedVariantId === variant.id
                      ? 'bg-[#3b3b3b] border-emerald-500 shadow-[inset_0_0_0_2px_#555555]'
                      : 'bg-[#2b2b2b] border-[#1a1a1a] hover:bg-[#333333] hover:border-[#555555]'
                  }`}
                >
                  <span className="mc-font text-sm mc-shadow pr-2 leading-relaxed flex items-center gap-1.5">
                    {variant.animation && 'day' in variant.animation && (
                      <SunMoon className="w-4 h-4 text-emerald-300 inline-block drop-shadow-md" />
                    )}
                    {(!variant.animation || !('day' in variant.animation)) && variant.animated && (
                      <Sparkles className="w-3.5 h-3.5 text-yellow-400 inline-block drop-shadow-md animate-pulse" />
                    )}
                    {parseMinecraftLore(variant.name || variant.id)}
                  </span>
                  {selectedVariantId === variant.id && (
                    <div className="w-2 h-2 bg-emerald-400 shrink-0 shadow-[0_0_8px_#34d399]" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="left"
                className="mctooltip border-image-slice-1 border-radius-none p-4 shadow-2xl max-w-sm rounded-none"
              >
                <div className="mc-font whitespace-pre-wrap overflow-visible">
                  {variant.lore ? parseMinecraftLore(variant.lore) : 'No skin description available.'}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
