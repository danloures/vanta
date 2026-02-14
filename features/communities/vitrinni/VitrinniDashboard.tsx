
import React from 'react';
import { CommunityManage } from '../shared/CommunityManage';
import { Community, Event, User } from '../../../types';

interface VitrinniDashboardProps {
  community: Community;
  events: Event[];
  onCreateEvent: () => void;
  // Fix: Added currentUser to dashboard props
  currentUser: User;
  onEditEvent?: (eventId: string) => void;
}

/**
 * VitrinniDashboard: Espaço para funções exclusivas da unidade Vitrinni.
 */
export const VitrinniDashboard: React.FC<VitrinniDashboardProps> = ({
  // Fix: Destructured currentUser from props
  community, events, onCreateEvent, currentUser, onEditEvent
}) => {
  return (
    <div className="animate-in fade-in duration-500">
      {/* 
         Espaço reservado para lógicas exclusivas da Vitrinni.
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
