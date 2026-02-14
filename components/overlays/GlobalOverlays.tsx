
import React from 'react';
import { User } from '../../types';
import { NotificationOverlay } from '../NotificationOverlay';
import { AuthFeature } from '../../features/Auth/AuthFeature';
import { CitySelector } from '../../features/home/components/CitySelector/CitySelector';

interface GlobalOverlaysProps {
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  setSelectedEventId: (id: string | null) => void;
  handleTabChange: (tab: any) => void;
  blockedFeature: string | null;
  setBlockedFeature: (feature: string | null) => void;
  setShowAuth: (view: 'login' | 'signup' | null) => void;
  showAuth: 'login' | 'signup' | null;
  setCurrentUser: (user: User | null) => void;
  showCitySelector: boolean;
  setShowCitySelector: (show: boolean) => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  availableCities: string[];
}

export const GlobalOverlays: React.FC<GlobalOverlaysProps> = ({
  showNotifications, setShowNotifications, setSelectedEventId, handleTabChange,
  blockedFeature, setBlockedFeature, setShowAuth, showAuth, setCurrentUser,
  showCitySelector, setShowCitySelector, selectedCity, setSelectedCity, availableCities
}) => {
  return (
    <>
      <NotificationOverlay 
        show={showNotifications} 
        onClose={() => setShowNotifications(false)} 
        onEventClick={(eventId) => setSelectedEventId(eventId)}
        setActiveTab={handleTabChange}
      />

      {blockedFeature && (
        <div className="fixed inset-0 z-[6000] bg-black/90 flex items-center justify-center p-10" onClick={() => setBlockedFeature(null)}>
          <div className="bg-zinc-950 border border-white/10 rounded-[3rem] p-10 text-center space-y-8" onClick={e => e.stopPropagation()}>
            <h3 className="text-3xl font-serif italic text-white uppercase">{blockedFeature}</h3>
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Acesso exclusivo para membros.</p>
            <div className="space-y-3">
              <button onClick={() => { setBlockedFeature(null); setShowAuth('login'); }} className="w-full py-5 bg-white text-black font-black rounded-full uppercase text-[10px]">Entrar</button>
              <button onClick={() => { setBlockedFeature(null); setShowAuth('signup'); }} className="w-full py-5 border border-white/10 text-white font-black rounded-full uppercase text-[9px]">Solicitar Acesso</button>
              <button onClick={() => setBlockedFeature(null)} className="w-full py-3 text-zinc-600 font-black uppercase text-[8px] tracking-widest">Talvez mais tarde</button>
            </div>
          </div>
        </div>
      )}

      {showAuth && (
        <div className="fixed inset-0 z-[7000] bg-black">
          <AuthFeature 
            onLoginSuccess={(user) => { setCurrentUser(user); setShowAuth(null); }} 
            initialView={showAuth === 'login' ? 'form' : 'signup'} 
            onClose={() => setShowAuth(null)} 
          />
        </div>
      )}

      <CitySelector 
        show={showCitySelector} 
        onClose={() => setShowCitySelector(false)} 
        selectedCity={selectedCity} 
        onSelectCity={setSelectedCity} 
        availableCities={availableCities} 
      />
    </>
  );
};
