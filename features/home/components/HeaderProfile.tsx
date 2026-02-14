
import React from 'react';
import { User } from '../../../types';
import { VantaAvatar } from '../../../components/VantaAvatar';

interface HeaderProfileProps {
  currentUser: User | null;
  onNavigate: (tab: any) => void;
}

export const HeaderProfile: React.FC<HeaderProfileProps> = ({ currentUser, onNavigate }) => {
  return (
    <button 
      onClick={() => onNavigate('profile')} 
      className="w-10 h-10 rounded-full border border-[#d4af37]/40 p-0.5 overflow-hidden active:scale-90 transition-transform bg-zinc-900"
      aria-label="Abrir Perfil"
    >
      <VantaAvatar 
        src={currentUser?.avatar} 
        gender={currentUser?.gender} 
        alt="Me" 
      />
    </button>
  );
};
