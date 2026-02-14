
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { ICONS } from '../../constants';
import { VantaUserPicker } from '../VantaUserPicker';
import { MemberProfile, updateMemberRole, searchMembers } from '../../lib/membersApi';
import { fetchStaffTemplates } from '../../lib/staffTemplatesApi';
import { StaffTemplate, User } from '../../types';
import { VantaAvatar } from '../VantaAvatar';
import { vantaFeedback } from '../../lib/feedbackStore';

interface AdminTeamManagementProps {
  currentUser: User;
}

export const AdminTeamManagement: React.FC<AdminTeamManagementProps> = ({ currentUser }) => {
  const [team, setTeam] = useState<MemberProfile[]>([]);
  const [templates, setTemplates] = useState<StaffTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRecruitModal, setShowRecruitModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<MemberProfile | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // 1. Carrega subordinados (Qualquer um que não seja user comum ou Master principal)
      const { data: members } = await supabase
        .from('profiles')
        .select('*')
        .not('role', 'eq', 'user')
        .not('role', 'eq', 'master');
      
      setTeam(members || []);

      // 2. Carrega templates globais
      const globalTemplates = await fetchStaffTemplates(null);
      setTemplates(globalTemplates.filter(t => t.isGlobal));

    } catch (err) {
      console.error("[VANTA TEAM] Erro ao carregar time:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromote = async () => {
    if (!selectedCandidate || !selectedTemplateId) return;
    
    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) return;

    vantaFeedback.confirm({
      title: 'Promover Membro',
      message: `Confirmar acesso administrativo para ${selectedCandidate.full_name} com a função ${template.name}?`,
      confirmLabel: 'Confirmar Promoção',
      onConfirm: async () => {
        setIsProcessing(true);
        // VANTA_PERMISSIONS: A role é vanta_staff, mas as permissões booleanas são herdadas do template
        const success = await updateMemberRole(
          selectedCandidate.id, 
          'vanta_staff', 
          template.permissions || {}
        );
        
        if (success) {
          await loadInitialData();
          setShowRecruitModal(false);
          setSelectedCandidate(null);
          setSelectedTemplateId('');
          vantaFeedback.toast('success', 'Promoção Realizada', `${selectedCandidate.full_name} agora possui acesso granular.`);
        } else {
          vantaFeedback.toast('error', 'Erro', "Falha ao atualizar protocolo de acesso.");
        }
        setIsProcessing(false);
      }
    });
  };

  const handleDemote = async (member: MemberProfile) => {
    vantaFeedback.confirm({
      title: 'Revogar Acesso',
      message: `Revogar o acesso de ${member.full_name}? Ele voltará a ser um membro comum.`,
      confirmLabel: 'Revogar e Remover',
      isDestructive: true,
      onConfirm: async () => {
        setIsProcessing(true);
        const success = await updateMemberRole(member.id, 'user', {});
        if (success) {
          setTeam(prev => prev.filter(m => m.id !== member.id));
          vantaFeedback.toast('info', 'Acesso Revogado', 'O membro foi removido da equipe.');
        }
        setIsProcessing(false);
      }
    });
  };

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom duration-500 pb-32">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 italic">EQUIPE SOBERANA</h3>
          <p className="text-[22px] font-serif italic text-white tracking-tighter uppercase">Gestão de Time Master</p>
        </div>
        <button 
          onClick={() => setShowRecruitModal(true)} 
          className="px-6 py-3 bg-white text-black text-[9px] font-black uppercase rounded-full shadow-lg active:scale-95 transition-all"
        >
          Recrutar Subordinado
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="py-20 flex justify-center"><div className="w-6 h-6 border-2 border-white/10 border-t-[#d4af37] rounded-full animate-spin"></div></div>
        ) : team.length > 0 ? team.map(member => (
          <div key={member.id} className="p-6 bg-zinc-900/40 border border-white/5 rounded-[2.5rem] flex items-center gap-6 group hover:border-[#d4af37]/20 transition-all">
            <div className="w-14 h-14 rounded-full border border-white/10 p-0.5 overflow-hidden bg-zinc-900">
               <VantaAvatar src={member.avatar_url} gender={member.gender} />
            </div>
            <div className="flex-1 min-w-0">
               <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-white text-[12px] font-black uppercase tracking-widest truncate">{member.full_name}</h4>
                  <span className="px-2 py-0.5 bg-[#d4af37]/10 text-[#d4af37] text-[6px] font-black rounded-full border border-[#d4af37]/20 uppercase">
                    {member.role?.replace('_', ' ')}
                  </span>
               </div>
               <p className="text-zinc-600 text-[9px] font-black uppercase tracking-widest truncate">@{member.instagram_handle}</p>
               
               {/* Visualização de Permissões Ativas no Perfil */}
               <div className="flex flex-wrap gap-1 mt-2">
                  {Object.entries(member.permissions || {}).filter(([_, v]) => v).slice(0, 3).map(([k]) => (
                    <span key={k} className="text-[5px] text-zinc-500 uppercase tracking-tighter">● {k.replace('_', ' ')}</span>
                  ))}
                  {Object.values(member.permissions || {}).filter(v => v).length > 3 && <span className="text-[5px] text-zinc-500 uppercase">...</span>}
               </div>
            </div>
            <button 
              onClick={() => handleDemote(member)}
              className="p-3 text-red-900 opacity-20 group-hover:opacity-100 hover:text-red-500 transition-all"
            >
               <ICONS.Trash className="w-4 h-4" />
            </button>
          </div>
        )) : (
          <div className="py-20 text-center border border-dashed border-white/5 rounded-[3rem] opacity-30">
            <p className="text-[8px] text-zinc-500 font-black uppercase">Você ainda não recrutou subordinados globais.</p>
          </div>
        )}
      </div>

      {/* MODAL DE RECRUTAMENTO */}
      {showRecruitModal && (
        <div className="fixed inset-0 z-[11000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="w-full max-sm bg-zinc-950 border border-white/10 rounded-[3.5rem] p-10 space-y-8 shadow-2xl relative overflow-hidden">
            <header className="text-center space-y-2">
               <span className="text-[8px] text-[#d4af37] font-black uppercase tracking-[0.5em] italic">PROTOCOLO DE RECRUTAMENTO</span>
               <h3 className="text-2xl font-serif italic text-white uppercase tracking-tighter">Promover Membro</h3>
            </header>

            {!selectedCandidate ? (
              <div className="space-y-4 animate-in slide-in-from-top">
                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest text-center leading-relaxed">
                  Pesquise um membro verificado para elevar seu nível de acesso na plataforma.
                </p>
                <VantaUserPicker onSelect={setSelectedCandidate} placeholder="BUSCAR NA REDE..." />
              </div>
            ) : (
              <div className="space-y-8 animate-in zoom-in-95">
                 <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full border border-[#d4af37]/30 p-1 overflow-hidden bg-zinc-900 shadow-xl">
                       <VantaAvatar src={selectedCandidate.avatar_url} gender={selectedCandidate.gender} />
                    </div>
                    <div className="text-center">
                       <h4 className="text-white text-sm font-black uppercase">{selectedCandidate.full_name}</h4>
                       <p className="text-zinc-500 text-[9px] font-black uppercase">@{selectedCandidate.instagram_handle}</p>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[8px] text-zinc-600 font-black uppercase tracking-widest ml-4">Atribuir Função Master</label>
                    <select 
                      value={selectedTemplateId} 
                      onChange={e => setSelectedTemplateId(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-5 text-[10px] text-white uppercase outline-none focus:border-[#d4af37]/30"
                    >
                      <option value="">SELECIONE UM TEMPLATE...</option>
                      {templates.map(t => <option key={t.id} value={t.id}>{t.name.toUpperCase()}</option>)}
                    </select>
                    {templates.length === 0 && (
                      <p className="text-[7px] text-red-500 font-black uppercase tracking-widest ml-4 italic">
                        AVISO: Você não possui templates globais criados.
                      </p>
                    )}
                 </div>

                 <div className="flex gap-4">
                    <button 
                      onClick={handlePromote}
                      disabled={isProcessing || !selectedTemplateId}
                      className="flex-1 py-5 bg-white text-black text-[10px] font-black uppercase rounded-full shadow-2xl active:scale-95 disabled:opacity-20"
                    >
                      {isProcessing ? "Efetivando..." : "Confirmar Efetivação"}
                    </button>
                    <button onClick={() => setSelectedCandidate(null)} className="px-6 py-5 border border-white/10 text-zinc-500 text-[10px] font-black uppercase rounded-full">Trocar</button>
                 </div>
              </div>
            )}

            <button 
              onClick={() => { setShowRecruitModal(false); setSelectedCandidate(null); }} 
              className="w-full py-4 text-zinc-700 text-[8px] font-black uppercase tracking-[0.3em] text-center"
            >
              CANCELAR PROTOCOLO
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
