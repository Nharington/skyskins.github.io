import { ImageOff } from 'lucide-react';
import { useState } from 'react';
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

  if (item.previewMode === 'skin-head') {
    return (
      <SkinHeadThumb
        frames={item.frames}
        ticks={item.ticks}
        play={play}
        background={background}
        yawDeg={yawDeg}
        pitchDeg={pitchDeg}
        rotationDeg={rotationDeg}
        className={className}
      />
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
