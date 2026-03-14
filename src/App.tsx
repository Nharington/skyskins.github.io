import { useEffect, useState, useMemo, useCallback } from 'react';
import { TooltipProvider } from './components/ui/tooltip';
import type { RegistryEntry } from './lib/cosmetics';
import { useAppStore } from './store/useAppStore';
import { AppHeader } from './components/layout/AppHeader';
import { PetSidebar } from './components/pets/PetSidebar';
import { SkinsPanel } from './components/pets/SkinsPanel';
import { PetInfoPanel } from './components/pets/PetInfoPanel';
import { ViewerScene } from './components/3d/ViewerScene';
import { SettingsModal } from './components/layout/SettingsModal';
import { BrowsePage } from './pages/BrowsePage';

function App() {
  const {
    registry,
    selectedPetData,
    selectedPetId,
    selectedVariantId,
    selectedRarityIdx,
    searchQuery,
    activeFilter,
    showAnimatedOnly,
    dayNightMode,
    setRegistry,
    selectPet,
    fetchPetData,
    selectVariant,
    selectRarityIdx,
    setSearchQuery,
    setActiveFilter,
    setShowAnimatedOnly,
    setDayNightMode,
  } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);
  const [isSkinsPanelOpen, setIsSkinsPanelOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [path, setPath] = useState(() => (typeof window !== 'undefined' ? window.location.pathname : '/'));

  const navigate = useCallback((to: string) => {
    if (typeof window === 'undefined') return;
    if (window.location.pathname === to) return;
    window.history.pushState({}, '', to);
    setPath(to);
  }, []);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}assets/registry.json`)
      .then((res) => res.json())
      .then((data: Record<string, RegistryEntry>) => {
        setRegistry(data);
        const keys = Object.keys(data);
        if (keys.length > 0) {
          if (!selectedPetId) {
            selectPet(keys[0]);
          } else {
            fetchPetData(selectedPetId);
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load registry.json', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    const petIds = Object.keys(registry);
    const currentIdx = selectedPetId ? petIds.indexOf(selectedPetId) : -1;

    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      switch (e.key) {
        case 'ArrowUp':
          if (currentIdx > 0) selectPet(petIds[currentIdx - 1]);
          break;
        case 'ArrowDown':
          if (currentIdx < petIds.length - 1) selectPet(petIds[currentIdx + 1]);
          break;
        case 'ArrowLeft':
          if (selectedPetData) {
            if (!selectedVariantId && selectedPetData.rarities.length > 1) {
              selectRarityIdx(selectedRarityIdx > 0 ? selectedRarityIdx - 1 : selectedPetData.rarities.length - 1);
            }
          }
          break;
        case 'ArrowRight':
          if (selectedPetData) {
            if (!selectedVariantId && selectedPetData.rarities.length > 1) {
              selectRarityIdx(selectedRarityIdx < selectedPetData.rarities.length - 1 ? selectedRarityIdx + 1 : 0);
            }
          }
          break;
        case 'Escape':
          setIsSidebarOpen(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [registry, selectedPetId, selectedPetData, selectedVariantId, selectedRarityIdx]);

  const handleCloseSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const handleRarityClick = useCallback((petId: string, rarityName: string) => {
    selectPet(petId);
    if (selectedPetId === petId && selectedPetData) {
      const idx = selectedPetData.rarities.findIndex((r) => r.name === rarityName);
      if (idx !== -1) selectRarityIdx(idx);
    }
  }, [selectPet, selectedPetId, selectedPetData, selectRarityIdx]);

  const activeTextureUrl = useMemo(() => {
    if (!selectedPetData) return '/assets/skins/steve.png';
    if (selectedVariantId) {
      const skin = selectedPetData.variants.find((v) => v.id === selectedVariantId);
      if (skin) return skin.texturePath;
    }
    const rarity = selectedPetData.rarities[selectedRarityIdx] ?? selectedPetData.rarities[0];
    return rarity?.texturePath ?? '/assets/skins/steve.png';
  }, [selectedPetData, selectedVariantId, selectedRarityIdx]);

  const filteredPets = useMemo(() => {
    let result = Object.entries(registry);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(([, pet]) => pet.name.toLowerCase().includes(q));
    }
    if (activeFilter) {
      result = result.filter(([, pet]) => pet.category === activeFilter);
    }
    if (showAnimatedOnly) {
      result = result.filter(([, pet]) => pet.variantsCount > 0);
    }
    return result;
  }, [registry, searchQuery, activeFilter, showAnimatedOnly]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    Object.values(registry).forEach((p) => cats.add(p.category));
    return Array.from(cats).sort();
  }, [registry]);

  const activeVariantSupportDayNight = useMemo(() => {
    if (!selectedPetData || !selectedVariantId) return false;
    const skin = selectedPetData.variants.find((v) => v.id === selectedVariantId);
    return Boolean(skin?.animation && 'day' in skin.animation);
  }, [selectedPetData, selectedVariantId]);

  const activeAnimation = useMemo(() => {
    if (!selectedPetData || !selectedVariantId) return undefined;
    const skin = selectedPetData.variants.find((v) => v.id === selectedVariantId);
    return skin?.animation;
  }, [selectedPetData, selectedVariantId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1D1D1D] text-emerald-500 font-mono">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm uppercase tracking-widest">Loading pets...</span>
        </div>
      </div>
    );
  }

  const isBrowse = path === '/browse';

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex flex-col h-screen w-full bg-[#111111] text-white overflow-hidden relative selection:bg-emerald-500/30 font-sans">
        <AppHeader
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((o) => !o)}
          onOpenInfo={() => setIsSettingsModalOpen(true)}
          onOpenCollection={() => navigate('/browse')}
          onBackToViewer={() => navigate('/')}
          mode={isBrowse ? 'browse' : 'viewer'}
          totalPets={Object.keys(registry).length}
        />

        {!isBrowse ? (
          <div className="flex flex-1 overflow-hidden relative flex flex-row">
            {isSidebarOpen && (
              <div
                className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
                onClick={handleCloseSidebar}
              />
            )}

            <PetSidebar
              isOpen={isSidebarOpen}
              registry={registry}
              filteredPets={filteredPets}
              categories={categories}
              selectedPetId={selectedPetId}
              searchQuery={searchQuery}
              activeFilter={activeFilter}
              showAnimatedOnly={showAnimatedOnly}
              onSelectPet={(id) => {
                selectPet(id);
                setIsSidebarOpen(false);
              }}
              onSearchChange={setSearchQuery}
              onFilterChange={setActiveFilter}
              onAnimatedOnlyChange={setShowAnimatedOnly}
              onRarityClick={handleRarityClick}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            <div className="flex-1 relative flex flex-col bg-[#141414] shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] min-w-0">
              {selectedPetData && (
                <PetInfoPanel
                  key={`${selectedPetData.type}:${selectedVariantId ?? 'default'}:${selectedRarityIdx}`}
                  selectedPet={selectedPetData}
                  selectedVariantId={selectedVariantId}
                  selectedRarityIdx={selectedRarityIdx}
                  onRarityChange={selectRarityIdx}
                />
              )}

              <ViewerScene
                textureUrl={activeTextureUrl}
                animation={activeAnimation}
                supportsDayNight={activeVariantSupportDayNight}
                dayNightMode={dayNightMode}
                onToggleDayNight={() => setDayNightMode(dayNightMode === 'day' ? 'night' : 'day')}
              />
            </div>

            {selectedPetData && selectedPetData.variants.length > 0 && (
              <SkinsPanel
                variants={selectedPetData.variants}
                selectedVariantId={selectedVariantId}
                onSelectVariant={(id) => {
                  selectVariant(id);
                }}
                isOpen={isSkinsPanelOpen}
                onToggle={() => setIsSkinsPanelOpen(!isSkinsPanelOpen)}
              />
            )}
          </div>
        ) : (
          <BrowsePage
            onViewIn3D={(petId, skinId) => {
              selectPet(petId);
              selectVariant(skinId);
              navigate('/');
            }}
          />
        )}
        
        <SettingsModal 
          isOpen={isSettingsModalOpen} 
          onClose={() => setIsSettingsModalOpen(false)} 
        />
      </div>
    </TooltipProvider>
  );
}

export default App;
