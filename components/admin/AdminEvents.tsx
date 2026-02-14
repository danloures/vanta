
import React from 'react';
import { Community, TicketBatch, TicketVariation, StaffMember, GuestListRule, User, Event, CustomRole } from '../../types';
import { MemberProfile } from '../../lib/membersApi';
import { GuestListBuilder } from './GuestListBuilder';
import { vantaFeedback } from '../../lib/feedbackStore';

// UI First: Novos Componentes Isolados
import { EventIdentitySection } from './events/EventIdentitySection';
import { EventStaffSection } from './events/EventStaffSection';
import { EventBatchSection } from './events/EventBatchSection';

interface AdminEventsProps {
  currentUser: User;
  selectedCommunityId: string | null;
  communities: Community[];
  events?: Event[];
  eventForm: any;
  setEventForm: (form: any) => void;
  handleCreateEvent: () => void;
  handleUpdateEvent?: () => void;
  isEditing?: boolean;
  eventImageInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>, field: any) => void;
  isProcessing: boolean;
  showBatchEditor: boolean;
  setShowBatchEditor: (show: boolean) => void;
  tempBatch: Partial<TicketBatch>;
  setTempBatch: (batch: Partial<TicketBatch>) => void;
  tempVariation: Partial<TicketVariation>;
  setTempVariation: (variation: Partial<TicketVariation>) => void;
  addVariationToBatch: () => void;
  confirmBatch: () => void;
  handleAddStaff: (user: MemberProfile, role: string, quotas: Record<string, number>, vipQuota?: number) => void;
  handleRemoveStaff: (id: string) => void;
  handleAddLegoRule: (rule: GuestListRule) => void;
  handleRemoveLegoRule: (id: string) => void;
  customRoles?: CustomRole[];
  handleCreateCustomRole?: (role: Omit<CustomRole, 'id'>) => Promise<CustomRole | null>;
  unitStaff?: any[];
}

export const AdminEvents: React.FC<AdminEventsProps> = ({
  currentUser, selectedCommunityId, communities, events = [], eventForm, setEventForm, handleCreateEvent, eventImageInputRef,
  handleFileSelect, isProcessing, showBatchEditor, setShowBatchEditor, tempBatch, setTempBatch,
  tempVariation, setTempVariation, addVariationToBatch, confirmBatch,
  handleAddLegoRule, handleRemoveLegoRule,
  unitStaff = [], isEditing, handleUpdateEvent
}) => {
  
  const comm = communities.find(c => c.id === selectedCommunityId);
  if (!comm) return null;

  const roleLower = currentUser.role.toLowerCase();
  const isOwner = comm.owner_id === currentUser.id || (comm.co_owners || []).includes(currentUser.id);
  const canEditDetails = ['admin', 'master', 'vanta_master', 'vanta_prod', 'produtor'].includes(roleLower) || isOwner;
 
  const handleRestrictedAction = (action: () => void) => {
    if (!canEditDetails) {
      vantaFeedback.toast('error', 'Jurisdição Negada', 'Você não possui permissão administrativa de nível 1.');
      return;
    }
    action();
  };

  const handleMainAction = () => {
    vantaFeedback.confirm({
      title: isEditing ? 'Editar Sessão' : 'Protocolar Sessão',
      message: isEditing 
        ? 'Salvar alterações?' 
        : `Confirmar a criação do evento ${eventForm.title} em ${comm.name}?`,
      confirmLabel: isEditing ? 'Salvar' : 'Publicar',
      onConfirm: () => {
        if (isEditing && handleUpdateEvent) {
          handleRestrictedAction(handleUpdateEvent);
        } else {
          handleRestrictedAction(handleCreateEvent);
        }
      }
    });
  };

  return (
    <div className="space-y-12 animate-in slide-in-from-bottom duration-500 pb-40">
      <EventIdentitySection 
        eventForm={eventForm}
        setEventForm={setEventForm}
        eventImageInputRef={eventImageInputRef}
        handleFileSelect={handleFileSelect}
        canEditDetails={canEditDetails}
        handleRestrictedAction={handleRestrictedAction}
      />

      <EventBatchSection 
        eventForm={eventForm}
        setEventForm={setEventForm}
        showBatchEditor={showBatchEditor}
        setShowBatchEditor={setShowBatchEditor}
        tempBatch={tempBatch}
        setTempBatch={setTempBatch}
        tempVariation={tempVariation}
        setTempVariation={setTempVariation}
        addVariationToBatch={addVariationToBatch}
        confirmBatch={confirmBatch}
      />

      <GuestListBuilder
        isEnabled={eventForm.isListEnabled}
        onToggle={(enabled) => setEventForm({...eventForm, isListEnabled: enabled})}
        rules={eventForm.guestListRules}
        onAddRule={handleAddLegoRule}
        onRemoveRule={handleRemoveLegoRule}
        readOnly={!canEditDetails}
      />

      <EventStaffSection 
        unitStaff={unitStaff}
        eventForm={eventForm}
        setEventForm={setEventForm}
        handleRestrictedAction={handleRestrictedAction}
      />

      <button onClick={handleMainAction} disabled={isProcessing} className="w-full py-6 bg-[#d4af37] text-black text-[11px] font-black uppercase rounded-full shadow-2xl active:scale-95 transition-all">
        {isProcessing ? (isEditing ? "Salvando Alterações..." : "Protocolando Missão...") : (isEditing ? "Salvar Alterações" : "Publicar e Notificar Escala")}
      </button>
    </div>
  );
};
