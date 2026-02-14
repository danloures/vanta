
import { useState, useEffect, useMemo, useRef } from 'react';
import { Event, User } from '../types';
import { radarStore } from '../lib/radarStore';

// Centrais das Cidades para Fallback Determinístico [Lng, Lat]
export const CITY_CENTERS: Record<string, [number, number]> = {
  'Rio de Janeiro': [-43.1729, -22.9068],
  'São Paulo': [-46.6333, -23.5505],
  'Belo Horizonte': [-43.9378, -19.9217],
  'Brasília': [-47.8828, -15.7941],
  'Salvador': [-38.5016, -12.9777],
  'Trancoso': [-39.0914, -16.5911],
  'Búzios': [-41.8869, -22.7561],
  'Angra dos Reis': [-44.3182, -23.0067]
};

export const RJ_FALLBACK: [number, number] = [-43.1729, -22.9068];

export const useRadarLogic = (events: Event[], currentUser: User | null | undefined) => {
  // VANTA_RADAR_SYNC: Inicializa com base no cache de soberania
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>(radarStore.permissionStatus);
  const [selectedDate, setSelectedDate] = useState<Date>(radarStore.selectedDate);
  const [showCalendar, setShowCalendar] = useState(false);
  const [previewEventId, setPreviewEventId] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(radarStore.lastCoords);
  const [initStage, setInitStage] = useState<string>("init");
  const [lastError, setLastError] = useState<string>("");

  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);

  const getEventDateStr = (e: Event): string | null => {
    const anyE = e as any;
    return anyE.startDate ?? anyE.start_date ?? anyE.startDateStr ?? null;
  };

  const getEventCoords = (event: Event): [number, number] => {
    const anyE = event as any;
    const lat = anyE.latitude ?? anyE.lat;
    const lng = anyE.longitude ?? anyE.lng;
    
    if (typeof lat === 'number' && typeof lng === 'number') return [lng, lat];
    
    const center = CITY_CENTERS[event.city] || RJ_FALLBACK;
    const hash = event.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const jitterX = ((hash % 100) - 50) / 4000;
    const jitterY = (((hash * 7) % 100) - 50) / 4000;
    return [center[0] + jitterX, center[1] + jitterY];
  };

  const loadLeaflet = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).L) return resolve((window as any).L);
      const cssId = 'leaflet-css';
      if (!document.getElementById(cssId)) {
        const link = document.createElement('link');
        link.id = cssId; link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      const scriptId = 'leaflet-js';
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      const timeout = setTimeout(() => reject(new Error("Leaflet timeout")), 8000);
      script.onload = () => { clearTimeout(timeout); resolve((window as any).L); };
      script.onerror = () => { clearTimeout(timeout); reject(new Error("Leaflet load error")); };
      document.head.appendChild(script);
    });
  };

  const initMap = async (initialCoords: [number, number], container: HTMLDivElement | null) => {
    if (!container || mapInstance.current) return;
    try {
      setInitStage("loading");
      const L = await loadLeaflet();
      const startPos: [number, number] = [initialCoords[1], initialCoords[0]];
      mapInstance.current = L.map(container, { zoomControl: false, attributionControl: false }).setView(startPos, 14);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19, subdomains: 'abcd' }).addTo(mapInstance.current);
      mapInstance.current.on('click', () => setPreviewEventId(null));
      setMapLoaded(true); setInitStage("ready");
    } catch (err: any) { setLastError(err.message); setInitStage("failed"); }
  };

  const requestLocation = (container: HTMLDivElement | null) => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
          setUserCoords(coords); 
          setPermissionStatus('granted'); 
          radarStore.setPermission('granted');
          radarStore.setCoords(coords);
          initMap(coords, container);
        },
        () => { 
          setPermissionStatus('denied'); 
          radarStore.setPermission('denied');
          initMap(CITY_CENTERS['Rio de Janeiro'] || RJ_FALLBACK, container); 
        },
        { timeout: 8000 }
      );
    } else { 
      setPermissionStatus('denied'); 
      radarStore.setPermission('denied');
      initMap(RJ_FALLBACK, container); 
    }
  };

  const recenterMap = () => {
    if (permissionStatus === 'denied') return;
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        setUserCoords(coords);
        radarStore.setCoords(coords);
        if (mapInstance.current) mapInstance.current.setView([coords[1], coords[0]], 14, { animate: true });
      }, () => {}, { timeout: 5000 });
    }
  };

  const handleDateChange = (date: Date) => { 
    setSelectedDate(date); 
    radarStore.setSelectedDate(date); 
    setPreviewEventId(null); 
  };

  const isEventLiveNow = (event: Event) => {
    const now = new Date();
    const start = new Date(`${event.startDate}T${event.startTime || '00:00'}`);
    let end = new Date(`${event.startDate}T${event.endTime || '23:59'}`);
    if (end < start) end.setDate(end.getDate() + 1);
    return now >= start && now <= end;
  };

  const filteredEvents = useMemo(() => {
    const dStr = selectedDate.toISOString().split('T')[0];
    return events.filter(e => { const dateStr = getEventDateStr(e); return dateStr === dStr; });
  }, [events, selectedDate]);

  // Sync Markers
  useEffect(() => {
    if (!mapLoaded || !mapInstance.current) return;
    const L = (window as any).L;
    if (!L) return;
    markersRef.current.forEach(m => m.remove()); markersRef.current = [];
    filteredEvents.forEach(event => {
      const coords = getEventCoords(event);
      if (coords) {
        const isLive = isEventLiveNow(event);
        const el = document.createElement('div');
        el.className = `w-10 h-10 bg-zinc-900 border ${isLive ? 'border-[#d4af37]' : 'border-white/20'} rounded-xl overflow-hidden shadow-[0_4px_12px_rgba(212,175,55,0.4)] cursor-pointer active:scale-95 transition-all flex items-center justify-center relative`;
        
        let liveIndicator = '';
        if (isLive) {
          liveIndicator = `
            <div class="absolute inset-[-4px] rounded-xl border-2 border-[#d4af37]/40 animate-pulse z-[-1]"></div>
            <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#d4af37] px-1 rounded-full whitespace-nowrap shadow-xl">
              <span class="text-[5px] text-black font-black uppercase tracking-tighter">ACONTECENDO AGORA</span>
            </div>
          `;
        }

        el.innerHTML = `${liveIndicator}
          <img src="${event.image}" class="w-full h-full object-cover" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';" />
          <div class="vanta-fallback w-full h-full hidden items-center justify-center bg-zinc-950"><span class="text-[12px] font-serif italic text-[#d4af37] font-bold">V</span></div>`;
        
        const icon = L.divIcon({ html: el.outerHTML, className: '', iconSize: [40, 40], iconAnchor: [20, 20] });
        const marker = L.marker([coords[1], coords[0]], { icon }).addTo(mapInstance.current);
        marker.on('click', (e: any) => { L.DomEvent.stopPropagation(e); setPreviewEventId(event.id); });
        markersRef.current.push(marker);
      }
    });
  }, [filteredEvents, mapLoaded]);

  // Sync User Marker
  useEffect(() => {
    if (!mapLoaded || !mapInstance.current || !userCoords) return;
    const L = (window as any).L;
    if (!L) return;
    if (userMarkerRef.current) userMarkerRef.current.remove();
    const el = document.createElement('div'); el.className = 'relative w-8 h-8 flex items-center justify-center';
    el.innerHTML = `<div class="absolute inset-0 rounded-full bg-[#d4af37]/40 animate-ping"></div><div class="relative w-full h-full rounded-full border-2 border-white p-0.5 bg-black overflow-hidden z-10 flex items-center justify-center"><img src="${currentUser?.avatar || ''}" class="w-full h-full object-cover rounded-full" /></div>`;
    const icon = L.divIcon({ html: el.outerHTML, className: '', iconSize: [32, 32], iconAnchor: [16, 16] });
    userMarkerRef.current = L.marker([userCoords[1], userCoords[0]], { icon }).addTo(mapInstance.current);
  }, [mapLoaded, userCoords, currentUser?.avatar]);

  return {
    permissionStatus, setPermissionStatus, selectedDate, setSelectedDate,
    showCalendar, setShowCalendar, previewEventId, setPreviewEventId,
    mapLoaded, userCoords, initStage, lastError,
    requestLocation, recenterMap, handleDateChange, filteredEvents, isEventLiveNow,
    initMap
  };
};
