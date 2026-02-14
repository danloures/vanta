
import React, { useState, useRef } from 'react';
import { IndicaItem } from '../../lib/indicaStore';

interface HomeCarouselProps {
  items: IndicaItem[];
  currentSlide: number;
  onItemClick: (item: IndicaItem) => void;
  onChange?: (index: number) => void;
}

export const HomeCarousel: React.FC<HomeCarouselProps> = ({ items, currentSlide, onItemClick, onChange }) => {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    // Limita o arrasto visual para não sair muito da tela
    if (Math.abs(diff) < 150) {
      setDragOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    if (Math.abs(dragOffset) > 50 && onChange) {
      if (dragOffset < 0) {
        // Swipe Left -> Next
        onChange((currentSlide + 1) % items.length);
      } else {
        // Swipe Right -> Prev
        onChange((currentSlide - 1 + items.length) % items.length);
      }
    }
    
    // Reset visual com um pequeno delay para a animação de saída acontecer se houve troca, 
    // ou retorno elástico se não houve
    setDragOffset(0);
  };

  if (items.length === 0) {
    return (
      <div className="aspect-[16/10] w-full rounded-[2.5rem] bg-zinc-950/20 border border-dashed border-white/5 flex items-center justify-center opacity-40">
        <p className="text-zinc-700 text-[8px] font-black uppercase tracking-widest italic">Curadoria em tempo real...</p>
      </div>
    );
  }

  return (
    <div 
      className="relative aspect-[16/10] w-full rounded-[2.5rem] bg-zinc-900/40 border border-white/10 overflow-hidden cursor-pointer shadow-2xl touch-pan-y"
      onClick={() => !isDragging && Math.abs(dragOffset) < 5 && onItemClick(items[currentSlide])}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Container interno que reage ao arrasto */}
      <div 
        className="w-full h-full relative"
        style={{ 
          transform: `translateX(${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' 
        }}
      >
        {items.map((item, index) => (
          <div 
            key={item.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          >
            {/* Camada 1: Imagem (Fundo) - Z-0 */}
            <img 
              src={item.image} 
              alt={item.title} 
              className="w-full h-full object-cover brightness-[0.4] pointer-events-none select-none relative z-0" 
            />
            
            {/* Camada 2: Texto e Gradiente (Frente) - Z-20 Forçado */}
            <div className="absolute inset-0 p-8 flex flex-col justify-end bg-gradient-to-t from-black via-black/40 to-transparent z-20 pointer-events-none">
              <span className="text-[7px] text-[#d4af37] font-black uppercase tracking-[0.4em] mb-2 drop-shadow-md">
                {item.tag || 'VANTA INDICA'}
              </span>
              <h3 className="text-white text-xl font-serif italic tracking-tighter uppercase leading-tight max-w-[90%] drop-shadow-lg">
                {item.title}
              </h3>
              
              {/* Fallback de descrições para itens hardcoded do sistema */}
              {item.id === 'fallback-chave' && <p className="text-[8px] text-zinc-300 font-black uppercase tracking-widest mt-2">Explore os melhores lugares onde a elite se encontra.</p>}
              {item.id === 'fallback-social' && <p className="text-[8px] text-zinc-300 font-black uppercase tracking-widest mt-2">Encontre e conecte-se com membros aprovados pelo conselho.</p>}
              {item.id === 'fallback-wallet' && <p className="text-[8px] text-zinc-300 font-black uppercase tracking-widest mt-2">Seus convites e entradas organizados com total agilidade.</p>}
              {item.id === 'fallback-profile' && <p className="text-[8px] text-zinc-300 font-black uppercase tracking-widest mt-2">Molde sua presença e gerencie sua conta exclusiva.</p>}
            </div>
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <div className="absolute bottom-6 right-8 flex gap-2 z-30 pointer-events-none">
          {items.map((_, index) => (
            <div key={index} className={`h-1 rounded-full transition-all duration-500 shadow-lg ${index === currentSlide ? 'w-6 bg-white' : 'w-1 bg-white/20'}`} />
          ))}
        </div>
      )}
    </div>
  );
};
