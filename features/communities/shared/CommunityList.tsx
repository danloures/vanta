
import React from 'react';
import { Community } from '../../../types';

interface CommunityListProps {
  communities: Community[];
  isLoading: boolean;
  isMaster: boolean;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onCreate: () => void;
}

export const CommunityList: React.FC<CommunityListProps> = ({
  communities, isLoading, isMaster, onSelect, onEdit, onCreate
}) => {
  return (
    <div className="space-y-10 animate-in slide-in-from-bottom duration-500">
      <div className="flex justify-between items-center">
         <div className="flex flex-col gap-1">
           <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">GESTÃO DE UNIDADES</h3>
           <p className="text-[20px] font-serif italic text-white tracking-tighter">Minhas Comunidades ({communities.length})</p>
         </div>
         {isMaster && (
           <button 
             onClick={onCreate} 
             className="px-6 py-3 bg-white text-black text-[9px] font-black uppercase rounded-full shadow-lg active:scale-95 transition-all"
           >
             Nova Unidade
           </button>
         )}
      </div>
      
      {isLoading ? (
        <div className="py-24 flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-white/10 border-t-[#d4af37] rounded-full animate-spin"></div>
          <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">Sincronizando com a Nuvem...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {communities.map(comm => (
            <div key={comm.id} className="bg-zinc-950 border border-white/5 rounded-[3rem] overflow-hidden flex flex-col shadow-2xl group transition-all hover:border-[#d4af37]/20">
              <div className="relative aspect-[16/9] w-full overflow-hidden">
                <img src={comm.image_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100" alt={comm.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                <div className="absolute top-6 left-6">
                  <div className="w-16 h-16 rounded-2xl border-2 border-white/10 p-1 bg-black/40 backdrop-blur-xl overflow-hidden">
                    <img src={comm.logo_url} className="w-full h-full object-cover rounded-xl" alt="Logo" />
                  </div>
                </div>
                <div className="absolute bottom-6 left-8 right-8">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-[#d4af37] text-black text-[8px] font-black uppercase tracking-widest rounded-full">{comm.type}</span>
                    {!comm.is_active && <span className="px-3 py-1 bg-red-600 text-white text-[8px] font-black uppercase tracking-widest rounded-full">Desativada</span>}
                  </div>
                  <h4 className="text-3xl font-serif italic text-white tracking-tighter uppercase">{comm.name}</h4>
                  
                  {/* Selo de Responsável [VANTA_AUTH] */}
                  <div className="mt-3 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full border border-[#d4af37]/40 p-0.5 overflow-hidden bg-zinc-900 shrink-0">
                      <img src={comm.owner_avatar || ''} className="w-full h-full object-cover rounded-full" alt="" />
                    </div>
                    <span className="text-[7px] text-zinc-400 font-black uppercase tracking-[0.3em]">
                      RESPONSÁVEL: <span className="text-white">{comm.owner_name || 'Protocolando...'}</span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-3 gap-4 border-b border-white/5 pb-8">
                  <div className="space-y-1">
                    <span className="text-[7px] text-zinc-600 font-black uppercase tracking-widest">Eventos</span>
                    <p className="text-xl font-serif italic text-white">{comm.stats?.eventCount || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[7px] text-zinc-600 font-black uppercase tracking-widest">Membros</span>
                    <p className="text-xl font-serif italic text-white">{comm.stats?.totalRsvps || 0}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <span className="text-[7px] text-zinc-600 font-black uppercase tracking-widest">Receita Bruta</span>
                    <p className="text-xl font-serif italic text-[#d4af37]">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(comm.stats?.totalRevenue || 0)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">Endereço Base</span>
                    <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mt-1 truncate max-w-[200px]">{comm.address}</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onEdit(comm.id)}
                      className="p-4 bg-zinc-900 border border-white/5 rounded-2xl text-white active:scale-95 transition-all"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>
                    </button>
                    <button 
                      onClick={() => onSelect(comm.id)}
                      className="px-6 py-4 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all shadow-xl"
                    >
                      Gestão Full
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
