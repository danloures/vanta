
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { ICONS } from '../../constants';
import { VantaUserPicker } from '../VantaUserPicker';
import { MemberProfile } from '../../lib/membersApi';
import { fetchStaffTemplates } from '../../lib/staffTemplatesApi';
import { fetchUnitStaff, grantCommunityAccess, revokeCommunityAccess } from '../../lib/communityStaffApi';
import { StaffTemplate, User } from '../../types';
import { VantaAvatar } from '../VantaAvatar';
import { createAuditLog } from '../../lib/auditApi';
import { vantaFeedback } from '../../lib/feedbackStore';

interface UnitStaffManagementProps {
  communityId: string;
  currentUser: User;
  onBack: () => void;
}

export const UnitStaffManagement: React.FC<UnitStaffManagementProps> = ({ communityId, currentUser, onBack }) => {
  const [unitStaff, setUnitStaff] = useState<any[]>([]);
  const [templates, setTemplates] = useState<StaffTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<MemberProfile | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, [communityId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Carrega apenas membros VINCULADOS a esta unidade
      const staff = await fetchUnitStaff(communityId);
      setUnitStaff(staff);

      // 2. Carrega templates (Globais + Locais da Unidade)
      const availableTemplates = await fetchStaffTemplates(communityId);
      setTemplates(availableTemplates);

    } catch (err) {
      console.error("[VANTA UNIT STAFF] Erro:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrantAccess = async () => {
    if (!selectedUser || !selectedTemplateId) return;
    
    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) return;

    vantaFeedback.confirm({
      title: 'Delegar Acesso',
      message: `Confirmar acesso administrativo para ${selectedUser.full_name} como ${template.name}?`,
      confirmLabel: 'Confirmar Delegação',
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          // Vínculo atômico com a Unidade
          const success = await grantCommunityAccess(
            communityId,
            selectedUser.id,
            template
          );
          
          if (success) {
            await createAuditLog({
              communityId,
              action: 'GRANT_UNIT_ACCESS',
              category: 'STAFF',
              targetId: selectedUser.id,
              details: { templateName: template.name }
            });

            await loadData();
            setShowAddModal(false);
            setSelectedUser(null);
            setSelectedTemplateId('');
            vantaFeedback.toast('success', 'Acesso Delegado', `${selectedUser.full_name} agora é ${template.name}.`);
          }
        } catch (err) {
          vantaFeedback.toast('error', 'Falha na Delegação', 'Ocorreu um erro no protocolo.');
        } finally {
          setIsProcessing(false);
        }
      }
    });
  };

  const handleRevokeAccess = async (member: any) => {
    vantaFeedback.confirm({
      title: 'Revogar Jurisdição',
      message: `Revogar o acesso de ${member.full_name}? Ele voltará a ser um membro comum.`,
      confirmLabel: 'Revogar Acesso',
      isDestructive: true,
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          const success = await revokeCommunityAccess(communityId, member.id);
          if (success) {
            await createAuditLog({
              communityId,
              action: 'REVOKE_UNIT_ACCESS',
              category: 'STAFF',
              targetId: member.id
            });
            await loadData();
            vantaFeedback.toast('info', 'Acesso Revogado', 'O perfil voltou ao nível Membro.');
          }
        } finally {
          setIsProcessing(false);
        }
      }
    });
  };

  return (
    <div className="space-y-10 animate-in slide-in-from-right duration-500 pb-32">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#d4af37] italic">CONTROLE DE DELEGAÇÃO</h3>
          <p className="text-[22px] font-serif italic text-white tracking-tighter uppercase">Equipe da Unidade</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)} 
          className="px-6 py-3 bg-[#d4af37] text-black text-[9px] font-black uppercase rounded-full shadow-lg active:scale-95 transition-all"
        >
          + Liberar Acesso
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="py-20 flex justify-center"><div className="w-6 h-6 border-2 border-white/10 border-t-[#d4af37] rounded-full animate-spin"></div></div>
        ) : unitStaff.length > 0 ? unitStaff.map(member => (
          <div key={member.id} className="p-6 bg-zinc-900/40 border border-white/5 rounded-[2.5rem] flex items-center gap-6 group hover:border-[#d4af37]/20 transition-all">
            <div className="w-14 h-14 rounded-full border border-white/10 p-0.5 overflow-hidden bg-zinc-900">
               <VantaAvatar src={member.avatar_url} gender={member.gender} />
            </div>
            <div className="flex-1 min-w-0">
               <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-white text-[12px] font-black uppercase tracking-widest truncate">{member.full_name}</h4>
                  <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[6px] font-black rounded-full border border-white/5 uppercase">
                    {member.role}
                  </span>
               </div>
               <p className="text-zinc-600 text-[9px] font-black uppercase tracking-widest truncate">@{member.instagram_handle}</p>
               <div className="flex flex-wrap gap-1 mt-2">
                  {Object.entries(member.permissions || {}).filter(([_, v]) => v).slice(0, 3).map(([k]) => (
                    <span key={k} className="text-[5px] text-zinc-500 uppercase tracking-tighter">● {k.replace('_', ' ')}</span>
                  ))}
               </div>
            </div>
            <button 
              onClick={() => handleRevokeAccess(member)}
              className="p-3 text-red-900 opacity-20 group-hover:opacity-100 hover:text-red-500 transition-all"
            >
               <ICONS.Trash className="w-4 h-4" />
            </button>
          </div>
        )) : (
          <div className="py-20 text-center border border-dashed border-white/5 rounded-[3rem] opacity-30">
            <p className="text-[8px] text-zinc-500 font-black uppercase">Sua equipe local está vazia.</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[11000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="w-full max-sm bg-zinc-950 border border-white/10 rounded-[3.5rem] p-10 space-y-8 shadow-2xl relative overflow-hidden">
            <header className="text-center space-y-2">
               <span className="text-[8px] text-[#d4af37] font-black uppercase tracking-[0.5em] italic">PROTOCOLO DE ACESSO LOCAL</span>
               <h3 className="text-2xl font-serif italic text-white uppercase tracking-tighter">Delegar Função</h3>
            </header>

            {!selectedUser ? (
              <div className="space-y-4">
                <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest text-center leading-relaxed">
                  Pesquise um membro verificado para liberar acesso administrativo à sua boate.
                </p>
                <VantaUserPicker onSelect={setSelectedUser} placeholder="PESQUISAR NA REDE..." />
              </div>
            ) : (
              <div className="space-y-8 animate-in zoom-in-95">
                 <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full border border-[#d4af37]/30 p-1 overflow-hidden bg-zinc-900 shadow-xl">
                       <VantaAvatar src={selectedUser.avatar_url} gender={selectedUser.gender} />
                    </div>
                    <div className="text-center">
                       <h4 className="text-white text-sm font-black uppercase">{selectedUser.full_name}</h4>
                       <p className="text-zinc-600 text-[9px] font-black uppercase">@{selectedUser.instagram_handle}</p>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[8px] text-zinc-600 font-black uppercase tracking-widest ml-4">Selecionar Template de Cargo</label>
                    <select 
                      value={selectedTemplateId} 
                      onChange={e => setSelectedTemplateId(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-5 text-[10px] text-white uppercase outline-none focus:border-[#d4af37]/30"
                    >
                      <option value="">SELECIONE A FUNÇÃO...</option>
                      {templates.map(t => <option key={t.id} value={t.id}>{t.name.toUpperCase()}</option>)}
                    </select>
                 </div>

                 <div className="flex gap-4">
                    <button 
                      onClick={handleGrantAccess}
                      disabled={isProcessing || !selectedTemplateId}
                      className="flex-1 py-5 bg-white text-black text-[10px] font-black uppercase rounded-full shadow-2xl active:scale-95 disabled:opacity-20"
                    >
                      {isProcessing ? "Protocolando..." : "Confirmar Acesso"}
                    </button>
                    <button onClick={() => setSelectedUser(null)} className="px-6 py-5 border border-white/10 text-zinc-500 text-[10px] font-black uppercase rounded-full">Trocar</button>
                 </div>
              </div>
            )}

            <button 
              onClick={() => { setShowAddModal(false); setSelectedUser(null); }} 
              className="w-full py-4 text-zinc-700 text-[8px] font-black uppercase tracking-[0.3em] text-center"
            >
              CANCELAR
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
