import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { validateTicket, redeemTicket } from '../../../lib/ticketsApi';
import { supabase } from '../../../lib/supabaseClient';
import { VantaAvatar } from '../../VantaAvatar';
import { StaffMember } from '../../../types';

interface PortariaScannerProps {
  eventId: string;
  onSuccess: () => void;
}

export const PortariaScanner: React.FC<PortariaScannerProps> = ({ eventId, onSuccess }) => {
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStaffConfirmed, setIsStaffConfirmed] = useState<boolean | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerId = "vanta-scanner-region";

  useEffect(() => {
    checkStaffStatus();
    return () => { stopScanner(); };
  }, [eventId]);

  const checkStaffStatus = async () => {
    if (!supabase) return;
    const { data: { user } } = await (supabase.auth as any).getUser();
    if (!user) return;

    const { data: event } = await supabase.from('events').select('staff').eq('id', eventId).single();
    if (event && event.staff) {
      const myAssignment = event.staff.find((s: StaffMember) => s.id === user.id);
      
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      const isMaster = ['admin', 'master', 'vanta_master'].includes(profile?.role?.toLowerCase());

      if (isMaster || myAssignment?.status === 'CONFIRMED') {
        setIsStaffConfirmed(true);
        startScanner();
      } else {
        setIsStaffConfirmed(false);
      }
    }
  };

  const startScanner = async () => {
    try {
      const html5QrCode = new Html5Qrcode(scannerId);
      scannerRef.current = html5QrCode;
      await html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, onScanSuccess, undefined);
      setIsCameraActive(true);
    } catch (err) { console.error("[VANTA SCANNER] Erro:", err); }
  };

  const stopScanner = async () => { if (scannerRef.current?.isScanning) await scannerRef.current.stop(); };

  const onScanSuccess = async (decodedText: string) => {
    if (isProcessing || !decodedText.startsWith("VANTA_AUTH:")) return;
    processValidation(decodedText.split(":")[1]);
  };

  const processValidation = async (hash: string) => {
    setIsProcessing(true);
    try {
      const validation = await validateTicket(hash, eventId);
      if (!validation.success || !validation.ticket) { showFeedback(false, validation.message); return; }
      
      let profileData = null;
      let promoterName = null;

      // Busca perfil do titular se houver user_id
      if (validation.ticket.user_id) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', validation.ticket.user_id).single();
        profileData = profile;
      }

      // Se for Cortesia, busca nome do promoter para o log visual
      if (validation.ticket.source === 'complimentary' && validation.ticket.promoter_id) {
        const { data: prom } = await supabase.from('profiles').select('full_name').eq('id', validation.ticket.promoter_id).single();
        promoterName = prom?.full_name?.split(' ')[0];
      }

      const redeemed = await redeemTicket(validation.ticket.id);

      if (redeemed) {
        showFeedback(true, "Acesso Autorizado", { 
          name: validation.ticket.guest_name || profileData?.full_name, 
          image: profileData?.selfie_url || profileData?.avatar_url,
          gender: profileData?.gender,
          source: validation.ticket.source,
          promoter: promoterName
        });
        onSuccess();
      }
    } catch { showFeedback(false, "Falha de rede."); } finally { setIsProcessing(false); }
  };

  const showFeedback = (success: boolean, message: string, data?: any) => {
    setScanResult({ success, message, data });
    if (!success) setTimeout(() => setScanResult(null), 3000);
  };

  if (isStaffConfirmed === false && isStaffConfirmed !== null) {
    return (
      <div className="p-10 bg-zinc-950 border border-red-900/30 rounded-[3rem] text-center space-y-6 animate-in fade-in">
        <div className="w-16 h-16 rounded-full bg-red-600/10 border border-red-600/30 flex items-center justify-center mx-auto">
           <span className="text-2xl">🔒</span>
        </div>
        <div className="space-y-2">
           <h4 className="text-white text-lg font-serif italic">Operação Bloqueada</h4>
           <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest leading-relaxed">
             VOCÊ FOI ESCALADO, MAS AINDA NÃO CONFIRMOU SUA PRESENÇA NESTA SESSÃO.<br/>CONFIRME NA SUA CARTEIRA PARA LIBERAR O SCANNER.
           </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div id={scannerId} className="w-full aspect-square bg-zinc-950 border border-white/5 rounded-[3rem] overflow-hidden relative shadow-2xl">
        {!isCameraActive && isStaffConfirmed !== false && (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
             <div className="w-8 h-8 border-2 border-white/10 border-t-[#d4af37] rounded-full animate-spin"></div>
             <span className="text-[7px] text-zinc-600 font-black uppercase tracking-widest">Ativando Lente de Elite...</span>
          </div>
        )}
        {scanResult && (
          <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center p-6 animate-in zoom-in-95 ${scanResult.success ? 'bg-emerald-600/95' : 'bg-red-600/95'} backdrop-blur-md`}>
            {scanResult.success && scanResult.data ? (
              <div className="flex flex-col items-center space-y-6 w-full text-center">
                <div className="space-y-1">
                  <h4 className="text-white text-3xl font-serif italic">Acesso Liberado</h4>
                  {scanResult.data.source === 'complimentary' && (
                    <div className="px-4 py-1.5 bg-[#d4af37] text-black rounded-full text-[8px] font-black uppercase tracking-[0.2em] shadow-xl inline-block mx-auto">
                       Cortesia Nominal • {scanResult.data.promoter || 'Staff'}
                    </div>
                  )}
                </div>
                
                <div className="w-48 h-48 rounded-[2.5rem] border-4 border-white/20 overflow-hidden shadow-2xl bg-zinc-900">
                  <VantaAvatar src={scanResult.data.image} gender={scanResult.data.gender} />
                </div>
                
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight px-4">{scanResult.data.name}</h2>
                  <p className="text-white/60 text-[9px] font-black uppercase tracking-widest italic">
                    {scanResult.data.source === 'gift' ? 'Protocolo Transferido' : 'Titular da Conta'}
                  </p>
                </div>

                <button onClick={() => setScanResult(null)} className="w-full max-w-[200px] py-5 bg-white text-emerald-600 font-black rounded-full uppercase text-[11px] shadow-2xl active:scale-95 transition-all">Confirmar</button>
              </div>
            ) : <h4 className="text-white text-2xl font-serif italic text-center px-8">{scanResult.message}</h4>}
          </div>
        )}
      </div>
    </div>
  );
};