import React, { useState } from 'react';
import { ICONS } from '../../../constants';
import { CommunityType } from '../../../types';
import { VantaUserPicker } from '../../../components/VantaUserPicker';
import { LocationPickerModal } from '../../../components/admin/events/LocationPickerModal';

interface CommunityFormProps {
  view: 'CREATE' | 'EDIT';
  communityForm: any;
  setCommunityForm: (form: any) => void;
  onSubmit: () => void;
  onAddressBlur: () => void;
  logoInputRef: React.RefObject<HTMLInputElement | null>;
  coverInputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>, field: string) => void;
  isGeocoding: boolean;
  isProcessing: boolean;
}

export const CommunityForm: React.FC<CommunityFormProps> = ({
  view, communityForm, setCommunityForm, onSubmit, onAddressBlur,
  logoInputRef, coverInputRef, onFileSelect, isGeocoding, isProcessing
}) => {
  const [showMap, setShowMap] = useState(false);

  return (
    <div className="space-y-12 animate-in slide-in-from-bottom duration-500 pb-40">
       <div className="flex flex-col gap-2">
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">{view === 'CREATE' ? 'PROTOCOLO DE CRIAÇÃO' : 'EDITOR DE UNIDADE'}</h3>
          <p className="text-[24px] font-serif italic text-white tracking-tighter">{view === 'CREATE' ? 'Nova Unidade VANTA' : 'Alterar Protocolos'}</p>
       </div>

       <div className="space-y-4">
          <label className="text-[8px] text-zinc-600 font-black uppercase tracking-widest ml-4">Natureza da Unidade</label>
          <div className="grid grid-cols-2 gap-4">
             {[
               { key: 'BOATE', label: 'Local Fixo', desc: 'Boate / Rooftop', icon: '🏛️' },
               { key: 'PRODUTORA', label: 'Marca Itinerante', desc: 'Labels / Protocolo', icon: '💎' }
             ].map(opt => (
               <button 
                 key={opt.key}
                 onClick={() => setCommunityForm({...communityForm, type: opt.key as CommunityType})}
                 className={`p-6 rounded-[2.5rem] border flex flex-col items-center text-center gap-3 transition-all ${
                   communityForm.type === opt.key 
                   ? 'bg-white text-black border-white shadow-2xl scale-[1.02]' 
                   : 'bg-zinc-900/40 text-zinc-500 border-white/5 hover:border-white/10'
                 }`}
               >
                 <span className="text-3xl">{opt.icon}</span>
                 <div className="flex flex-col gap-1">
                   <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                   <span className="text-[6px] font-black uppercase tracking-[0.2em] opacity-40">{opt.desc}</span>
                 </div>
               </button>
             ))}
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
             <label className="text-[8px] text-zinc-600 font-black uppercase tracking-widest ml-4">Identidade Visual (Logo)</label>
             <div 
               onClick={() => logoInputRef.current?.click()}
               className="aspect-square w-full max-w-[180px] mx-auto bg-zinc-900 border border-dashed border-white/10 rounded-[3rem] overflow-hidden flex flex-col items-center justify-center text-center cursor-pointer group hover:border-[#d4af37]/40 transition-all"
             >
                {communityForm.logo_url ? (
                  <img src={communityForm.logo_url} className="w-full h-full object-cover" alt="Logo" />
                ) : (
                  <div className="p-8 opacity-20 group-hover:opacity-100 transition-opacity">
                    <ICONS.Plus className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-[7px] font-black uppercase tracking-widest block">Upload Logo</span>
                  </div>
                )}
                <input ref={logoInputRef} type="file" accept="image/*" onChange={(e) => onFileSelect(e, 'logo')} className="hidden" />
             </div>
          </div>
          <div className="space-y-4 flex-1">
             <label className="text-[8px] text-zinc-600 font-black uppercase tracking-widest ml-4">Foto de Capa (Banner)</label>
             <div 
               onClick={() => coverInputRef.current?.click()}
               className="aspect-[16/9] w-full bg-zinc-900 border border-dashed border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col items-center justify-center text-center cursor-pointer group hover:border-[#d4af37]/40 transition-all"
             >
                {communityForm.image_url ? (
                  <img src={communityForm.image_url} className="w-full h-full object-cover" alt="Cover" />
                ) : (
                  <div className="p-8 opacity-20 group-hover:opacity-100 transition-opacity">
                    <ICONS.Explore className="w-8 h-8 mx-auto mb-2" />
                    <span className="text-[7px] font-black uppercase tracking-widest block">Carregar Foto de Capa</span>
                  </div>
                )}
                <input ref={coverInputRef} type="file" accept="image/*" onChange={(e) => onFileSelect(e, 'cover')} className="hidden" />
             </div>
          </div>
       </div>

       <div className="space-y-6">
          <div className="space-y-2">
             <label className="text-[8px] text-zinc-600 font-black uppercase tracking-widest ml-4">Nome da Unidade</label>
             <input 
               type="text" value={communityForm.name} onChange={e => setCommunityForm({...communityForm, name: e.target.value})}
               placeholder="EX: BOSQUE BAR / PRIVATE LABEL" className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-5 text-[10px] text-white uppercase outline-none focus:border-white/20"
             />
          </div>
          <div className="space-y-2">
             <label className="text-[8px] text-zinc-600 font-black uppercase tracking-widest ml-4">Responsável pela Unidade (Dono)</label>
             <VantaUserPicker 
               onSelect={(user) => setCommunityForm((prev: any) => ({ ...prev, owner_id: user.id, owner_name: user.full_name || '' }))}
               placeholder={view === 'CREATE' ? "BUSCAR MEMBRO PARA ATRIBUIR COMO DONO..." : "BUSCAR NOVO DONO..."}
             />
             {communityForm.owner_id && (
               <div className="flex items-center gap-3 px-6 py-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl animate-in fade-in">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                  <span className="text-[9px] text-zinc-300 font-black uppercase tracking-widest">
                    Responsável: <span className="text-white">{communityForm.owner_name || communityForm.owner_id}</span>
                  </span>
                  {view === 'CREATE' && (
                    <button 
                      onClick={() => setCommunityForm((prev: any) => ({ ...prev, owner_id: '', owner_name: '' }))}
                      className="ml-auto text-red-500 text-[8px] font-black uppercase tracking-widest"
                    >
                      Remover
                    </button>
                  )}
               </div>
             )}
          </div>
          <div className="space-y-2">
             <label className="text-[8px] text-zinc-600 font-black uppercase tracking-widest ml-4">Bio / Descrição Curta</label>
             <textarea 
               value={communityForm.description} onChange={e => setCommunityForm({...communityForm, description: e.target.value})}
               placeholder="DESCREVA A ESSÊNCIA DESTA UNIDADE..." 
               className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-5 text-[10px] text-white uppercase outline-none focus:border-white/20 h-24 resize-none"
             />
          </div>
          {communityForm.type === 'BOATE' && (
            <div className="space-y-2 animate-in fade-in duration-500">
               <label className="text-[8px] text-zinc-600 font-black uppercase tracking-widest ml-4">Endereço Inteligente (Radar Integration)</label>
               <div className="flex gap-2">
                  <div className="relative flex-[2]">
                      <input 
                        type="text" value={communityForm.address} onChange={e => setCommunityForm({...communityForm, address: e.target.value})}
                        onBlur={onAddressBlur}
                        placeholder="RUA, NÚMERO, BAIRRO..." className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-5 pr-10 text-[10px] text-white uppercase outline-none focus:border-white/20"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                        {isGeocoding && (
                          <div className="w-4 h-4 border border-white/10 border-t-[#d4af37] rounded-full animate-spin"></div>
                        )}
                      </div>
                  </div>
                  <button 
                    onClick={() => setShowMap(true)}
                    className={`flex-1 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all ${communityForm.latitude ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-zinc-900 border-white/5 text-zinc-500 hover:text-white'}`}
                  >
                    <ICONS.MapPin className="w-4 h-4" />
                    <span className="text-[6px] font-black uppercase tracking-widest">{communityForm.latitude ? 'GPS OK' : 'NO MAPA'}</span>
                  </button>
               </div>
            </div>
          )}
       </div>

       <button 
         onClick={onSubmit}
         disabled={isProcessing}
         className={`w-full py-6 text-black text-[11px] font-black uppercase rounded-full shadow-2xl active:scale-95 transition-all ${view === 'CREATE' ? 'bg-[#d4af37]' : 'bg-white'}`}
       >
         {isProcessing ? (view === 'CREATE' ? "Protocolando Unidade..." : "Atualizando...") : (view === 'CREATE' ? "Finalizar Cadastro" : "Atualizar Unidade")}
       </button>

       {/* Modal de Seleção de Local no Mapa */}
       <LocationPickerModal 
        isOpen={showMap} 
        onClose={() => setShowMap(false)}
        onConfirm={(lat, lng) => {
          setCommunityForm({...communityForm, latitude: lat, longitude: lng});
          setShowMap(false);
        }}
        initialLat={communityForm.latitude}
        initialLng={communityForm.longitude}
        city={communityForm.city}
      />
    </div>
  );
};