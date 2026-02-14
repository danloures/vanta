
import React, { useEffect, useRef, useState } from 'react';
import { CITY_CENTERS, RJ_FALLBACK } from '../../../hooks/useRadarLogic';

interface LocationPickerModalProps {
  isOpen: boolean;
  initialLat?: number | null;
  initialLng?: number | null;
  city?: string;
  onConfirm: (lat: number, lng: number) => void;
  onClose: () => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen, initialLat, initialLng, city, onConfirm, onClose
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [selectedPos, setSelectedPos] = useState<[number, number] | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sincroniza estado local quando as props mudam
  useEffect(() => {
    if (initialLat && initialLng) setSelectedPos([initialLat, initialLng]);
  }, [initialLat, initialLng, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    let pollInterval: any = null;

    const cleanupMap = () => {
      if (mapInstance.current) {
        try {
          mapInstance.current.off();
          mapInstance.current.remove();
        } catch (e) {
          console.warn("Erro ao limpar mapa:", e);
        }
        mapInstance.current = null;
        markerRef.current = null;
        setIsMapReady(false);
      }
    };

    const initMap = () => {
      if (!isMounted) return;
      if (!mapContainer.current) return;
      
      // Prevenção de dupla inicialização (React Strict Mode)
      if (mapInstance.current) {
        cleanupMap();
      }

      try {
        const L = (window as any).L;
        if (!L) {
          setErrorMsg("Biblioteca de mapas não carregada.");
          return;
        }

        let center: [number, number] = RJ_FALLBACK;
        // Lógica de centro: Prioridade (Coords Iniciais) > (Cidade) > (Fallback)
        if (initialLat && initialLng) {
          center = [initialLat, initialLng];
        } else if (city && CITY_CENTERS[city]) {
          // CITY_CENTERS é [lng, lat], Leaflet pede [lat, lng]
          center = [CITY_CENTERS[city][1], CITY_CENTERS[city][0]];
        }

        const map = L.map(mapContainer.current, { 
          zoomControl: false,
          attributionControl: false 
        }).setView(center, 15);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          subdomains: 'abcd'
        }).addTo(map);

        // Helper para criar marcador arrastável (exclusivo deste modal)
        const createMarker = (lat: number, lng: number) => {
          const el = document.createElement('div');
          // Cursor pointer/grab para indicar interatividade
          el.className = 'w-6 h-6 bg-[#d4af37] rounded-full border-2 border-white shadow-xl cursor-grab active:cursor-grabbing';
          const icon = L.divIcon({ html: el.outerHTML, className: '', iconSize: [24, 24], iconAnchor: [12, 12] });
          
          const marker = L.marker([lat, lng], { 
            icon,
            draggable: true, // VANTA_UPDATE: Permite arrastar conforme solicitado
            autoPan: true
          }).addTo(map);

          // Listener de arrasto para atualizar a posição
          marker.on('dragend', (evt: any) => {
            const { lat: newLat, lng: newLng } = evt.target.getLatLng();
            setSelectedPos([newLat, newLng]);
          });

          return marker;
        };

        // Click Handler (Mover pino ao clicar)
        map.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          setSelectedPos([lat, lng]);
          
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            markerRef.current = createMarker(lat, lng);
          }
        });

        // Inicialização do Marcador
        if (initialLat && initialLng) {
           // Modo Edição: Usa o local salvo
           markerRef.current = createMarker(initialLat, initialLng);
        } else {
           // Modo Criação: Tenta pegar o GPS do Admin
           if ("geolocation" in navigator) {
             navigator.geolocation.getCurrentPosition((pos) => {
               const { latitude, longitude } = pos.coords;
               
               // Só atualiza se o usuário ainda não tiver clicado no mapa
               if (!markerRef.current && isMounted) {
                 map.flyTo([latitude, longitude], 16, { animate: true, duration: 1.5 });
                 markerRef.current = createMarker(latitude, longitude);
                 setSelectedPos([latitude, longitude]);
               }
             }, (err) => {
               console.warn("GPS indisponível no picker:", err);
             }, { timeout: 5000, enableHighAccuracy: true });
           }
        }

        mapInstance.current = map;
        setIsMapReady(true);
        // Força repaint para evitar tiles cinzas
        setTimeout(() => {
          map.invalidateSize();
        }, 250);

      } catch (err: any) {
        console.error("Erro crítico ao iniciar mapa:", err);
        setErrorMsg("Falha ao renderizar mapa.");
      }
    };

    // Lógica de Carregamento de Script
    const loadScript = () => {
      if ((window as any).L) {
        initMap();
        return;
      }

      const scriptId = 'leaflet-script-vanta';
      if (!document.getElementById(scriptId)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
        
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.onload = () => {
          if (isMounted) initMap();
        };
        script.onerror = () => {
          if (isMounted) setErrorMsg("Erro de rede ao carregar mapa.");
        };
        document.head.appendChild(script);
      } else {
        // Script existe mas L pode não estar pronto (Race Condition)
        pollInterval = setInterval(() => {
          if ((window as any).L) {
            clearInterval(pollInterval);
            if (isMounted) initMap();
          }
        }, 100);
      }
    };

    loadScript();

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
      cleanupMap();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-zinc-950 border border-white/10 rounded-[3rem] overflow-hidden flex flex-col shadow-2xl h-[70vh]">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/40">
          <div className="flex flex-col">
            <h3 className="text-white text-[12px] font-black uppercase tracking-widest">Ajuste de Radar</h3>
            <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Arraste o pino para o local exato</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors text-[9px] font-black uppercase tracking-widest">Fechar</button>
        </div>
        <div className="flex-1 relative bg-zinc-900">
          <div ref={mapContainer} className="absolute inset-0" />
          
          {/* Estado de Carregamento / Erro */}
          {!isMapReady && !errorMsg && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10">
              <div className="w-8 h-8 border-2 border-white/10 border-t-[#d4af37] rounded-full animate-spin"></div>
            </div>
          )}
          {errorMsg && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-20 p-6 text-center">
              <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">{errorMsg}</p>
            </div>
          )}

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000]">
             <button 
               onClick={() => selectedPos && onConfirm(selectedPos[0], selectedPos[1])}
               disabled={!selectedPos}
               className="px-8 py-4 bg-[#d4af37] text-black font-black uppercase text-[10px] rounded-full shadow-xl disabled:opacity-50 disabled:scale-95 active:scale-95 transition-all tracking-widest"
             >
               Confirmar Local
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
