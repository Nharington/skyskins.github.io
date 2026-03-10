import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PetAnimation {
  ticks: number;
  frames: string[];
}

export interface DayNightAnimation {
  day: PetAnimation;
  night: PetAnimation;
}

export interface PetVariant {
  id: string;
  name: string;
  texturePath: string;
  lore?: string;
  animated?: boolean;
  animation?: PetAnimation | DayNightAnimation;
}

export interface PetRecord {
  name: string;
  type: string;
  category: string;
  description: string;
  infoUrls: string[];
  recipes: any[];
  rarities: PetVariant[];
  variants: PetVariant[];
}

export interface RegistryEntry {
  name: string;
  category: string;
  rarities: { name: string }[];
  variantsCount: number;
}

interface AppState {
  registry: Record<string, RegistryEntry>;
  selectedPetData: PetRecord | null;
  selectedPetId: string | null;
  selectedVariantId: string | null;
  selectedRarityIdx: number;
  searchQuery: string;
  activeFilter: string | null;
  showAnimatedOnly: boolean;
  dayNightMode: 'day' | 'night';
  
  setRegistry: (data: Record<string, RegistryEntry>) => void;
  selectPet: (id: string | null) => void;
  selectVariant: (variantId: string | null) => void;
  selectRarityIdx: (idx: number) => void;
  setSearchQuery: (q: string) => void;
  setActiveFilter: (filter: string | null) => void;
  setShowAnimatedOnly: (val: boolean) => void;
  setDayNightMode: (mode: 'day' | 'night') => void;
  fetchPetData: (id: string) => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      registry: {},
      selectedPetData: null,
      selectedPetId: null,
      selectedVariantId: null,
      selectedRarityIdx: 0,
      searchQuery: '',
      activeFilter: null,
      showAnimatedOnly: false,
      dayNightMode: 'day',
      
      setRegistry: (data) => set({ registry: data }),
      selectPet: (id) => {
        if (!id) {
          set({ selectedPetId: null, selectedPetData: null, selectedVariantId: null });
          return;
        }
        set({ selectedPetId: id, selectedVariantId: null });
        get().fetchPetData(id);
      },
      fetchPetData: async (id) => {
        try {
          const res = await fetch(`/assets/pet_data/${id}.json`);
          if (!res.ok) throw new Error(`Failed to load data for pet ${id}`);
          const data = await res.json();
          set((state) => {
             if (state.selectedPetId !== id) return {};
             
             const rarityIdx = data.rarities.length > 0 
                ? (state.selectedRarityIdx < data.rarities.length ? state.selectedRarityIdx : data.rarities.length - 1)
                : 0;

             return { selectedPetData: data, selectedRarityIdx: rarityIdx };
          });
        } catch (err) {
          console.error(err);
        }
      },
      selectVariant: (variantId) => set({ selectedVariantId: variantId }),
      selectRarityIdx: (idx) => set({ selectedRarityIdx: idx, selectedVariantId: null }),
      setSearchQuery: (q) => set({ searchQuery: q }),
      setActiveFilter: (f) => set({ activeFilter: f }),
      setShowAnimatedOnly: (val) => set({ showAnimatedOnly: val }),
      setDayNightMode: (mode) => set({ dayNightMode: mode }),
    }),
    {
      name: 'skyskins-storage',
       partialize: (state) => ({ 
        selectedPetId: state.selectedPetId,
        selectedVariantId: state.selectedVariantId,
        selectedRarityIdx: state.selectedRarityIdx,
        activeFilter: state.activeFilter,
        showAnimatedOnly: state.showAnimatedOnly,
        dayNightMode: state.dayNightMode,
      }),
    }
  )
);
