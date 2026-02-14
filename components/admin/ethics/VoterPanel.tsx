
import React, { useState, useEffect } from 'react';
import { User, IncidenceReport, IncidenceProof, VerdictChoice, VerdictChoice as Choice } from '../../../types';
import { getIncidenceDossier, castCouncilVote, closeIncidenceReport } from '../../../lib/incidenceApi';
import { ICONS } from '../../../constants';
import { vantaFeedback } from '../../../lib/feedbackStore';

interface VoterPanelProps {
  reportId: string;
  currentUser: User;
  onVoteSuccess: () => void;
}

export const VoterPanel: React.FC<VoterPanelProps> = ({ reportId, currentUser, onVoteSuccess }) => {
  const [dossier, setDossier] = useState<{report: IncidenceReport, proofs: IncidenceProof[]} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedVerdict, setSelectedVerdict] = useState<VerdictChoice | null>(null);

  useEffect(() => {
    loadDossier();
  }, [reportId]);

  const loadDossier = async () => {
    const data = await getIncidenceDossier(reportId);
    if (data?.report) setDossier({ report: data.report, proofs: data.proofs || [] });
  };

  const handleVote = async () => {
    if (!selectedVerdict) return;

    vantaFeedback.confirm({
      title: 'Deliberação',
      message: 'Confirmar voto? Sua decisão será registrada anonimamente.',
      confirmLabel: 'Protocolar Voto',
      onConfirm: async () => {
        setIsProcessing(true);
        try {
          const weight = currentUser.role.toUpperCase().includes('SOCIO') ? 3 : 1;
          
          const success = await castCouncilVote({
            reportId,
            voterId: currentUser.id,
            choice: selectedVerdict,
            weight
          });

          if (success) {
            const isMaster = ['admin', 'master', 'vanta_master'].includes(currentUser.role.toLowerCase());
            if (isMaster) {
               vantaFeedback.confirm({
                 title: 'Soberania Master',
                 message: 'Você possui autoridade global. Deseja encerrar este caso e aplicar o veredito imediatamente?',
                 confirmLabel: 'Encerrar e Aplicar',
                 onConfirm: async () => {
                    await closeIncidenceReport(reportId);
                    vantaFeedback.toast('success', 'Caso Encerrado', 'A sentença foi aplicada ao perfil.');
                    onVoteSuccess();
                 },
                 onCancel: () => {
                   onVoteSuccess();
                 }
               });
            } else {
               vantaFeedback.toast('success', 'Voto Registrado', 'Sua deliberação foi protocolada com sucesso.');
               onVoteSuccess();
            }
          }
        } catch (err: any) {
          vantaFeedback.toast('error', 'Falha no Voto', err.message || "Erro ao registrar.");
        } finally {
          setIsProcessing(false);
        }
      }
    });
  };

  if (!dossier) return <div className="py-20 text-center animate-pulse">Sincronizando Dossiê...</div>;

  return (
    <div className="space-y-10 animate-in zoom-in-95 duration-500">
      <div className="p-8 bg-zinc-950 border border-[#d4af37]/20 rounded-[3rem] space-y-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600/40 to-transparent"></div>
        
        <div className="flex flex-col items-center text-center space-y-4">
           <span className="text-[7px] text-[#d4af37] font-black uppercase tracking-[0.5em] italic">CONFIDENCIALIDADE NÍVEL 5</span>
           <h2 className="text-2xl font-serif italic text-white uppercase tracking-tighter">Sala de Deliberação</h2>
           <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest leading-relaxed">
             Analise as provas abaixo e emita seu veredito anônimo.<br/>O peso do seu voto é baseado em seu cargo na unidade.
           </p>
        </div>

        <div className="space-y-4">
          <div className="p-6 bg-zinc-900/60 border border-white/5 rounded-3xl space-y-3">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10">
                 <img src={(dossier.report as any).subject?.avatar_url} className="w-full h-full object-cover" alt="" />
               </div>
               <span className="text-[10px] text-white font-black uppercase">{(dossier.report as any).subject?.full_name}</span>
             </div>
             <p className="text-[11px] text-zinc-400 italic leading-relaxed">"{dossier.report.description}"</p>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
            {dossier.proofs.length > 0 ? dossier.proofs.map((p, i) => (
              <div key={i} className="w-32 aspect-square rounded-2xl overflow-hidden border border-white/10 shrink-0">
                <img src={p.fileUrl} className="w-full h-full object-cover" alt="" />
              </div>
            )) : (
              <div className="w-full py-10 text-center border border-dashed border-white/5 rounded-2xl opacity-20">
                <p className="text-[8px] font-black uppercase">Sem provas visuais anexadas.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 border-t border-white/5 pt-8">
           <label className="text-[8px] text-zinc-600 font-black uppercase tracking-widest ml-4 block text-center">Seu Veredito</label>
           <div className="grid grid-cols-2 gap-3">
              {[
                { key: Choice.ABSOLVICAO, label: 'Absolvição', color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' },
                { key: Choice.ADVERTENCIA, label: 'Advertência', color: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' },
                { key: Choice.SUSPENSAO, label: 'Suspensão', color: 'bg-orange-500/10 border-orange-500/30 text-orange-500' },
                { key: Choice.BANIMENTO, label: 'Banimento', color: 'bg-red-600 text-white' }
              ].map(opt => (
                <button 
                  key={opt.key}
                  onClick={() => setSelectedVerdict(opt.key)}
                  className={`py-5 px-2 rounded-[2rem] text-[10px] font-black uppercase tracking-widest border transition-all ${
                    selectedVerdict === opt.key ? `${opt.color} shadow-lg scale-105` : 'bg-zinc-900/50 text-zinc-600 border-white/5'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
           </div>
        </div>

        <button 
          onClick={handleVote}
          disabled={isProcessing || !selectedVerdict}
          className="w-full py-6 bg-white text-black text-[11px] font-black uppercase rounded-full shadow-2xl active:scale-95 transition-all disabled:opacity-30"
        >
          {isProcessing ? "Registrando Voto..." : "Confirmar Veredito"}
        </button>
      </div>
    </div>
  );
};
