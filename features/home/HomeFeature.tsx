
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ICONS } from '../../constants';
import { Event } from '../../types';
import { indicaStore, IndicaItem } from '../../lib/indicaStore';
import { HomeCarousel } from '../../components/home/HomeCarousel';
import { HomeEventList } from '../../components/home/HomeEventList';

interface HomeFeatureProps {
  selectedCity: string;
  onOpenConcierge: () => void;
  onEventClick: (eventId: string) => void;
  onNavigate: (tab: string) => void;
  events: Event[];
  isConfigured?: boolean;
}

const HomeSkeleton: React.FC = () => (
  <div className="space-y-12 animate-in fade-in duration-500">
    <div className="space-y-6">
      <div className="h-2 w-24 bg-zinc-900 mx-auto rounded-full"></div>
      <div className="aspect-[16/10] w-full rounded-[2.5rem] bg-zinc-900 overflow-hidden relative">
        <div className="absolute inset-0 animate-shimmer"></div>
      </div>
    </div>
    <div className="space-y-8">
      <div className="h-2 w-32 bg-zinc-900 mx-auto rounded-full"></div>
      {[1, 2].map(i => (
        <div key={i} className="space-y-4">
          <div className="aspect-[16/9] w-full rounded-[2rem] bg-zinc-900 overflow-hidden relative">
            <div className="absolute inset-0 animate-shimmer"></div>
          </div>
          <div className="px-2 space-y-2">
            <div className="h-3 w-1/2 bg-zinc-900 rounded-full"></div>
            <div className="h-2 w-1/3 bg-zinc-900 rounded-full"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const HomeFeature: React.FC<HomeFeatureProps> = ({ selectedCity, onOpenConcierge, onEventClick, onNavigate, events, isConfigured = true }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [indicaItems, setIndicaItems] = useState<IndicaItem[]>(indicaStore.getItems());
  const [isStoreLoaded, setIsStoreLoaded] = useState(indicaStore.getIsLoaded());
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // VANTA_CLARITY: Filtro de Vibe
  const [selectedTag, setSelectedTag] = useState<string>('TODOS');

  // Estados para o Sistema Pull-to-Refresh
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoad(false), 800);
    const unsub = indicaStore.subscribe(() => {
      setIndicaItems(indicaStore.getItems());
      setIsStoreLoaded(indicaStore.getIsLoaded());
    });
    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, []);

  // VANTA_CLARITY: Extração de Tags Únicas dos Eventos da Cidade
  const availableTags = useMemo(() => {
    const cityEvents = events.filter(e => e.city === selectedCity);
    const allTags = cityEvents.flatMap(e => e.vibeTags || []);
    return ['TODOS', ...Array.from(new Set(allTags)).sort()];
  }, [events, selectedCity]);

  const filteredEvents = useMemo(() => {
    let cityEvents = events.filter((event: Event) => event.city === selectedCity);
    
    // Filtro por Vibe Tag
    if (selectedTag !== 'TODOS') {
      cityEvents = cityEvents.filter(e => e.vibeTags?.includes(selectedTag));
    }

    return cityEvents.sort((a, b) => {
        if (!!(a as any).isFeatured && !(b as any).isFeatured) return -1;
        if (!(a as any).isFeatured && !!(b as any).isFeatured) return 1;
        const dateTimeA = new Date(`${a.startDate}T${a.startTime || '00:00'}`).getTime();
        const dateTimeB = new Date(`${b.startDate}T${b.startTime || '00:00'}`).getTime();
        return dateTimeA - dateTimeB;
      });
  }, [events, selectedCity, selectedTag]);

  const filteredIndica: IndicaItem[] = useMemo(() => {
    // VANTA_INDICA_LOGIC: Filtra itens que são globais (city null) OU correspondem à cidade selecionada
    return indicaItems.filter(item => {
      if (!item.city) return true; // Global
      return item.city === selectedCity; // Specific
    });
  }, [indicaItems, selectedCity]);

  useEffect(() => {
    setCurrentSlide(0);
    setSelectedTag('TODOS'); // Reset filtro ao mudar cidade
  }, [selectedCity]);

  useEffect(() => {
    if (filteredIndica.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % filteredIndica.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [filteredIndica.length, currentSlide]); // Adicionado currentSlide para resetar o timer ao interagir manualmente

  // Handlers para o Gesto de Atualização
  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      setStartY(e.touches[0].pageY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === 0 || isRefreshing) return;
    const currentY = e.touches[0].pageY;
    const distance = currentY - startY;
    if (distance > 0 && containerRef.current?.scrollTop === 0) {
      // Aplica resistência ao arrasto (fator 0.4)
      setPullDistance(Math.min(distance * 0.4, 120));
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 80) {
      executeRefresh();
    }
    setPullDistance(0);
    setStartY(0);
  };

  const executeRefresh = () => {
    setIsRefreshing(true);
    // Feedback tátil via vibração (se disponível)
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
    // Dispara evento para o useAppLogic sincronizar tudo
    window.dispatchEvent(new CustomEvent('vanta:refresh'));
    
    // Mantém o estado visual por 2 segundos para confirmação
    setTimeout(() => {
      setIsRefreshing(false);
    }, 2000);
  };

  const handleIndicaClick = (item: IndicaItem) => {
    if (item.type === 'EVENT' && item.eventId) {
      onEventClick(item.eventId);
    } else if (item.type === 'LINK' && item.url) {
      if (item.url === 'NAV_MESSAGES') onOpenConcierge();
      else if (item.url === 'NAV_MAP') onNavigate('map');
      else if (item.url === 'NAV_WALLET') onNavigate('wallet');
      else if (item.url === 'NAV_SEARCH') onNavigate('search');
      else if (item.url === 'NAV_PROFILE') onNavigate('profile');
      else if (item.url === 'NAV_HOME') return;
      else window.open(item.url, '_blank');
    }
  };

  if (isInitialLoad || (!isStoreLoaded && events.length === 0)) {
    return <div className="p-6 h-full overflow-hidden"><HomeSkeleton /></div>;
  }

  return (
    <div 
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="p-6 relative h-full overflow-y-auto no-scrollbar pb-10 animate-in fade-in duration-700"
    >
      {/* Indicador de Sincronização Pull-to-Refresh */}
      <div 
        className="absolute top-0 left-0 right-0 flex flex-col items-center justify-center transition-all duration-300 pointer-events-none z-[200]"
        style={{ 
          height: isRefreshing ? '100px' : `${pullDistance}px`, 
          opacity: isRefreshing ? 1 : Math.min(pullDistance / 80, 1),
          marginTop: isRefreshing ? '20px' : '0px'
        }}
      >
        <div className={`w-10 h-10 rounded-full border border-[#d4af37]/40 bg-black flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-transform ${isRefreshing ? 'animate-spin' : ''}`}>
          <span className="text-[#d4af37] font-serif italic font-black text-lg">V</span>
        </div>
        <span className="text-[6px] text-[#d4af37] font-black uppercase tracking-[0.5em] mt-3 animate-pulse">
          {isRefreshing ? 'SINCRONIZANDO PROTOCOLO...' : 'PUXE PARA ATUALIZAR'}
        </span>
      </div>

      <div 
        className="space-y-12 transition-transform duration-300"
        style={{ transform: `translateY(${isRefreshing ? '80px' : pullDistance > 0 ? `${pullDistance * 0.5}px` : '0px'})` }}
      >
        {/* Renderiza apenas se houver itens para exibir, evitando espaços vazios */}
        {filteredIndica.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-[10px] font-black text-[#d4af37] uppercase tracking-[0.5em] italic text-center">VANTA INDICA</h2>
            <HomeCarousel 
              items={filteredIndica} 
              currentSlide={currentSlide} 
              onItemClick={handleIndicaClick}
              onChange={(index) => setCurrentSlide(index)} 
            />
          </section>
        )}

        {/* VANTA_CLARITY: Filtros de Vibe */}
        {availableTags.length > 1 && (
          <section className="sticky top-0 z-30 py-2 bg-black/80 backdrop-blur-md -mx-6 px-6">
             <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`px-4 py-2 rounded-full text-[7px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                      selectedTag === tag 
                      ? 'bg-white text-black border-white shadow-lg' 
                      : 'bg-zinc-900 text-zinc-500 border-white/5'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
             </div>
          </section>
        )}

        <section className="space-y-8">
          <h2 className="text-[10px] font-black text-[#d4af37] uppercase tracking-[0.5em] italic text-center">
            {selectedTag === 'TODOS' ? 'PRÓXIMOS EVENTOS' : `VIBE: ${selectedTag}`}
          </h2>
          <HomeEventList 
            events={filteredEvents} 
            isConfigured={isConfigured} 
            onEventClick={onEventClick} 
          />
        </section>
      </div>

      <button 
        onClick={onOpenConcierge}
        className="fixed right-6 bottom-28 w-14 h-14 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-full flex items-center justify-center text-white shadow-[0_15px_40px_rgba(0,0,0,0.8)] active:scale-90 transition-all z-[120] hover:border-[#d4af37]/40 group"
        aria-label="Acionar Concierge"
      >
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#d4af37] rounded-full border-2 border-black animate-pulse shadow-[0_0_20px_rgba(212,175,55,0.6)]"></div>
        <ICONS.Message className="w-5 h-5 text-zinc-400 group-hover:text-[#d4af37] transition-colors" />
      </button>
    </div>
  );
};
