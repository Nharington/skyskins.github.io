import { X, Sparkles, SunMoon, Settings, Download, Upload } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { useAppStore } from '../../store/useAppStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESETS = [
  { id: 'None',          label: 'None' },
  { id: 'Complementary', label: 'Complementary' },
  { id: 'BSL',           label: 'BSL' },
  { id: 'Photon',        label: 'Photon' },
  { id: 'VanillaPlus',   label: 'Vanilla+' },
  { id: 'Retro',         label: 'Retro' },
];

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { postprocessingPreset, setPostprocessingPreset } = useAppStore();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#1e1e1e] border-4 border-[#333] w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b-4 border-[#333] bg-[#252525] shrink-0">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-black tracking-widest text-white uppercase">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#333] border-2 border-transparent hover:border-[#444] rounded transition-all text-[#aaa] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <ScrollArea className="flex-1 p-3 sm:p-4">
          <div className="space-y-6">

            {/* Shaders Section */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 border-b-2 border-[#333] pb-2">
                <h3 className="text-xs font-black tracking-widest text-emerald-400 uppercase">Visual Shaders</h3>
                <span className="text-[9px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 uppercase tracking-widest">Alpha</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRESETS.map((preset) => {
                  const isActive = postprocessingPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => setPostprocessingPreset(preset.id)}
                      className={`
                        relative flex items-center gap-2 p-2.5 border-2 cursor-pointer transition-all text-left
                        ${isActive
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-[#333] bg-[#111] hover:border-[#555]'}
                      `}
                    >
                      <div className={`w-2.5 h-2.5 rounded-full border-2 shrink-0 ${isActive ? 'border-emerald-500 bg-emerald-500' : 'border-[#666]'}`} />
                      <span className={`font-bold text-xs tracking-wide truncate ${isActive ? 'text-emerald-400' : 'text-white'}`}>
                        {preset.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Data Section */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 border-b-2 border-[#333] pb-2">
                <h3 className="text-xs font-black tracking-widest text-[#aaa] uppercase">Data</h3>
                <span className="text-[9px] font-black bg-[#333] text-[#777] border border-[#444] px-1.5 py-0.5 uppercase tracking-widest">Not Implemented</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button disabled className="flex-1 flex items-center justify-center gap-2 bg-[#1a1a1a] text-[#555] p-2.5 border-2 border-[#333] font-bold text-xs uppercase tracking-widest cursor-not-allowed">
                  <Download className="w-3.5 h-3.5" /> Backup
                </button>
                <button disabled className="flex-1 flex items-center justify-center gap-2 bg-[#1a1a1a] text-[#555] p-2.5 border-2 border-[#333] font-bold text-xs uppercase tracking-widest cursor-not-allowed">
                  <Upload className="w-3.5 h-3.5" /> Restore
                </button>
              </div>
            </section>

            {/* Projects Section */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 border-b-2 border-[#333] pb-2">
                <h3 className="text-xs font-black tracking-widest text-[#aaa] uppercase">Our Projects</h3>
              </div>
              <a
                href="https://hydocs.github.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between p-3 bg-[#111] border-2 border-[#333] hover:border-emerald-500/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500/10 p-2 border border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">HyDocs</h4>
                    <p className="text-[10px] text-[#555] font-bold group-hover:text-[#777] transition-colors">Unified Hypixel Documentation</p>
                  </div>
                </div>
                <Settings className="w-3.5 h-3.5 text-[#555] group-hover:text-emerald-400 rotate-45 transition-all" />
              </a>
            </section>

            {/* Info/Legend Section */}
            <section className="space-y-3 pt-2 border-t-2 border-[#1a1a1a]">
               <div className="flex flex-wrap gap-2">
                 <div className="flex items-center gap-2 bg-[#111] border border-[#222] p-2 pr-3">
                   <div className="bg-[#222] p-1 shrink-0">
                     <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                   </div>
                   <span className="font-bold text-[#bbb] tracking-wide text-[10px] uppercase">Animated</span>
                 </div>
                 <div className="flex items-center gap-2 bg-[#111] border border-[#222] p-2 pr-3">
                   <div className="bg-[#222] p-1 shrink-0">
                     <SunMoon className="w-3.5 h-3.5 text-emerald-400" />
                   </div>
                   <span className="font-bold text-[#bbb] tracking-wide text-[10px] uppercase">Day/Night</span>
                 </div>
               </div>
              <p className="text-[10px] text-[#555] leading-relaxed uppercase font-bold tracking-widest">
                Not affiliated with Hypixel Inc. or Mojang AB.
              </p>
            </section>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
