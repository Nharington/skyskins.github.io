import { Github, Info } from 'lucide-react';

interface AppHeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenInfo: () => void;
  totalPets: number;
}

export function AppHeader({ onToggleSidebar, onOpenInfo, totalPets }: AppHeaderProps) {
  return (
    <header className="h-16 bg-[#1a1a1a] border-b-4 border-[#111111] flex items-center justify-between px-3 sm:px-4 md:px-8 z-30 shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.5)] relative">
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 hover:bg-[#333333] border-2 border-white/5 rounded transition-all active:scale-95"
          aria-label="Toggle sidebar"
        >
          <div className="flex flex-col gap-1 w-5">
            <div className="h-0.5 w-full bg-slate-300" />
            <div className="h-0.5 w-3/4 bg-slate-400" />
            <div className="h-0.5 w-full bg-slate-300" />
          </div>
        </button>
        
        <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-transform group-hover:scale-105 shrink-0 overflow-hidden">
             <img src="/favicon.svg" alt="SkySkins Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="flex flex-col -gap-0.5 sm:-gap-1 min-w-0">
            <span className="text-lg sm:text-xl font-black tracking-tight text-white leading-tight">
              SKY<span className="text-emerald-400">Skins</span>
            </span>
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-[#555555] font-bold uppercase tracking-[0.1em]">
               <span>3D Skin Viewer</span>
               <span className="w-1 h-1 rounded-full bg-[#333333]" />
            </div>
          </h1>
        </div>

        <div className="hidden xl:flex items-center gap-1.5 ml-4 bg-white/5 border border-white/10 px-3 py-1 rounded-full shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
            {totalPets} Assets Indexed
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onOpenInfo}
          className="flex items-center gap-2 text-[10px] font-black text-[#aaa] hover:text-white transition-all bg-[#2a2a2a] hover:bg-[#333] p-2 sm:px-4 sm:py-2 border border-[#444] tracking-widest group"
          title="Info"
        >
          <Info className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">INFO</span>
        </button>
        <a 
          href="https://discord.gg/QMseZUzJdK" 
          target="_blank" 
          rel="noreferrer"
          className="flex items-center gap-2 text-[10px] font-black text-[#5865F2] hover:text-white transition-all bg-[#5865F2]/10 hover:bg-[#5865F2] p-2 sm:px-4 sm:py-2 border border-[#5865F2]/20 hover:border-[#5865F2] tracking-widest"
          title="Discord"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
          </svg>
          <span className="hidden sm:inline">DISCORD</span>
        </a>
        <a
          href="https://github.com/skyskins/skyskins.github.io"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-[10px] font-black text-white bg-[#24292e] hover:bg-[#2f363d] p-2 sm:px-4 sm:py-2 border-b-4 border-[#1b1f23] active:border-b-0 active:translate-y-[2px] transition-all tracking-widest"
          title="GitHub"
        >
          <Github className="w-4 h-4" />
          <span className="hidden sm:inline">GITHUB</span>
        </a>
      </div>
    </header>
  );
}
