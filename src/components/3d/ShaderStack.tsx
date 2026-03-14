import { useMemo } from 'react';
import { EffectComposer, Bloom, Vignette, BrightnessContrast, Pixelation } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { useAppStore } from '../../store/useAppStore';

export function ShaderStack() {
  const { postprocessingPreset } = useAppStore();

  const effects = useMemo(() => {
    switch (postprocessingPreset) {
      case 'Complementary':
        return (
          <>
            <Bloom
              intensity={0.4}
              luminanceThreshold={0.85}
              luminanceSmoothing={0.1}
              blendFunction={BlendFunction.SCREEN}
            />
          </>
        );

      case 'BSL':
        return (
          <>
            <Bloom
              intensity={1.5}
              luminanceThreshold={0.4}
              luminanceSmoothing={0.9}
              blendFunction={BlendFunction.SCREEN}
            />
            <BrightnessContrast
              brightness={0.05}
              contrast={0.2}
            />
          </>
        );

      case 'Photon':
        return (
          <>
            <Vignette
              offset={0.3}
              darkness={0.6}
              blendFunction={BlendFunction.NORMAL}
            />
            <BrightnessContrast
              brightness={0.05}
              contrast={0.15}
            />
            <Bloom
              intensity={0.3}
              luminanceThreshold={0.9}
              luminanceSmoothing={0.025}
            />
          </>
        );

      case 'VanillaPlus':
        return (
          <>
            <BrightnessContrast
              brightness={0.02}
              contrast={0.05}
            />
          </>
        );

      case 'Retro':
        return (
          <>
            <Pixelation granularity={4} />
            <BrightnessContrast
              brightness={0}
              contrast={0.3}
            />
          </>
        );

      case 'None':
      default:
        return null;
    }
  }, [postprocessingPreset]);

  if (postprocessingPreset === 'None' || !effects) {
    return null;
  }

  return (
    <EffectComposer>
      {effects}
    </EffectComposer>
  );
}
