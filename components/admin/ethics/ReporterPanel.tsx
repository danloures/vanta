
import React, { useState, useRef } from 'react';
import { User, MemberCuratedLevel, VerdictChoice } from '../../../types';
import { VantaUserPicker } from '../../VantaUserPicker';
import { MemberProfile } from '../../../lib/membersApi';
import { createIncidenceReport, uploadIncidenceProof, startCouncilVoting } from '../../../lib/incidenceApi';
import { ICONS } from '../../../constants';
import { vantaFeedback } from '../../../lib/feedbackStore';

interface ReporterPanelProps {
  currentUser: User;
  communityId: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export const ReporterPanel: React.FC<ReporterPanelProps> = ({ currentUser, communityId, onCancel, onSuccess }) => {
  const [subject, setSubject] = useState<MemberProfile | null>(null);
  const [description, setDescription] = useState('');
  const [proofs, setProofs] = useState<{blob: Blob, url: string}[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['SOCIO']);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setProofs(prev => [...prev, { blob: file, url }]);
    }
  };

  const handleCreate = async () => {
    if (!subject || !description) return alert("Identifique o membro e descreva o ocorrido.");
    
    vantaFeedback.confirm({
      title: 'Abertura de Dossiê',
      message: 'Protocolar dossiê no conselho? Esta ação iniciará uma investigação oficial.',
      confirmLabel: 'Confirmar Protocolo',
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          const report = await createIncidenceReport({
            communityId,
            reporterId: currentUser.id,
            subjectId: subject.id,
            description
          });

          if (report) {
            // Upload de Provas
            for (const p of proofs) {
              await uploadIncidenceProof(report.id, p.blob, 'image');
            }
            
            // Iniciar Votação
            await startCouncilVoting(report.id, selectedRoles);
            onSuccess();
          }
        } catch (err) {
          console.error(err);
          vantaFeedback.toast('error', 'Falha', 'Não foi possível protocolar o dossiê.');
        } finally {
          setIsProcessing(false);
        }
      }
    });
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-500">
      <div className="p-8 bg-zinc-950 border border-red-900/20 rounded-[3rem] space-y-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        
        <div className="space-y-4">
          <label className="text-[8px] text-zinc-600 font-black uppercase tracking-widest ml-4">Identificar Membro do Incidente</label>
          <VantaUserPicker onSelect={setSubject} placeholder="BUSCAR MEMBRO..." />
          {subject && (
            <div className="flex items-center gap-4 p-4 bg-red-600/5 border border-red-600/20 rounded-2xl animate-in fade-in">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                <img src={subject.avatar_url || ''} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-white font-black uppercase">{subject.full_name}</p>
                <p className="text-[7px] text-zinc-500 font-black uppercase">@{subject.instagram_handle}</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-[8px] text-zinc-600 font-black uppercase tracking-widest ml-4">Relato do Ocorrido</label>
          <textarea 
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="DESCREVA O COMPORTAMENTO INADEQUADO COM DETALHES..."
            className="w-full bg-zinc-900 border border-white/5 rounded-3xl p-6 text-[11px] text-white outline-none focus:border-red-600/30 h-32 resize-none uppercase leading-relaxed"
          />
        </div>

        <div className="space-y-4">
          <label className="text-[8px] text-zinc-600 font-black uppercase tracking-widest ml-4">Anexar Provas (Dossiê)</label>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 bg-zinc-900 border border-dashed border-white/10 rounded-2xl flex items-center justify-center shrink-0 hover:border-red-600/40 transition-all"
            >
              <ICONS.Plus className="w-6 h-6 text-zinc-600" />
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} accept="image/*" />
            </button>
            {proofs.map((p, i) => (
              <div key={i} className="w-20 h-20 rounded-2xl overflow-hidden border border-white/5 shrink-0 relative">
                <img src={p.url} className="w-full h-full object-cover" alt="" />
                <button onClick={() => setProofs(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-black/60 rounded-full p-1"><ICONS.Trash className="w-3 h-3 text-red-500" /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[8px] text-zinc-600 font-black uppercase tracking-widest ml-4">Convocar Conselho</label>
          <div className="grid grid-cols-2 gap-2">
            {['SOCIO', 'PROMOTOR', 'PORTARIA'].map(role => (
              <button 
                key={role}
                onClick={() => setSelectedRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role])}
                className={`py-4 px-2 rounded-2xl text-[8px] font-black uppercase tracking-widest border transition-all ${
                  selectedRoles.includes(role) ? 'bg-white text-black border-white shadow-lg' : 'bg-zinc-900/50 text-zinc-500 border-white/5'
                }`}
              >
                {role}S
              </button>
            ))}
          </div>
        </div>

        <div className="pt-6 space-y-3">
          <button 
            onClick={handleCreate}
            disabled={isProcessing}
            className="w-full py-6 bg-red-600 text-white text-[11px] font-black uppercase rounded-full shadow-2xl active:scale-95 transition-all disabled:opacity-30"
          >
            {isProcessing ? "Protocolando Incidência..." : "Ativar Tribunal de Ética"}
          </button>
          <button onClick={onCancel} className="w-full py-2 text-zinc-600 text-[8px] font-black uppercase tracking-widest">Abortar Protocolo</button>
        </div>
      </div>
    </div>
  );
};
