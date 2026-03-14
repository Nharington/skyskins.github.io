import { ImageOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { CatalogItem } from '../../lib/cosmetics';
import { assetUrl } from '../../lib/cosmetics';
import { SkinHeadThumb } from './SkinHeadThumb';

interface CosmeticThumbProps {
  item: CatalogItem;
  play?: boolean;
  className?: string;
  background?: boolean;
  yawDeg?: number;
  pitchDeg?: number;
  rotationDeg?: number;
  imageClassName?: string;
}

export function CosmeticThumb({
  item,
  play = false,
  className,
  background = false,
  yawDeg = 18,
  pitchDeg = 8,
  rotationDeg = 0,
  imageClassName,
}: CosmeticThumbProps) {
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (item.previewMode === 'skin-head') {
    return (
      <div ref={containerRef} className={`w-full h-full relative ${className ?? ''}`}>
        {!inView ? (
          <div className="absolute inset-0 h-full w-full p-4 flex flex-col items-center justify-center gap-3 bg-[#111] animate-pulse">
             <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-emerald-500/50 border-t-emerald-500 rounded-full animate-spin" />
             </div>
             <div className="text-[10px] font-black uppercase tracking-widest text-[#555]">
                Loading 3D
             </div>
          </div>
        ) : (
          <SkinHeadThumb
            frames={item.frames}
            ticks={item.ticks}
            play={play}
            background={background}
            yawDeg={yawDeg}
            pitchDeg={pitchDeg}
            rotationDeg={rotationDeg}
            className="w-full h-full absolute inset-0"
          />
        )}
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={`${className ?? ''} flex items-center justify-center bg-black/20`}>
        <div className="flex h-full w-full items-center justify-center p-4 text-[#666]">
          <ImageOff className="h-8 w-8" />
        </div>
      </div>
    );
  }

  return (
    <div className={`${className ?? ''} flex items-center justify-center bg-black/20 p-4`}>
      <img
        src={assetUrl(item.texturePath)}
        alt={item.itemNamePlain}
        className={imageClassName ?? 'h-full w-full object-contain'}
        loading="lazy"
        onError={() => setHasError(true)}
      />
    </div>
  );
}
