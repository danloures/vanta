import React from 'react';
import { Community, Event, User } from '../../types';

import { CommunityList } from '../../features/communities/shared/CommunityList';
import { CommunityForm } from '../../features/communities/shared/CommunityForm';
import { CommunityManage } from '../../features/communities/shared/CommunityManage';

import { BosqueDashboard } from '../../features/communities/bosque-bar/BosqueDashboard';
import { VitrinniDashboard } from '../../features/communities/vitrinni/VitrinniDashboard';

interface AdminCommunitiesProps {
  view: any;

  communities: Community[];
  isLoadingCommunities: boolean;
  isMaster: boolean;

  setActiveView: (view: any) => void;
  setSelectedCommunityId: (id: string | null) => void;
  selectedCommunityId: string | null;

  communityForm: any;
  setCommunityForm: (form: any) => void;

  handleCreateCommunity: () => Promise<boolean>;
  handleUpdateCommunity: () => void;

  handleAddressSearch: () => void;

  logoInputRef: React.RefObject<HTMLInputElement | null>;
  coverInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>, field: any) => void;

  isGeocoding: boolean;
  isProcessing: boolean;

  currentUser: User;

  events: Event[];
  setEventForm: (form: any) => void;

  onSelectEventForStaff?: (eventId: string) => void;
  unitStaff?: any[];
}

export const AdminCommunities: React.FC<AdminCommunitiesProps> = ({
  view,
  communities,
  isLoadingCommunities,
  isMaster,
  setActiveView,
  setSelectedCommunityId,
  selectedCommunityId,
  communityForm,
  setCommunityForm,
  handleCreateCommunity,
  handleUpdateCommunity,
  handleAddressSearch,
  logoInputRef,
  coverInputRef,
  handleFileSelect,
  isGeocoding,
  isProcessing,
  currentUser,
  events,
  setEventForm,
  unitStaff = [],
}) => {
  const isListView = view === 'LIST' || view === 'COMUNIDADES';
  const isCreateView = view === 'CREATE' || view === 'CREATE_UNIDADE';
  const isEditView = view === 'EDIT' || view === 'EDIT_UNIDADE';
  const isFormView = isCreateView || isEditView;
  const isManageView = view === 'MANAGE' || view === 'MANAGE_UNIDADE';

  const handleEditEvent = (eventId: string) => {
    const ev = events.find((e: any) => e.id === eventId);
    if (!ev) return;

    setEventForm({
      id: ev.id,
      title: ev.title,
      description: ev.description,
      startDate: ev.startDate,
      startTime: ev.startTime,
      endTime: ev.endTime,
      location: ev.location,
      city: ev.city,
      state: ev.state,
      image: ev.image,
      isVipOnly: ev.isVipOnly,
      isTransferEnabled: ev.isTransferEnabled,
      capacity: ev.capacity,
      latitude: ev.latitude,
      longitude: ev.longitude,
      batches: ev.batches || [],
      staff: ev.staff || [],
      guestListRules: ev.guestListRules || [],
      isListEnabled: (ev.guestListRules && ev.guestListRules.length > 0) || ev.isListEnabled,
      vibeTags: ev.vibeTags || [],
      lineup: ev.lineup || '',
      dressCode: ev.dressCode || '',
      entryTips: ev.entryTips || ''
    });

    setActiveView('EDIT_EVENTO');
  };

  // 1) LIST
  if (isListView) {
    return (
      <CommunityList
        communities={communities}
        isLoading={isLoadingCommunities}
        isMaster={isMaster}
        onCreate={() => setActiveView('CREATE_UNIDADE')}
        onEdit={(id: string) => {
          setSelectedCommunityId(id);
          setActiveView('EDIT_UNIDADE');
        }}
        onSelect={(id: string) => {
          setSelectedCommunityId(id);
          setActiveView('MANAGE_UNIDADE');
        }}
      />
    );
  }

  // 2) FORM
  if (isFormView) {
    const formView = isCreateView ? 'CREATE' : 'EDIT';

    return (
      <CommunityForm
        view={formView}
        communityForm={communityForm}
        setCommunityForm={setCommunityForm}
        onSubmit={
          isCreateView
            ? async () => {
                const success = await handleCreateCommunity();
                if (success) setActiveView('COMUNIDADES');
              }
            : handleUpdateCommunity
        }
        onAddressBlur={handleAddressSearch}
        logoInputRef={logoInputRef}
        coverInputRef={coverInputRef}
        onFileSelect={handleFileSelect}
        isGeocoding={isGeocoding}
        isProcessing={isProcessing}
      />
    );
  }

  // 3) MANAGE
  if (isManageView) {
    const comm: any = communities.find((c: any) => c.id === selectedCommunityId);
    if (!comm) return null;

    const handleCreateEventClick = () => {
      const initialStaff = (unitStaff || []).map((m: any) => ({
        id: m.id,
        email: m.email || m.instagram_handle || 'membro@vanta.com',
        role: m.role || 'VANTA_STAFF',
        status: 'PENDING'
      }));

      const cleanForm: any = {
        title: '',
        description: '',
        startDate: '',
        startTime: '22:00',
        endTime: '06:00',
        location: comm.address || '',
        city: comm.city || '',
        state: comm.state || '',
        image: '',
        isVipOnly: false,
        capacity: comm.stats?.totalRsvps ? Math.max(comm.stats.totalRsvps, 200) : 200,
        latitude: comm.latitude || null,
        longitude: comm.longitude || null,
        batches: [],
        staff: initialStaff,
        guestListRules: [],
        isListEnabled: true,
        vibeTags: [],
        lineup: '',
        dressCode: '',
        entryTips: ''
      };

      setEventForm(cleanForm);
      setActiveView('CREATE_EVENTO');
    };

    const handleSelectEvent = (id: string) => {
      (window as any).__VANTA_EVENT_REDIREC__?.(id);
    };

    if ((comm.name || '').toUpperCase().includes('BOSQUE')) {
      return (
        <BosqueDashboard
          community={comm}
          events={events as any}
          onCreateEvent={handleCreateEventClick}
          currentUser={currentUser}
          onEditEvent={handleEditEvent}
        />
      );
    }

    if ((comm.name || '').toUpperCase().includes('VITRINNI')) {
      return (
        <VitrinniDashboard
          community={comm}
          events={events as any}
          onCreateEvent={handleCreateEventClick}
          currentUser={currentUser}
          onEditEvent={handleEditEvent}
        />
      );
    }

    return (
      <CommunityManage
        community={comm}
        events={events as any}
        onCreateEvent={handleCreateEventClick}
        currentUser={currentUser}
        onSelectEvent={handleSelectEvent}
        onEditEvent={handleEditEvent}
      />
    );
  }

  return null;
};
