
import React, { useState, useEffect } from 'react';
import { StaffTemplate, User, Community, EVENT_PERMISSIONS, COMMUNITY_PERMISSIONS } from '../../types';
import { fetchStaffTemplates, createStaffTemplate, deleteStaffTemplate } from '../../lib/staffTemplatesApi';
import { ICONS } from '../../constants';

interface AdminStaffTemplatesProps {
  currentUser: User;
  selectedCommunityId: string | null;
  communities: Community[];
}

export const AdminStaffTemplates: React.FC<AdminStaffTemplatesProps> = ({ currentUser, selectedCommunityId, communities }) => {
  const [templates, setTemplates] = useState<StaffTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    dos: [] as string[],
    donts: [] as string[],
    permissions: {} as Record<string, boolean>,
    isGlobal: false
  });

  const [tempDo, setTempDo] = useState('');
  const [tempDont, setTempDont] = useState('');

  const isMaster = ['admin', 'master', 'vanta_master'].includes(currentUser.role.toLowerCase());

  useEffect(() => {
    loadTemplates();
  }, [selectedCommunityId]);

  const loadTemplates = async () => {
    setIsLoading(true);
    const data = await fetchStaffTemplates(selectedCommunityId);
    setTemplates(data);
    setIsLoading(false);
  };

  const handleCreate = async () => {
    if (!form.name || !form.description) return alert("Preencha o nome e a descrição da função.");
    setIsProcessing(true);
    const success = await createStaffTemplate({
      ...form,
      communityId: form.isGlobal ? null : selectedCommunityId,
    });
    if (success) {
      await loadTemplates();
      setShowForm(false);
      setForm({ name: '', description: '', dos: [], donts: [], permissions: {}, isGlobal: false });
    }
    setIsProcessing(false);
  };

  const togglePermission = (id: string) => {
    setForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [id]: !prev.permissions[id]
      }
    }));
  };

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom duration-500 pb-32">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">PROTOCOLO OPERACIONAL</h3>
          <p className="text-[22px] font-serif italic text-white tracking-tighter uppercase">Funções de Equipe</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-6 py-3 bg-white text-black text-[9px] font-black uppercase rounded-full shadow-lg active:scale-95 transition-all">Nova Função</button>
      </div>

      {showForm && (
        <div className="p-8 bg-zinc-950 border border-[#d4af37]/20 rounded-[3rem] space-y-8 animate-in zoom-in-95 overflow-hidden">
           <h4 className="text-[9px] text-[#d4af37] font-black uppercase tracking-[0.3em] italic">Cadastrar Modelo de Atuação</h4>
           
           <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[8px] text-zinc-600 font-black uppercase tracking-widest ml-4">Nome da Função</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="EX: LIMPEZA / SEGURANÇA VIP" className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-[10px] text-white uppercase outline-none focus:border-[#d4af37]/20" />
              </div>
              <div className="space-y-2">
                <label className="text-[8px] text-zinc-600 font-black uppercase tracking-widest ml-4">Escopo da Função</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="DESCRIÇÃO BREVE DA MISSÃO..." className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-[10px] text-white uppercase outline-none h-20 resize-none" />
              </div>

              {isMaster && (
                <button 
                  onClick={() => setForm({...form, isGlobal: !form.isGlobal})}
                  className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${form.isGlobal ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-black border-white/5'}`}
                >
                  <div className={`w-3 h-3 rounded-full border ${form.isGlobal ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-800'}`}></div>
                  <span className="text-[8px] font-black uppercase text-white">Tornar Função Global (Todas as Unidades)</span>
                </button>
              )}
           </div>

           {/* VANTA_PERMISSIONS: Seletor Granular */}
           <div className="space-y-4">
              <label className="text-[8px] text-zinc-600 font-black uppercase tracking-widest ml-4">Permissões do Dashboard</label>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto no-scrollbar pr-2">
                 {[...COMMUNITY_PERMISSIONS, ...EVENT_PERMISSIONS].map(perm => (
                   <button 
                    key={perm.id}
                    onClick={() => togglePermission(perm.id)}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${form.permissions[perm.id] ? 'bg-white/5 border-[#d4af37]/40' : 'bg-black border-white/5 opacity-40'}`}
                   >
                     <span className="text-[9px] font-black uppercase text-white">{perm.label}</span>
                     {form.permissions[perm.id] && <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></div>}
                   </button>
                 ))}
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                 <label className="text-[8px] text-emerald-500 font-black uppercase tracking-widest ml-4">Do's</label>
                 <div className="flex gap-2">
                    <input type="text" value={tempDo} onChange={e => setTempDo(e.target.value)} placeholder="Ação..." className="flex-1 bg-zinc-900 border border-white/5 rounded-xl p-3 text-[9px] text-white uppercase" />
                    <button onClick={() => { if(tempDo) setForm({...form, dos: [...form.dos, tempDo]}); setTempDo(''); }} className="p-3 bg-white text-black rounded-xl">+</button>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {form.dos.map((d, i) => <span key={i} className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[7px] font-black uppercase rounded-full border border-emerald-500/20">{d}</span>)}
                 </div>
              </div>
              <div className="space-y-4">
                 <label className="text-[8px] text-red-500 font-black uppercase tracking-widest ml-4">Dont's</label>
                 <div className="flex gap-2">
                    <input type="text" value={tempDont} onChange={e => setTempDont(e.target.value)} placeholder="Restrição..." className="flex-1 bg-zinc-900 border border-white/5 rounded-xl p-3 text-[9px] text-white uppercase" />
                    <button onClick={() => { if(tempDont) setForm({...form, donts: [...form.donts, tempDont]}); setTempDont(''); }} className="p-3 bg-white text-black rounded-xl">+</button>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {form.donts.map((d, i) => <span key={i} className="px-3 py-1 bg-red-500/10 text-red-500 text-[7px] font-black uppercase rounded-full border border-red-500/20">{d}</span>)}
                 </div>
              </div>
           </div>

           <div className="flex gap-4">
              <button onClick={handleCreate} disabled={isProcessing} className="flex-1 py-5 bg-[#d4af37] text-black text-[10px] font-black uppercase rounded-full shadow-xl">Salvar Modelo</button>
              <button onClick={() => setShowForm(false)} className="px-8 py-5 border border-white/10 text-zinc-500 text-[10px] font-black uppercase rounded-full">Cancelar</button>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="py-20 flex justify-center"><div className="w-6 h-6 border-2 border-white/10 border-t-[#d4af37] rounded-full animate-spin"></div></div>
        ) : templates.length > 0 ? templates.map(t => (
          <div key={t.id} className="p-6 bg-zinc-900/40 border border-white/5 rounded-[2.5rem] space-y-6 group hover:border-[#d4af37]/20 transition-all">
             <div className="flex justify-between items-start">
                <div className="space-y-1">
                   <div className="flex items-center gap-2">
                      <h4 className="text-white text-[12px] font-black uppercase tracking-widest">{t.name}</h4>
                      {t.isGlobal && <span className="px-2 py-0.5 bg-[#d4af37]/10 text-[#d4af37] text-[6px] font-black rounded-full border border-[#d4af37]/20">GLOBAL</span>}
                   </div>
                   <p className="text-zinc-500 text-[9px] font-medium uppercase tracking-widest">{t.description}</p>
                </div>
                <button onClick={() => deleteStaffTemplate(t.id).then(loadTemplates)} className="p-2 opacity-0 group-hover:opacity-100 text-red-900/40 hover:text-red-500 transition-all"><ICONS.Trash className="w-4 h-4" /></button>
             </div>

             {/* Indicador de Permissões Ativas */}
             <div className="flex flex-wrap gap-1">
                {Object.entries(t.permissions || {}).filter(([_, v]) => v).map(([pk]) => (
                  <span key={pk} className="px-2 py-0.5 bg-black/40 text-zinc-600 text-[5px] font-black uppercase rounded-full border border-white/5">
                    {pk.replace('_', ' ')}
                  </span>
                ))}
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <span className="text-[6px] text-zinc-700 font-black uppercase tracking-widest block ml-2">PODE</span>
                   <div className="space-y-1">
                      {t.dos.map((d, i) => <div key={i} className="text-[8px] text-emerald-500/80 font-black uppercase flex items-center gap-2"><span>✓</span> {d}</div>)}
                   </div>
                </div>
                <div className="space-y-2">
                   <span className="text-[6px] text-zinc-700 font-black uppercase tracking-widest block ml-2">NÃO PODE</span>
                   <div className="space-y-1">
                      {t.donts.map((d, i) => <div key={i} className="text-[8px] text-red-500/80 font-black uppercase flex items-center gap-2"><span>✕</span> {d}</div>)}
                   </div>
                </div>
             </div>
          </div>
        )) : (
          <div className="py-20 text-center border border-dashed border-white/5 rounded-[3rem] opacity-30">
            <p className="text-[8px] text-zinc-500 font-black uppercase">Nenhuma função protocolada.</p>
          </div>
        )}
      </div>
    </div>
  );
};
