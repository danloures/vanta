
import React from 'react';
import { CommunityManage } from '../shared/CommunityManage';
import { Community, Event, User } from '../../../types';

interface BosqueDashboardProps {
  community: Community;
  events: Event[];
  onCreateEvent: () => void;
  // Fix: Added currentUser to dashboard props
  currentUser: User;
  onEditEvent?: (eventId: string) => void;
}

/**
 * BosqueDashboard: Espaço para funções exclusivas da unidade Bosque Bar.
 */
export const BosqueDashboard: React.FC<BosqueDashboardProps> = ({
  // Fix: Destructured currentUser from props
  community, events, onCreateEvent, currentUser, onEditEvent
}) => {
  return (
    <div className="animate-in fade-in duration-500">
      {/* 
         Aqui poderiam ser inseridas lógicas específicas do Bosque, 
         como gestão de mapas de mesas do Jockey ou integração com promoters locais.
      */}
      <CommunityManage 
        community={community} 
        events={events} 
        onCreateEvent={onCreateEvent} 
        // Fix: Passed currentUser to CommunityManage
        currentUser={currentUser}
        onEditEvent={onEditEvent}
      />
    </div>
  );
};
