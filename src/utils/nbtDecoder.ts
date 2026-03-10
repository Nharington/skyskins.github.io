export interface DecodedTextureInfo {
  textures: {
    SKIN?: {
      url: string;
    };
  };
}

export function decodePetSkinTexture(base64: string): string | null {
  try {
    const decodedStr = atob(base64);
    const jsonObj = JSON.parse(decodedStr);
    
    if (jsonObj?.textures?.SKIN?.url) {
      return jsonObj.textures.SKIN.url;
    }
    return null;
  } catch (error) {
    console.error("Failed to decode skin texture base64:", error);
    return null;
  }
}
