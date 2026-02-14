
import React, { useEffect, useState } from 'react';
import { vantaFeedback } from '../../lib/feedbackStore';

export const VantaFeedbackSystem: React.FC = () => {
  const [toasts, setToasts] = useState(vantaFeedback.getToasts());
  const [confirm, setConfirm] = useState(vantaFeedback.getConfirm());

  useEffect(() => {
    return vantaFeedback.subscribe(() => {
      setToasts(vantaFeedback.getToasts());
      setConfirm(vantaFeedback.getConfirm());
    });
  }, []);

  // VANTA_LOGIC: Detecção de Estado de Sucesso via Label (Protocolo de Entrada)
  const isSuccess = confirm?.confirmLabel === 'ENTRAR';

  // VANTA_DISPLAY_LOGIC: Prioridade de Exibição
  // 1. Se houver CONFIRM (Modal), ele domina o centro.
  // 2. Se não, mostra o TOAST mais recente no centro.
  // Isso garante a regra "Ou um ou outro" e "Sempre no meio".

  return (
    <div className="fixed inset-0 z-[30000] pointer-events-none flex items-center justify-center">
      
      {/* 1. SISTEMA DE TOASTS (Centralizado & Exclusivo) */}
      {/* Renderiza apenas se NÃO houver modal de confirmação ativo */}
      {!confirm && toasts.length > 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm p-6 flex flex-col items-center justify-center">
          {/* Exibe apenas o ÚLTIMO toast (slice(-1)) para evitar empilhamento */}
          {toasts.slice(-1).map((t) => (
            <div 
              key={t.id}
              className="pointer-events-auto w-full glass rounded-[2.5rem] p-8 border border-[#d4af37]/30 shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex flex-col items-center text-center gap-6 animate-in zoom-in-95 duration-300 backdrop-blur-3xl bg-black/80"
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 border-2 ${
                t.type === 'success' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 
                t.type === 'error' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-[#d4af37]/10 border-[#d4af37] text-[#d4af37]'
              }`}>
                <span className="text-2xl font-black">{t.type === 'success' ? '✓' : t.type === 'error' ? '!' : '✦'}</span>
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-serif italic text-white tracking-tighter leading-none">{t.title}</h4>
                {t.message && <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest leading-relaxed">{t.message}</p>}
              </div>
              <button 
                onClick={() => vantaFeedback.removeToast(t.id)} 
                className="px-8 py-3 bg-white/5 border border-white/10 rounded-full text-[8px] font-black uppercase tracking-widest hover:bg-white/10 transition-all text-zinc-300"
              >
                Entendido
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 2. SISTEMA DE CONFIRMAÇÃO (MODAL - DARK GOLD / SUCCESS VARIANT) */}
      {confirm && (
        <div className="fixed inset-0 pointer-events-auto flex items-center justify-center bg-black/95 backdrop-blur-2xl z-[30050] p-8 animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-zinc-950 border border-white/5 rounded-[3rem] p-10 shadow-[0_0_80px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col items-center text-center space-y-8 transform transition-all animate-in zoom-in-95 duration-300">
             
             {/* Status Circle */}
             <div className={`w-24 h-24 rounded-full border-2 flex items-center justify-center mb-2 shadow-[0_0_40px_rgba(0,0,0,0.5)] ${
               isSuccess ? 'border-emerald-500 bg-black text-emerald-500' :
               confirm.isDestructive ? 'border-red-600 bg-black text-red-600' : 
               'border-[#d4af37] bg-black text-[#d4af37]'
             }`}>
                {confirm.isDestructive ? (
                  <svg viewBox="0 0 24 24" className="w-10 h-10 fill-current"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="w-10 h-10 fill-current"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                )}
             </div>

             <div className="space-y-4">
                <h2 className="text-3xl font-serif italic text-white tracking-tighter leading-none">{confirm.title}</h2>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] leading-relaxed">
                  {confirm.message}
                </p>
             </div>

             <div className="w-full space-y-4">
                <button 
                  onClick={() => vantaFeedback.resolveConfirm(true)}
                  className={`w-full py-5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all ${
                    isSuccess
                      ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
                      : confirm.isDestructive 
                        ? 'bg-red-900 border border-red-600 text-red-100 hover:bg-red-800' 
                        : 'bg-[#d4af37] text-black hover:bg-[#bfa030]'
                  }`}
                >
                  {confirm.confirmLabel || 'Confirmar'}
                </button>
                
                {!isSuccess && (
                  <button 
                    onClick={() => vantaFeedback.resolveConfirm(false)}
                    className="w-full py-2 text-zinc-600 text-[8px] font-black uppercase tracking-widest hover:text-zinc-400 transition-colors"
                  >
                    {confirm.cancelLabel || 'Cancelar Protocolo'}
                  </button>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
