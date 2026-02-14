
import React from 'react';
import { AdminAuditLogs } from '../AdminAuditLogs';

interface MissionAuditTabProps {
  eventId: string;
}

export const MissionAuditTab: React.FC<MissionAuditTabProps> = ({ eventId }) => {
  return (
    <div className="animate-in fade-in duration-500">
      <AdminAuditLogs eventId={eventId} title="Dossiê de Evento (Black Box)" />
    </div>
  );
};
