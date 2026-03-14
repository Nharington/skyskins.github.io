import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  assetUrl,
  type BrowseLayout,
  type CosmeticKind,
  type CosmeticRarity,
  type OwnedCosmeticEntry,
  type PetRecord,
  type RegistryEntry,
} from '../lib/cosmetics';

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
  browseLayout: BrowseLayout;
  postprocessingPreset: string;

  ownedCosmetics: Record<string, OwnedCosmeticEntry>;
  
  setRegistry: (data: Record<string, RegistryEntry>) => void;
  selectPet: (id: string | null) => void;
  selectVariant: (variantId: string | null) => void;
  selectRarityIdx: (idx: number) => void;
  setSearchQuery: (q: string) => void;
  setActiveFilter: (filter: string | null) => void;
  setShowAnimatedOnly: (val: boolean) => void;
  setDayNightMode: (mode: 'day' | 'night') => void;
  setBrowseLayout: (layout: BrowseLayout) => void;
  setPostprocessingPreset: (preset: string) => void;
  fetchPetData: (id: string) => Promise<void>;

  upsertOwnedCosmetic: (entry: Omit<OwnedCosmeticEntry, 'updatedAt'>) => void;
  updateOwnedCosmetic: (key: string, patch: Partial<Omit<OwnedCosmeticEntry, 'key' | 'updatedAt'>>) => void;
  removeOwnedCosmetic: (key: string) => void;
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
      browseLayout: 'grid',
      postprocessingPreset: 'None',
      ownedCosmetics: {},
      
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
          const res = await fetch(assetUrl(`/assets/pet_data/${id}.json`));
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
      setBrowseLayout: (layout) => set({ browseLayout: layout }),
      setPostprocessingPreset: (preset) => set({ postprocessingPreset: preset }),

      upsertOwnedCosmetic: (entry) =>
        set((state) => ({
          ownedCosmetics: {
            ...state.ownedCosmetics,
            [entry.key]: { ...entry, updatedAt: Date.now() },
          },
        })),
      updateOwnedCosmetic: (key, patch) =>
        set((state) => {
          const existing = state.ownedCosmetics[key];
          if (!existing) return {};
          return {
            ownedCosmetics: {
              ...state.ownedCosmetics,
              [key]: { ...existing, ...patch, updatedAt: Date.now() },
            },
          };
        }),
      removeOwnedCosmetic: (key) =>
        set((state) => {
          if (!state.ownedCosmetics[key]) return {};
          const next = { ...state.ownedCosmetics };
          delete next[key];
          return { ownedCosmetics: next };
        }),
    }),
    {
      name: 'skyskins-storage',
      migrate: (persisted: unknown) => {
        const state = (persisted ?? {}) as Record<string, unknown>;
        const ownedSource = (
          state.ownedCosmetics && typeof state.ownedCosmetics === 'object'
            ? (state.ownedCosmetics as Record<string, unknown>)
            : state.ownedSkins && typeof state.ownedSkins === 'object'
              ? (state.ownedSkins as Record<string, unknown>)
              : {}
        ) as Record<string, unknown>;

        const nextOwned: Record<string, OwnedCosmeticEntry> = {};
        for (const [k, v] of Object.entries(ownedSource)) {
          const entry = (v && typeof v === 'object' ? (v as Record<string, unknown>) : {}) as Record<string, unknown>;
          const type = (typeof entry.type === 'string' ? entry.type : 'petSkin') as CosmeticKind;
          const parentId =
            typeof entry.parentId === 'string'
              ? entry.parentId
              : typeof entry.petId === 'string'
                ? entry.petId
                : undefined;
          const itemId =
            typeof entry.itemId === 'string'
              ? entry.itemId
              : typeof entry.skinId === 'string'
                ? entry.skinId
                : k;
          if (!parentId || !itemId) continue;
          const key = typeof entry.key === 'string' ? entry.key : `${type}::${parentId}::${itemId}`;
          nextOwned[key] = {
            key,
            type,
            parentId,
            itemId,
            parentName:
              typeof entry.parentName === 'string'
                ? entry.parentName
                : typeof entry.petName === 'string'
                  ? entry.petName
                  : parentId,
            itemName:
              typeof entry.itemName === 'string'
                ? entry.itemName
                : typeof entry.skinName === 'string'
                  ? entry.skinName
                  : itemId,
            rarity: (typeof entry.rarity === 'string' ? entry.rarity : 'UNKNOWN') as CosmeticRarity,
            quantity: typeof entry.quantity === 'number' ? entry.quantity : 1,
            acquiredDate: typeof entry.acquiredDate === 'string' ? entry.acquiredDate : undefined,
            pricePaid: typeof entry.pricePaid === 'number' ? entry.pricePaid : undefined,
            updatedAt: typeof entry.updatedAt === 'number' ? entry.updatedAt : Date.now(),
          };
        }

        return { ...(state as Record<string, unknown>), ownedCosmetics: nextOwned, browseLayout: state.browseLayout ?? 'grid', postprocessingPreset: state.postprocessingPreset ?? 'None' };
      },
      partialize: (state) => ({ 
        selectedPetId: state.selectedPetId,
        selectedVariantId: state.selectedVariantId,
        selectedRarityIdx: state.selectedRarityIdx,
        activeFilter: state.activeFilter,
        showAnimatedOnly: state.showAnimatedOnly,
        dayNightMode: state.dayNightMode,
        browseLayout: state.browseLayout,
        postprocessingPreset: state.postprocessingPreset,
        ownedCosmetics: state.ownedCosmetics,
      }),
    }
  )
);
