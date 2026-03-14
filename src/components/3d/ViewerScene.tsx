import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { RotateCcw, Camera, Sun, Moon, Sparkles, SunMoon } from 'lucide-react';
import type { DayNightAnimation, PetAnimation } from '../../lib/cosmetics';
import { PetModel } from '../3d/PetModel';

interface ViewerSceneProps {
  textureUrl: string;
  animation?: PetAnimation | DayNightAnimation;
  isAnimatedSkin?: boolean;
  supportsDayNight?: boolean;
  dayNightMode?: 'day' | 'night';
  onToggleDayNight?: () => void;
  onScreenshot?: () => void;
}

export function ViewerScene({
  textureUrl,
  animation,
  isAnimatedSkin,
  supportsDayNight,
  dayNightMode,
  onToggleDayNight,
  onScreenshot,
}: ViewerSceneProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const [isTextureLoading, setIsTextureLoading] = useState(true);
  const [angles, setAngles] = useState<{ yaw: number; pitch: number } | null>(null);

  useEffect(() => {
    let raf: number | null = null;
    const loop = () => {
      const c = controlsRef.current;
      if (c) {
        const yaw = (c.getAzimuthalAngle() * 180) / Math.PI;
        const polar = (c.getPolarAngle() * 180) / Math.PI;
        // OrbitControls polar: 0 = looking down from +Y, 90 = horizontal. Convert to pitch-like.
        const pitch = 90 - polar;
        setAngles({ yaw, pitch });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="flex-1 cursor-grab active:cursor-grabbing w-full h-full relative bg-[#141414]">
      {isTextureLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-emerald-500 font-bold uppercase tracking-widest text-sm animate-pulse">Loading Asset...</span>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 right-4 md:bottom-6 md:right-8 z-10 flex flex-col gap-2 pointer-events-auto">
        {supportsDayNight && onToggleDayNight && (
          <button
            onClick={onToggleDayNight}
            title={`Switch to ${dayNightMode === 'day' ? 'Night' : 'Day'} Mode`}
            className="bg-[#222222]/80 hover:bg-[#333333] border-2 border-white/10 hover:border-emerald-500/50 p-2.5 shadow-xl backdrop-blur-md transition-all active:scale-90"
          >
            {dayNightMode === 'day' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-blue-400" />}
          </button>
        )}

        <button
          onClick={() => controlsRef.current?.reset()}
          title="Reset Camera (R)"
          className="bg-[#222222]/80 hover:bg-[#333333] border-2 border-white/10 hover:border-emerald-500/50 p-2.5 shadow-xl backdrop-blur-md text-slate-400 hover:text-white transition-all active:scale-90"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        {onScreenshot && (
          <button
            onClick={onScreenshot}
            title="Take Screenshot"
            className="bg-[#222222]/80 hover:bg-[#333333] border-2 border-white/10 hover:border-emerald-500/50 p-2.5 shadow-2xl backdrop-blur-md text-slate-400 hover:text-white transition-all active:scale-90"
          >
            <Camera className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="absolute top-4 right-4 md:top-6 md:right-8 z-50 pointer-events-none flex flex-col items-end gap-2">
        {(isAnimatedSkin || supportsDayNight) && (
          <div className="flex flex-col sm:flex-row gap-2">
            {isAnimatedSkin && (
              <div className="bg-[#111111]/75 backdrop-blur-md border-2 border-white/10 px-3 py-2 shadow-xl flex items-center gap-3">
                <div className="bg-[#222] p-2 border border-[#333] shrink-0">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <span className="font-bold text-white tracking-wide text-xs sm:text-sm whitespace-nowrap">
                  Animated Skin
                </span>
              </div>
            )}
            {supportsDayNight && (
              <div className="bg-[#111111]/75 backdrop-blur-md border-2 border-white/10 px-3 py-2 shadow-xl flex items-center gap-3">
                <div className="bg-[#222] p-2 border border-[#333] shrink-0">
                  <SunMoon className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="font-bold text-white tracking-wide text-xs sm:text-sm whitespace-nowrap">
                  Day / Night Cycle
                </span>
              </div>
            )}
          </div>
        )}

        {angles && (
          <div className="bg-[#111111]/75 backdrop-blur-md border-2 border-white/10 px-3 py-2 shadow-xl">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#888]">Camera</div>
            <div className="mt-1 flex gap-3 text-xs font-bold text-white">
              <span className="tabular-nums">
                <span className="text-[#aaa]">Yaw</span> {angles.yaw.toFixed(1)}°
              </span>
              <span className="tabular-nums">
                <span className="text-[#aaa]">Pitch</span> {angles.pitch.toFixed(1)}°
              </span>
            </div>
          </div>
        )}
      </div>

      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, transparent 60%, rgba(0,0,0,0.6) 100%)`,
        }}
      />

      <Canvas
        camera={{ position: [0, 0, 9], fov: 45 }}
        gl={{ preserveDrawingBuffer: true }}
        className="w-full h-full"
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />
        <directionalLight position={[-5, 5, -5]} intensity={0.5} color="#4444ff" />
        <pointLight position={[0, 5, 0]} intensity={0.3} />
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableZoom
          minDistance={4}
          maxDistance={14}
          enableDamping
          dampingFactor={0.05}
        />
        <PetModel
          textureUrl={textureUrl}
          animation={animation}
          dayNightMode={dayNightMode}
          onTextureLoadState={setIsTextureLoading}
        />
      </Canvas>
    </div>
  );
}
