import React, { useState, useEffect, useMemo } from 'react';
import { User, TicketTransfer, Event, StaffMember } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { MemberProfile } from '../../lib/membersApi';
import { initiateTicketTransfer, getPendingTransfers, respondToTransfer, validateTicketOwnership } from '../../lib/ticketsApi';
import { vantaFeedback } from '../../lib/feedbackStore';

// VANTA_REFACTOR: Componentes Atômicos Importados
import { WalletLockedView } from './components/WalletLockedView';
import { WalletTicketList } from './components/WalletTicketList';
import { WalletStaffAgenda } from './components/WalletStaffAgenda';
import { TicketDetailModal } from './components/TicketDetailModal';
import { GiftTransferFlow } from './components/GiftTransferFlow';

interface WalletFeatureProps {
  currentUser: User;
  embedMode?: boolean;
}

export const WalletFeature: React.FC<WalletFeatureProps> = ({ currentUser, embedMode = false }) => {
  const [activeView, setActiveView] = useState<'TICKETS' | 'STAFF_AGENDA'>('TICKETS');
  const [tickets, setTickets] = useState<any[]>([]);
  const [staffEvents, setStaffEvents] = useState<Event[]>([]);
  const [pendingGifts, setPendingGifts] = useState<TicketTransfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  
  // VANTA_VALIDATION: Estado para ticket pendente de preenchimento de dados
  const [ticketToValidate, setTicketToValidate] = useState<any | null>(null);
  const [validationData, setValidationData] = useState({ name: '', cpf: '' });
  const [isValidating, setIsValidating] = useState(false);

  const [isLocked, setIsLocked] = useState(true);
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [attempts, setAttempts] = useState(0);
  const [lockoutTimestamp, setLockoutTimestamp] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  
  // VANTA_GIFT_STATES
  const [transferStep, setTransferStep] = useState<'IDLE' | 'AUTH' | 'PICK_USER' | 'SELFIE_CHECK' | 'PROCESSING'>('IDLE');
  const [transferTicket, setTransferTicket] = useState<any | null>(null);
  const [transferTarget, setTransferTarget] = useState<MemberProfile | null>(null);
  const [transferAuthPassword, setTransferAuthPassword] = useState('');

  const [isProcessingLocal, setIsProcessingLocal] = useState(false);

  const isRestricted = !!currentUser.isGloballyRestricted;
  const isStaff = ['admin', 'master', 'vanta_master', 'vanta_prod', 'produtor', 'vanta_socio', 'vanta_promoter', 'vanta_portaria', 'vanta_staff'].includes(currentUser.role.toLowerCase());

  useEffect(() => {
    setIsLocked(true);
    const storedLock = localStorage.getItem(`vanta_wallet_lock_${currentUser.id}`);
    if (storedLock) {
      const lockTime = parseInt(storedLock, 10);
      if (lockTime > Date.now()) {
        setLockoutTimestamp(lockTime);
        setAttempts(3);
      } else {
        localStorage.removeItem(`vanta_wallet_lock_${currentUser.id}`);
      }
    }
  }, [currentUser.id]);

  useEffect(() => {
    if (!lockoutTimestamp) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = lockoutTimestamp - now;
      if (diff <= 0) {
        setLockoutTimestamp(null);
        setAttempts(0);
        localStorage.removeItem(`vanta_wallet_lock_${currentUser.id}`);
        clearInterval(interval);
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimestamp]);

  const fetchData = async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const { data: tData } = await supabase
        .from('user_tickets')
        .select('id, source, status, hash, used_at, created_at, event_id, promoter_id, guest_name, guest_cpf, events(id, title, city, start_at, image_url, is_transfer_enabled)')
        .eq('user_id', currentUser.id);
      
      const mappedTickets = (tData || []).map((t: any) => {
        if (!t.events) return t;
        const eventData = Array.isArray(t.events) ? t.events[0] : t.events;
        const startAt = new Date(eventData.start_at);
        return {
          ...t,
          events: {
            ...eventData,
            image: eventData.image_url,
            start_date: startAt.toLocaleDateString('pt-BR'),
            start_at: eventData.start_at,
            isTransferEnabled: eventData.is_transfer_enabled !== false 
          }
        };
      });
      setTickets(mappedTickets);

      if (isStaff) {
        const { data: sEvents } = await supabase
          .from('events')
          .select('*, communities(name)')
          .contains('staff', JSON.stringify([{ id: currentUser.id }]));
        
        const eventsWithUsage = await Promise.all((sEvents || []).map(async (ev) => {
          const { count } = await supabase
            .from('user_tickets')
            .select('id', { count: 'exact', head: true })
            .eq('event_id', ev.id)
            .eq('promoter_id', currentUser.id)
            .eq('source', 'complimentary');
          
          const { count: entered } = await supabase
            .from('user_tickets')
            .select('id', { count: 'exact', head: true })
            .eq('event_id', ev.id)
            .eq('promoter_id', currentUser.id)
            .eq('source', 'complimentary')
            .eq('status', 'used');

          return { ...ev, vipUsed: count || 0, vipEntered: entered || 0 };
        }));

        setStaffEvents(eventsWithUsage);
      }

      const gifts = await getPendingTransfers(currentUser.id);
      setPendingGifts(gifts);

    } catch (err) {
      console.error("[VANTA WALLET] Erro ao carregar dados:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLocked) {
      fetchData();
    }
  }, [currentUser.id, isLocked]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || lockoutTimestamp) return;
    setIsVerifying(true);
    try {
      const { error } = await (supabase.auth as any).signInWithPassword({ email: currentUser.email, password });
      if (error) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= 3) {
          const lockTime = Date.now() + 5 * 60 * 1000;
          setLockoutTimestamp(lockTime);
          localStorage.setItem(`vanta_wallet_lock_${currentUser.id}`, lockTime.toString());
          setPassword('');
        }
      } else {
        setIsLocked(false);
        setAttempts(0);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOpenTicket = (ticket: any) => {
    if (isRestricted) {
      vantaFeedback.toast('error', 'Acesso Negado', 'ACESSO BLOQUEADO PELO CONSELHO');
      return;
    }
    if (!ticket.guest_cpf) {
      setValidationData({ name: currentUser.fullName, cpf: '' });
      setTicketToValidate(ticket);
    } else {
      setSelectedTicket(ticket);
    }
  };

  const handleValidationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketToValidate) return;
    if (validationData.name.length < 5 || validationData.cpf.length !== 11) {
      vantaFeedback.toast('error', 'Dados Inválidos', 'Dados inválidos. CPF deve ter 11 dígitos.');
      return;
    }

    vantaFeedback.confirm({
      title: 'Validação Biométrica',
      message: 'Confirmar dados do titular? Esta ação é irreversível.',
      confirmLabel: 'Sim, Confirmar',
      onConfirm: async () => {
        setIsValidating(true);
        try {
          const result = await validateTicketOwnership({
            ticketId: ticketToValidate.id,
            guestName: validationData.name,
            guestCpf: validationData.cpf
          });

          if (result.success) {
            vantaFeedback.toast('success', 'Validado', 'Titularidade Confirmada. Acesso Liberado.');
            setTickets(prev => prev.map(t => t.id === ticketToValidate.id ? { ...t, guest_name: validationData.name.toUpperCase(), guest_cpf: validationData.cpf } : t));
            setSelectedTicket({ ...ticketToValidate, guest_name: validationData.name.toUpperCase(), guest_cpf: validationData.cpf });
            setTicketToValidate(null);
          } else {
            vantaFeedback.toast('error', 'Erro', result.message);
          }
        } catch (err) {
          vantaFeedback.toast('error', 'Erro', 'Erro de conexão.');
        } finally {
          setIsValidating(false);
        }
      }
    });
  };

  const handleStartTransfer = (ticket: any) => {
    if (isRestricted) {
      vantaFeedback.toast('error', 'Suspenso', 'TRANSFERÊNCIAS SUSPENSAS');
      return;
    }
    setTransferTicket(ticket);
    setTransferStep('AUTH');
  };

  const generateInviteLink = (eventId: string) => {
    const link = `${window.location.origin}/activate?event=${eventId}&staff=${currentUser.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
      vantaFeedback.toast('success', 'Copiado', 'Link de Convite Copiado');
    }
  };

  const handleTransferAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferAuthPassword.trim()) return;
    setIsProcessingLocal(true);
    try {
      const { error } = await (supabase.auth as any).signInWithPassword({ 
        email: currentUser.email, 
        password: transferAuthPassword 
      });
      
      if (!error) {
        setTransferStep('PICK_USER');
        setTransferAuthPassword('');
      } else {
        vantaFeedback.toast('error', 'Erro', 'Senha Incorreta');
      }
    } finally {
      setIsProcessingLocal(false);
    }
  };

  const executeFinalTransfer = async (selfieBlob: Blob) => {
    if (!transferTicket || !transferTarget) return;
    
    vantaFeedback.confirm({
      title: 'Gift Protocol',
      message: `Transferir ingresso permanentemente para ${transferTarget.full_name?.split(' ')[0]}?`,
      confirmLabel: 'Transferir Agora',
      onConfirm: async () => {
        setTransferStep('PROCESSING');
        try {
          const result = await initiateTicketTransfer(
            transferTicket.id,
            currentUser.id,
            transferTarget.id,
            selfieBlob
          );

          if (result.success) {
            vantaFeedback.toast('success', 'Enviado', 'Protocolo de Transferência Ativado');
            setTransferStep('IDLE');
            setTransferTicket(null);
            setTransferTarget(null);
            fetchData();
          } else {
            vantaFeedback.toast('error', 'Falha', result.message || 'Falha na transferência');
            setTransferStep('IDLE');
          }
        } catch (err) {
          vantaFeedback.toast('error', 'Erro', 'Erro de conexão');
          setTransferStep('IDLE');
        }
      }
    });
  };

  const handleConfirmPresence = async (eventId: string) => {
    setIsProcessingLocal(true);
    try {
      const { error } = await (supabase as any).rpc('confirm_staff_presence', {
        p_event_id: eventId,
        p_user_id: currentUser.id,
        p_status: 'CONFIRMED'
      });

      if (!error) {
        vantaFeedback.toast('success', 'Confirmado', 'Presença Confirmada Protocolada');
        fetchData();
      }
    } finally {
      setIsProcessingLocal(false);
    }
  };

  const handleGiftResponse = async (transferId: string, action: 'accept' | 'return') => {
    if (isRestricted && action === 'accept') {
      vantaFeedback.toast('error', 'Bloqueado', 'RECEBIMENTO BLOQUEADO');
      return;
    }

    const gift = pendingGifts.find(g => g.id === transferId);
    const senderName = gift?.sender?.name || "Membro";

    vantaFeedback.confirm({
      title: action === 'accept' ? 'Aceitar Gift' : 'Devolver Gift',
      message: action === 'accept' ? `Aceitar convite de ${senderName}?` : `Recusar convite de ${senderName}?`,
      confirmLabel: action === 'accept' ? 'Aceitar' : 'Devolver',
      isDestructive: action === 'return',
      onConfirm: async () => {
        setIsProcessingLocal(true);
        try {
          const result = await respondToTransfer(transferId, action, currentUser.id);
          if (result.success) {
            vantaFeedback.toast('success', 'Processado', result.message || "Protocolo Processado");
            fetchData();
          } else {
            vantaFeedback.toast('error', 'Erro', result.message || "Erro ao processar");
          }
        } finally {
          setIsProcessingLocal(false);
        }
      }
    });
  };

  const walletData = useMemo(() => {
    const now = new Date();
    const sorted = [...tickets].sort((a, b) => {
      const timeA = a.events?.start_at ? new Date(a.events.start_at).getTime() : 0;
      const timeB = b.events?.start_at ? new Date(b.events.start_at).getTime() : 0;
      return timeA - timeB;
    });
    return {
      upcoming: sorted.filter(t => t.status === 'active' && t.events?.start_at && new Date(t.events.start_at) >= new Date(now.getTime() - 8 * 60 * 60 * 1000)),
      history: sorted.filter(t => t.status === 'used' || (t.events?.start_at && new Date(t.events.start_at) < new Date(now.getTime() - 8 * 60 * 60 * 1000))).reverse()
    };
  }, [tickets]);

  if (isLocked) {
    return (
      <WalletLockedView 
        embedMode={embedMode}
        lockoutTimestamp={lockoutTimestamp}
        timeLeft={timeLeft}
        password={password}
        setPassword={setPassword}
        isVerifying={isVerifying}
        onUnlock={handleUnlock}
      />
    );
  }

  return (
    <div className={`flex-1 flex flex-col animate-in fade-in duration-500 overflow-hidden pb-10 ${embedMode ? 'w-full' : 'bg-black h-full'}`}>
      {!embedMode && (
        <header className="px-10 pt-20 pb-10 flex-shrink-0 safe-top">
          <h1 className="text-5xl font-serif italic text-white tracking-tighter">Acesso</h1>
          {isStaff && (
            <div className="flex gap-6 mt-6 border-b border-white/5">
               <button onClick={() => setActiveView('TICKETS')} className={`pb-4 text-[9px] font-black uppercase tracking-[0.3em] relative ${activeView === 'TICKETS' ? 'text-[#d4af37]' : 'text-zinc-600'}`}>Meus Tickets {activeView === 'TICKETS' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d4af37]"></div>}</button>
               <button onClick={() => setActiveView('STAFF_AGENDA')} className={`pb-4 text-[9px] font-black uppercase tracking-[0.3em] relative ${activeView === 'STAFF_AGENDA' ? 'text-[#d4af37]' : 'text-zinc-600'}`}>Agenda Staff {activeView === 'STAFF_AGENDA' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d4af37]"></div>}</button>
            </div>
          )}
        </header>
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-12 px-6">
        {activeView === 'TICKETS' ? (
          <WalletTicketList 
            tickets={walletData.upcoming}
            pendingGifts={pendingGifts}
            isRestricted={isRestricted}
            onGiftResponse={handleGiftResponse}
            onOpenTicket={handleOpenTicket}
            onStartTransfer={handleStartTransfer}
          />
        ) : (
          <WalletStaffAgenda 
            staffEvents={staffEvents}
            currentUser={currentUser}
            onGenerateInvite={generateInviteLink}
            onConfirmPresence={handleConfirmPresence}
          />
        )}
      </div>

      <TicketDetailModal 
        selectedTicket={selectedTicket}
        ticketToValidate={ticketToValidate}
        validationData={validationData}
        setValidationData={setValidationData}
        isValidating={isValidating}
        onCloseSelection={() => setSelectedTicket(null)}
        onCloseValidation={() => setTicketToValidate(null)}
        onValidationSubmit={handleValidationSubmit}
        isRestricted={isRestricted}
      />

      <GiftTransferFlow 
        step={transferStep}
        transferAuthPassword={transferAuthPassword}
        setTransferAuthPassword={setTransferAuthPassword}
        isProcessingLocal={isProcessingLocal}
        onAuthSubmit={handleTransferAuth}
        onCancel={() => { setTransferStep('IDLE'); setTransferTicket(null); }}
        onUserSelect={(u) => { setTransferTarget(u); setTransferStep('SELFIE_CHECK'); }}
        transferTarget={transferTarget}
        onFinalize={executeFinalTransfer}
      />
    </div>
  );
};