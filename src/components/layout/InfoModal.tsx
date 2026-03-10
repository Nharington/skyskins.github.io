import { X, Sparkles, SunMoon, Info } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InfoModal({ isOpen, onClose }: InfoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[#1e1e1e] border-4 border-[#333] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b-4 border-[#333] bg-[#252525]">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-black tracking-widest text-white uppercase">Info</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#333] border-2 border-transparent hover:border-[#444] rounded transition-all text-[#aaa] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ScrollArea className="flex-1 p-4 sm:p-6">
          <div className="space-y-6">
            <section className="bg-[#111] border-2 border-[#222] p-4 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">
               <div className="flex items-center gap-3 w-full sm:w-auto">
                 <div className="bg-[#222] p-2 border border-[#333] shrink-0">
                   <Sparkles className="w-4 h-4 text-amber-400" />
                 </div>
                 <span className="font-bold text-white tracking-wide text-sm whitespace-nowrap">Animated Skin</span>
               </div>
               
               <div className="flex items-center gap-3 w-full sm:w-auto">
                 <div className="bg-[#222] p-2 border border-[#333] shrink-0">
                   <SunMoon className="w-4 h-4 text-emerald-400" />
                 </div>
                 <span className="font-bold text-white tracking-wide text-sm whitespace-nowrap">Day / Night Cycle</span>
               </div>
            </section>

            <section className="text-xs text-[#666] leading-relaxed px-2 text-center sm:text-left">
              <p>
                Not affiliated with Hypixel Inc. or Mojang AB. All trademarks, game assets, pet names, lore text, and item models belong to their respective owners (Minecraft / Hypixel SkyBlock).
              </p>
            </section>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
