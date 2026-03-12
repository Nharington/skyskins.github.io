import { create } from 'zustand';
import { persist } from 'zustand/middleware';

function assetUrl(path: string) {
  const base = import.meta.env.BASE_URL || '';
  return `${base}${path.replace(/^\//, '')}`;
}

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

export type CosmeticRarity =
  | 'COMMON'
  | 'UNCOMMON'
  | 'RARE'
  | 'EPIC'
  | 'LEGENDARY'
  | 'MYTHIC'
  | 'DIVINE'
  | 'SPECIAL'
  | 'VERY SPECIAL'
  | 'SUPREME'
  | 'UNKNOWN';

export interface OwnedSkinEntry {
  key: string; // `${petId}::${skinId}` to disambiguate duplicate ids
  skinId: string;
  petId: string;
  petName: string;
  skinName: string;
  rarity: CosmeticRarity;
  quantity: number;
  acquiredDate?: string; // YYYY-MM-DD
  pricePaid?: number;
  updatedAt: number;
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

  ownedSkins: Record<string, OwnedSkinEntry>;
  
  setRegistry: (data: Record<string, RegistryEntry>) => void;
  selectPet: (id: string | null) => void;
  selectVariant: (variantId: string | null) => void;
  selectRarityIdx: (idx: number) => void;
  setSearchQuery: (q: string) => void;
  setActiveFilter: (filter: string | null) => void;
  setShowAnimatedOnly: (val: boolean) => void;
  setDayNightMode: (mode: 'day' | 'night') => void;
  fetchPetData: (id: string) => Promise<void>;

  upsertOwnedSkin: (entry: Omit<OwnedSkinEntry, 'updatedAt'>) => void;
  updateOwnedSkin: (key: string, patch: Partial<Omit<OwnedSkinEntry, 'key' | 'updatedAt'>>) => void;
  removeOwnedSkin: (key: string) => void;
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
      ownedSkins: {},
      
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

      upsertOwnedSkin: (entry) =>
        set((state) => ({
          ownedSkins: {
            ...state.ownedSkins,
            [entry.key]: { ...entry, updatedAt: Date.now() },
          },
        })),
      updateOwnedSkin: (key, patch) =>
        set((state) => {
          const existing = state.ownedSkins[key];
          if (!existing) return {};
          return {
            ownedSkins: {
              ...state.ownedSkins,
              [key]: { ...existing, ...patch, updatedAt: Date.now() },
            },
          };
        }),
      removeOwnedSkin: (key) =>
        set((state) => {
          if (!state.ownedSkins[key]) return {};
          const next = { ...state.ownedSkins };
          delete next[key];
          return { ownedSkins: next };
        }),
    }),
    {
      name: 'skyskins-storage',
      migrate: (persisted: any, _version) => {
        const state = persisted as any;
        const owned: Record<string, any> = state?.ownedSkins ?? {};

        // Migrate old `{ [skinId]: entry }` shape into `{ [petId::skinId]: entry }`.
        // If it's already migrated, entries will have `key`.
        const nextOwned: Record<string, OwnedSkinEntry> = {};
        for (const [k, v] of Object.entries(owned)) {
          const entry = v as any;
          const petId = entry?.petId;
          const skinId = entry?.skinId ?? k;
          if (!petId || !skinId) continue;
          const key = typeof entry?.key === 'string' ? entry.key : `${petId}::${skinId}`;
          nextOwned[key] = {
            key,
            skinId,
            petId,
            petName: entry?.petName ?? petId,
            skinName: entry?.skinName ?? skinId,
            rarity: entry?.rarity ?? 'UNKNOWN',
            quantity: typeof entry?.quantity === 'number' ? entry.quantity : 1,
            acquiredDate: entry?.acquiredDate,
            pricePaid: entry?.pricePaid,
            updatedAt: typeof entry?.updatedAt === 'number' ? entry.updatedAt : Date.now(),
          };
        }

        return { ...state, ownedSkins: nextOwned };
      },
      partialize: (state) => ({ 
        selectedPetId: state.selectedPetId,
        selectedVariantId: state.selectedVariantId,
        selectedRarityIdx: state.selectedRarityIdx,
        activeFilter: state.activeFilter,
        showAnimatedOnly: state.showAnimatedOnly,
        dayNightMode: state.dayNightMode,
        ownedSkins: state.ownedSkins,
      }),
    }
  )
);
