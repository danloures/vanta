
import React, { useState, useEffect, useRef } from 'react';
import { ICONS } from '../constants';
import { friendshipStore, FriendshipStatus } from '../lib/friendshipStore';
import { MemberProfile } from '../lib/membersApi';
import { supabase } from '../lib/supabaseClient';
import { VantaAvatar } from './VantaAvatar';
import { vantaFeedback } from '../lib/feedbackStore';

interface MemberProfileViewProps {
  member: MemberProfile;
  onBack: () => void;
  onMessage?: (memberId: string) => void;
}

export const MemberProfileView: React.FC<MemberProfileViewProps> = ({ member, onBack, onMessage }) => {
  const [status, setStatus] = useState<FriendshipStatus>(friendshipStore.getStatus(member.id));
  const [isPresent, setIsPresent] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [member.id]);

  useEffect(() => {
    const checkPresence = async () => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('event_rsvps')
        .select('event_id, events(start_at, end_at)')
        .eq('user_id', member.id)
        .eq('status', 'going');

      if (!error && data) {
        const activeEvent = data.find((d: any) => {
          const start = new Date(d.events.start_at);
          const end = d.events.end_at ? new Date(d.events.end_at) : new Date(start.getTime() + 8 * 60 * 60 * 1000);
          const nowD = new Date();
          return nowD >= start && nowD <= end;
        });
        setIsPresent(!!activeEvent);
      }
    };
    checkPresence();

    const unsubscribe = friendshipStore.subscribe(() => {
      setStatus(friendshipStore.getStatus(member.id));
    });
    return () => unsubscribe();
  }, [member.id]);

  const handleAction = (newStatus: FriendshipStatus) => {
    friendshipStore.setStatus(member.id, newStatus);
  };

  const handleUnfriend = () => {
    vantaFeedback.confirm({
      title: 'Desfazer Conexão',
      message: `Deseja encerrar o vínculo social com ${member.full_name?.split(' ')[0]}?`,
      confirmLabel: 'Confirmar Remoção',
      isDestructive: true,
      onConfirm: () => handleAction('none')
    });
  };

  const isFriend = status === 'friends';

  return (
    <div ref={containerRef} className="absolute inset-0 z-[300] bg-black overflow-y-auto no-scrollbar animate-in slide-in-from-right duration-500 pb-32">
      <div className="sticky top-0 z-[310] p-6 flex items-center justify-between safe-top bg-black/50 backdrop-blur-xl">
        <button onClick={onBack} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all"><ICONS.ArrowLeft className="w-5 h-5" /></button>
        <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-full"><span className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.3em]">Perfil do Membro</span></div>
        <div className="w-12" />
      </div>

      <div className="flex flex-col items-center px-8 pt-12 space-y-8">
        <div className="relative">
          <div className={`w-40 h-40 rounded-full border p-1.5 overflow-hidden bg-zinc-900 transition-all duration-700 ${isPresent ? 'border-[#d4af37] shadow-[0_0_40px_rgba(212,175,55,0.3)]' : 'border-white/10'}`}>
            <VantaAvatar 
              src={member.avatar_url} 
              gender={member.gender} 
              alt={member.full_name || 'Membro'} 
            />
          </div>
          {isPresent && <div className="absolute -top-1 -right-1 w-10 h-10 bg-[#d4af37] rounded-full border-4 border-black flex items-center justify-center animate-pulse shadow-xl"><span className="text-[12px] font-serif italic text-black font-black">V</span></div>}
          {isFriend && !isPresent && <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-zinc-900 rounded-full border-4 border-black flex items-center justify-center"><ICONS.Star className="w-3 h-3 text-[#d4af37]" /></div>}
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-4xl font-serif italic text-white tracking-tighter uppercase leading-none">{member.full_name || 'Membro'}</h2>
          <div className="flex flex-col items-center gap-1">
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em]">@{member.instagram_handle || 'vanta_member'}</p>
            <div className="flex items-center gap-2"><span className="text-[#d4af37] text-[8px] font-black uppercase tracking-[0.3em] italic">{isFriend ? 'Amigo Verificado' : 'Membro VANTA'}</span>{isPresent && <span className="px-2 py-0.5 bg-[#d4af37]/10 border border-[#d4af37]/20 rounded-full text-[6px] text-[#d4af37] font-black uppercase tracking-widest">Ativo na Noite</span>}</div>
          </div>
        </div>

        <div className="w-full max-w-xs space-y-3">
          {isFriend && <button onClick={() => onMessage?.(member.id)} className="w-full py-5 bg-[#d4af37] text-black text-[10px] font-black uppercase rounded-full shadow-2xl mb-4">Enviar Mensagem</button>}
          {status === 'none' && <button onClick={() => handleAction('outgoing')} className="w-full py-5 bg-white text-black text-[10px] font-black uppercase rounded-full">Adicionar Amizade</button>}
          {status === 'outgoing' && <div className="flex gap-2"><button className="flex-[2] py-5 bg-zinc-900 text-zinc-500 border border-white/5 text-[10px] font-black uppercase rounded-full">Solicitado</button><button onClick={() => handleAction('none')} className="flex-1 py-5 border border-red-900/20 text-red-500 text-[10px] font-black uppercase rounded-full">Cancelar</button></div>}
          {status === 'incoming' && <div className="flex gap-2"><button onClick={() => handleAction('friends')} className="flex-[2] py-5 bg-emerald-500 text-black text-[10px] font-black uppercase rounded-full">Aceitar Amizade</button><button onClick={() => handleAction('none')} className="flex-1 py-5 border border-white/5 text-zinc-500 text-[10px] font-black uppercase rounded-full">Ignorar</button></div>}
          {isFriend && <div className="space-y-4"><div className="w-full py-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase rounded-full text-center">Conexão Estabelecida</div><button onClick={handleUnfriend} className="w-full py-3 text-red-900/40 text-[8px] font-black uppercase tracking-widest">Desfazer Amizade</button></div>}
        </div>
      </div>
    </div>
  );
};
