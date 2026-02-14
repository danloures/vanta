
import React from 'react';
import { ICONS } from '../../constants';
import { VantaAvatar } from '../VantaAvatar';

interface MemberProfile {
  id: string;
  full_name: string | null;
  instagram_handle: string | null;
  email: string | null;
  avatar_url: string | null;
  level: string;
  role: string;
  city: string | null;
  state: string | null;
  bio?: string | null;
  gender?: string | null;
  approved_by_name?: string | null;
  approved_at?: string | null;
}

interface AdminMemberDetailModalProps {
  member: MemberProfile;
  onClose: () => void;
}

export const AdminMemberDetailModal: React.FC<AdminMemberDetailModalProps> = ({ member, onClose }) => {
  return (
    <div className="fixed inset-0 z-[11000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-zinc-950 border border-white/10 rounded-[3.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <header className="px-10 pt-10 pb-6 flex justify-between items-center shrink-0">
          <div className="flex flex-col"><span className="text-[7px] text-[#d4af37] font-black uppercase tracking-[0.4em] mb-1">PROTOCOLO DE ACESSO</span><h3 className="text-xl font-serif italic text-white uppercase tracking-tighter">Ficha do Membro</h3></div>
          <button onClick={onClose} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 active:scale-90"><ICONS.Plus className="w-5 h-5 fill-current rotate-45" /></button>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar px-10 pb-10 space-y-10">
          <div className="flex flex-col items-center text-center space-y-6 pt-4">
            <div className="w-40 h-40 rounded-full border border-[#d4af37]/30 p-1.5 bg-zinc-900 overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.15)]">
              <VantaAvatar src={member.avatar_url} gender={member.gender} />
            </div>
            <h2 className="text-4xl font-serif italic text-white tracking-tighter uppercase">{member.full_name}</h2>
            <p className="text-[#d4af37] text-[10px] font-black uppercase">@{member.instagram_handle}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
