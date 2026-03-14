import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import type { DayNightAnimation, PetAnimation } from '../../lib/cosmetics';

interface PetModelProps {
  textureUrl: string | null;
  animation?: PetAnimation | DayNightAnimation;
  dayNightMode?: 'day' | 'night';
  onTextureLoadState?: (isLoading: boolean) => void;
}

const FALLBACK_TEXTURE = '/assets/default.png';

function useTextures(urls: string[], onLoadingChange?: (loading: boolean) => void) {
  const [textures, setTextures] = useState<THREE.Texture[]>([]);

  useEffect(() => {
    let active = true;
    onLoadingChange?.(true);
    const loader = new THREE.TextureLoader();

    Promise.all(
      urls.map(
        (url) =>
          new Promise<THREE.Texture | null>((resolve) => {
            loader.load(
              url,
              (tex) => resolve(tex),
              undefined,
              () => {
                loader.load(FALLBACK_TEXTURE, resolve, undefined, () => resolve(null));
              },
            );
          }),
      ),
    ).then((loadedTextures) => {
      if (active) {
        const validTextures = loadedTextures.filter(Boolean) as THREE.Texture[];
        setTextures(validTextures);
        onLoadingChange?.(false);
      }
    });

    return () => {
      active = false;
    };
  }, [onLoadingChange, urls]);

  return textures;
}

export function PetModel({ textureUrl, animation, dayNightMode = 'day', onTextureLoadState }: PetModelProps) {
  const outerGroupRef = useRef<THREE.Group>(null);

  const activeAnimation = useMemo(() => {
    if (!animation) return null;
    if ('day' in animation) return animation[dayNightMode];
    return animation;
  }, [animation, dayNightMode]);

  const isFrameAnimated = !!activeAnimation && activeAnimation.frames.length > 0;

  const urlsToLoad = useMemo(() => {
    if (isFrameAnimated && activeAnimation) {
      return activeAnimation.frames;
    }
    return [textureUrl || FALLBACK_TEXTURE];
  }, [isFrameAnimated, activeAnimation, textureUrl]);

  const textures = useTextures(urlsToLoad, onTextureLoadState);

  const [frameIndex, setFrameIndex] = useState(0);
  const timeRef = useRef(0);

  useEffect(() => {
    timeRef.current = 0;
  }, [activeAnimation, textures.length]);

  useFrame((state, delta) => {
    if (outerGroupRef.current) {
      outerGroupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }

    if (isFrameAnimated && textures.length > 0 && activeAnimation) {
      timeRef.current += delta;
      const frameDuration = (activeAnimation.ticks * 50) / 1000;

      if (timeRef.current > frameDuration) {
        timeRef.current = 0;
        setFrameIndex((prev) => (prev + 1) % textures.length);
      }
    }
  });

  const precomputedMaterials = useMemo(() => {
    return textures.map((t) => {
      const matTex = t.clone();
      matTex.magFilter = THREE.NearestFilter;
      matTex.minFilter = THREE.NearestFilter;
      matTex.needsUpdate = true;

      const createMaterials = (offsetX: number, offsetY: number) => {
        const mats = [];
        const regions = [
          { x: offsetX + 16, y: offsetY + 8, w: 8, h: 8 },
          { x: offsetX + 0, y: offsetY + 8, w: 8, h: 8 },
          { x: offsetX + 8, y: offsetY + 0, w: 8, h: 8 },
          { x: offsetX + 16, y: offsetY + 0, w: 8, h: 8 },
          { x: offsetX + 8, y: offsetY + 8, w: 8, h: 8 },
          { x: offsetX + 24, y: offsetY + 8, w: 8, h: 8 },
        ];

        const image = matTex.image as { height?: number; width?: number } | null;
        const texHeight = image?.height || 64;
        const texWidth = image?.width || 64;

        for (let i = 0; i < 6; i++) {
          const cloneT = matTex.clone();
          cloneT.needsUpdate = true;
          cloneT.repeat.set(regions[i].w / texWidth, regions[i].h / texHeight);
          cloneT.offset.set(regions[i].x / texWidth, 1 - (regions[i].y + regions[i].h) / texHeight);

          mats.push(
            new THREE.MeshStandardMaterial({
              map: cloneT,
              transparent: true,
              alphaTest: 0.1,
              side: THREE.FrontSide,
            }),
          );
        }
        return mats;
      };

      return {
        innerMaterials: createMaterials(0, 0),
        outerMaterials: createMaterials(32, 0),
      };
    });
  }, [textures]);

  const { innerMaterials, outerMaterials } = useMemo(() => {
    const activeIndex = isFrameAnimated && textures.length > 0 ? (frameIndex % textures.length) : 0;
    return precomputedMaterials[activeIndex] || { innerMaterials: [], outerMaterials: [] };
  }, [precomputedMaterials, isFrameAnimated, frameIndex, textures.length]);

  return (
    <group>
      <group ref={outerGroupRef}>
        <group>
          <mesh scale={[2, 2, 2]}>
            <boxGeometry args={[1, 1, 1]} />
            {innerMaterials.length === 6 && innerMaterials.map((m, i) => (
              <primitive object={m} attach={`material-${i}`} key={`inner-${i}`} />
            ))}
          </mesh>

          <mesh scale={[2.1, 2.1, 2.1]}>
            <boxGeometry args={[1, 1, 1]} />
            {outerMaterials.length === 6 && outerMaterials.map((m, i) => (
              <primitive object={m} attach={`material-${i}`} key={`outer-${i}`} />
            ))}
          </mesh>
        </group>
      </group>

      <ContactShadows
        position={[0, -1.5, 0]}
        opacity={0.4}
        scale={10}
        blur={2}
        far={4}
      />
    </group>
  );
}
