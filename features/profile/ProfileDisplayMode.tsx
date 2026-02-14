import React from 'react';
import { User } from '../../types';
import { ICONS } from '../../constants';
import { WalletFeature } from '../wallet/WalletFeature';
import { VantaAvatar } from '../../components/VantaAvatar';
import { vantaFeedback } from '../../lib/feedbackStore';

interface ProfileDisplayModeProps {
  currentUser: User;
  localData: any;
  activeSubTab: 'perfil' | 'carteira';
  setActiveSubTab: (tab: 'perfil' | 'carteira') => void;
  onEdit: () => void;
  onLogout: () => void;
  onOpenAdmin: () => void;
  isAdmin: boolean;
}

export const ProfileDisplayMode: React.FC<ProfileDisplayModeProps> = ({
  currentUser, localData, activeSubTab, setActiveSubTab,
  onEdit, onLogout, onOpenAdmin, isAdmin
}) => {

  const handleLogoutConfirm = () => {
    vantaFeedback.confirm({
      title: 'Sair do Sistema',
      message: 'Deseja sair do VANTA?',
      confirmLabel: 'Sim, Sair',
      onConfirm: () => {
        onLogout();
        vantaFeedback.toast('success', 'Desconectado', 'Você foi deslogado com sucesso.');
      }
    });
  };

  return (
    <div className="w-full flex flex-col items-center p-8 pt-32 pb-32 animate-in fade-in duration-500 overflow-y-auto no-scrollbar h-full relative">
      <div className="relative mb-8 shrink-0">
        <div className={`w-32 h-32 rounded-full p-1 overflow-hidden relative border ${localData.isPlus ? 'border-[#d4af37]/80 shadow-[0_0_30px_rgba(212,175,55,0.2)]' : 'border-white/10'}`}>
           <VantaAvatar 
            src={localData.avatar} 
            gender={currentUser.gender} 
            alt="Profile" 
           />
        </div>
        {localData.isPlus && (
          <div className="absolute -top-1 -right-1 w-8 h-8 bg-[#d4af37] rounded-full border-4 border-black flex items-center justify-center">
            <ICONS.Star className="w-3 h-3 text-black" />
          </div>
        )}
      </div>
      
      <div className="text-center mb-6 shrink-0">
        <h2 className="text-4xl font-serif italic text-white tracking-tighter uppercase leading-none">{currentUser.fullName}</h2>
        <p className="text-[#d4af37] text-[9px] font-black uppercase tracking-[0.4em] italic mt-2">@{currentUser.instagram}</p>
      </div>

      <div className="flex gap-10 mb-10 border-b border-white/5 w-full justify-center shrink-0">
        <button onClick={() => setActiveSubTab('perfil')} className={`pb-4 text-[9px] font-black uppercase tracking-[0.3em] transition-all relative ${activeSubTab === 'perfil' ? 'text-white' : 'text-zinc-600'}`}>
          Perfil {activeSubTab === 'perfil' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d4af37]"></div>}
        </button>
        <button onClick={() => setActiveSubTab('carteira')} className={`pb-4 text-[9px] font-black uppercase tracking-[0.3em] transition-all relative ${activeSubTab === 'carteira' ? 'text-white' : 'text-zinc-600'}`}>
          Carteira {activeSubTab === 'carteira' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d4af37]"></div>}
        </button>
      </div>

      {activeSubTab === 'perfil' ? (
        <div className="w-full flex flex-col items-center animate-in fade-in duration-300">
          <div className="w-full max-xs text-center mb-12 shrink-0">
             <p className="text-zinc-400 text-[11px] leading-relaxed uppercase tracking-wider font-light">{localData.bio || "SEM BIOGRAFIA DEFINIDA."}</p>
          </div>

          {localData.gallery.filter(Boolean).length > 0 && (
            <div className="w-full space-y-4 mb-12 shrink-0">
              <h4 className="text-[8px] text-zinc-700 font-black uppercase tracking-[0.4em] text-center italic">Galeria</h4>
              <div className="flex gap-2 overflow-x-auto no-scrollbar px-4">
                 {localData.gallery.filter(Boolean).map((img: string, i: number) => (
                   <div key={i} className="w-40 aspect-[4/5] shrink-0 rounded-[2rem] overflow-hidden border border-white/5">
                     <img src={img} className="w-full h-full object-cover transition-all duration-500" alt={`Gallery ${i}`} />
                   </div>
                 ))}
              </div>
            </div>
          )}

          <div className="w-full max-w-xs space-y-4 mb-8 shrink-0">
            {isAdmin && <button onClick={onOpenAdmin} className="w-full py-5 bg-[#d4af37] text-black text-[10px] font-black uppercase rounded-full shadow-[0_0_200px_rgba(212,175,55,0.3)] active:scale-95 transition-all">Painel Administrativo</button>}
            <button onClick={onEdit} className="w-full py-5 bg-white text-black text-[10px] font-black uppercase rounded-full shadow-xl active:scale-95 transition-all">Editar Perfil</button>
            <button onClick={handleLogoutConfirm} className="w-full py-5 border border-white/10 text-white text-[10px] font-black uppercase rounded-full hover:bg-white/5 active:scale-95 transition-all">Sair</button>
          </div>
        </div>
      ) : (
        <div className="w-full animate-in slide-in-from-right duration-300 min-h-[500px]">
          <WalletFeature currentUser={currentUser} embedMode={true} />
        </div>
      )}
    </div>
  );
};