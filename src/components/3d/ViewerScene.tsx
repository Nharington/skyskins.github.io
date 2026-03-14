import { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { RotateCcw, Camera, Sun, Moon } from 'lucide-react';
import type { DayNightAnimation, PetAnimation } from '../../lib/cosmetics';
import { PetModel } from '../3d/PetModel';
import { ShaderStack } from './ShaderStack';

interface ViewerSceneProps {
  textureUrl: string;
  animation?: PetAnimation | DayNightAnimation;
  supportsDayNight?: boolean;
  dayNightMode?: 'day' | 'night';
  onToggleDayNight?: () => void;
  onScreenshot?: () => void;
}

export function ViewerScene({
  textureUrl,
  animation,
  supportsDayNight,
  dayNightMode,
  onToggleDayNight,
  onScreenshot,
}: ViewerSceneProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const [isTextureLoading, setIsTextureLoading] = useState(true);;

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

      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, transparent 60%, rgba(0,0,0,0.6) 100%)`,
        }}
      />

      <Canvas
        gl={{ preserveDrawingBuffer: true, antialias: true, alpha: true }}
        className="w-full h-full"
      >
        <OrthographicCamera
          makeDefault
          position={[-10, 7.07, 10]}
          zoom={80}
          near={-100}
          far={100}
        />
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 7.5]} intensity={1.2} castShadow={false} />
        <directionalLight position={[-5, 2, 5]}  intensity={0.4} />
        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          minZoom={20}
          maxZoom={200}
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI}
        />
        <PetModel
          textureUrl={textureUrl}
          animation={animation}
          dayNightMode={dayNightMode}
          onTextureLoadState={setIsTextureLoading}
        />
        <ShaderStack />
      </Canvas>
    </div>
  );
}
