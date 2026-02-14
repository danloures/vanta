
import React from 'react';
import { ICONS } from '../../../constants';

interface NotificationBellProps {
  unreadCount: number;
  currentUser: any;
  onClick: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ unreadCount, currentUser, onClick }) => {
  return (
    <button 
      onClick={onClick} 
      className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative active:scale-90 transition-transform"
      aria-label="Abrir Notificações"
    >
      <ICONS.Bell className="w-5 h-5 text-white" />
      {unreadCount > 0 && currentUser && (
        <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#d4af37] rounded-full border border-black shadow-[0_0_10px_rgba(212,175,55,0.5)]"></div>
      )}
    </button>
  );
};
