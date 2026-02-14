import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Event,
  Community,
  CommunityType,
  TicketBatch,
  TicketVariation,
  StaffMember,
  User,
  GuestListRule,
  CustomRole,
  GlobalTag,
  MemberProfile,
  isVantaMaster
} from '../../../types';
import { indicaStore, IndicaItem } from '../../../lib/indicaStore';
import { supabase } from '../../../lib/supabaseClient';
import { geocodeEventAddress } from '../../../lib/geocode';
import { getAvatarFallback } from '../../../lib/userMapper';
import * as eventService from '../../../lib/eventsApi';
import * as communityService from '../../../lib/communitiesApi';
import * as rolesService from '../../../lib/rolesApi';
import { fetchGlobalTags } from '../../../lib/tagsApi';
import { createAuditLog, fetchCommunityCoOwners } from '../../../lib/auditApi';
import { fetchUnitStaff, fetchMyPermissionsInUnit } from '../../../lib/communityStaffApi';
import { notificationStore } from '../../../lib/notificationStore';
import { vantaFeedback } from '../../../lib/feedbackStore';
import { saveIndicaItem } from '../../../lib/indicaApi';

export const useAdminLogic = (currentUser: User, events: Event[], setEvents: (e: Event[]) => void) => {
  const [indicaItems] = useState<IndicaItem[]>(indicaStore.getItems());
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [eventSuccess, setEventSuccess] = useState(false);
  const [indicaSuccess, setIndicaSuccess] = useState(false);
  const [curatorshipSuccess, setCuratorshipSuccess] = useState<{ title: string; subtitle: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);

  // VANTA_PURIFICATION: Nomenclatura atualizada para refletir aprovação automática
  const [qualificationQueue, setQualificationQueue] = useState<MemberProfile[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);

  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [currentScopeId, setCurrentScopeId] = useState<string>('global');
  const [unitStaff, setUnitStaff] = useState<any[]>([]);
  const [globalTags, setGlobalTags] = useState<GlobalTag[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);

  const [currentUserUnitPermissions, setCurrentUserUnitPermissions] = useState<Record<string, boolean>>({});

  const [filterGender, setFilterGender] = useState<'all' | 'male' | 'female'>('all');
  const [filterInfluence, setFilterInfluence] = useState<'all' | 'high'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const eventImageInputRef = useRef<HTMLInputElement>(null);

  // VANTA_ADMIN_CROPPER: Estado Central de Recorte
  const [cropState, setCropState] = useState<{
    isOpen: boolean;
    src: string;
    field: string | null; // Identifica qual campo está sendo editado (logo, cover, event_image)
    aspectRatio: number;
    maskShape: 'circle' | 'rect';
  }>({
    isOpen: false,
    src: '',
    field: null,
    aspectRatio: 1,
    maskShape: 'rect'
  });

  // VANTA_SOVEREIGN: Helper centralizado
  const isMaster = isVantaMaster(currentUser);

  // VANTA_COMMUNITIES_GUARD: filtro único para remover comunidades arquivadas
  const isCommunityArchived = (c: any): boolean => {
    return c?.is_archived === true;
  };

  const [newIndica, setNewIndica] = useState({
    title: '',
    tag: 'EXCLUSIVE ACCESS',
    eventId: '',
    image: '',
    type: 'EVENT' as 'EVENT' | 'LINK',
    url: ''
  });

  const [communityForm, setCommunityForm] = useState({
    name: '',
    description: '',
    type: 'BOATE' as CommunityType,
    address: '',
    city: '',
    state: '',
    logo_url: '',
    image_url: '',
    is_active: true,
    latitude: null as number | null,
    longitude: null as number | null,
    owner_id: '',
    owner_name: ''
  });

  const [eventForm, setEventForm] = useState({
    id: undefined as string | undefined,
    title: '',
    description: '',
    startDate: '',
    startTime: '22:00',
    endTime: '06:00',
    location: '',
    city: '',
    state: '',
    image: '',
    isVipOnly: false,
    isTransferEnabled: true,
    capacity: 200,
    latitude: null as number | null,
    longitude: null as number | null,
    batches: [] as TicketBatch[],
    staff: [] as StaffMember[],
    guestListRules: [] as GuestListRule[],
    isListEnabled: true,
    vibeTags: [] as string[],
    lineup: '',
    dressCode: '',
    entryTips: ''
  });

  const [showBatchEditor, setShowBatchEditor] = useState(false);
  const [tempBatch, setTempBatch] = useState<Partial<TicketBatch>>({
    name: '',
    limit: 50,
    validUntil: '',
    validUntilTime: '23:59',
    variations: []
  });

  const [tempVariation, setTempVariation] = useState<Partial<TicketVariation>>({
    area: 'Pista',
    gender: 'Unisex',
    price: undefined,
    limit: undefined
  });

  // VANTA_INIT: Carregamento de Tags Globais para uso em todo o painel
  useEffect(() => {
    const loadTags = async () => {
      if (!isMaster) return;
      try {
        const tags = await fetchGlobalTags();
        setGlobalTags(tags);
      } catch (e) {
        console.error('Falha ao carregar tags globais', e);
      }
    };
    loadTags();
  }, [isMaster]);

  useEffect(() => {
    if (selectedCommunityId && communities.length > 0) {
      const comm = communities.find(c => c.id === selectedCommunityId);
      if (comm && (comm as any).address) {
        setEventForm(prev => ({ ...prev, location: (comm as any).address || '' }));
      }
      loadCustomRoles(selectedCommunityId);
      loadUnitStaffData(selectedCommunityId);

      if (!isMaster) {
        fetchMyPermissionsInUnit(selectedCommunityId, currentUser.id).then(setCurrentUserUnitPermissions);
      } else {
        setCurrentUserUnitPermissions({});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCommunityId, communities, currentUser.id, isMaster]);

  useEffect(() => {
    const loadQueue = async () => {
      if (!isMaster || !supabase) return;
      setIsLoadingQueue(true);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .contains('curated_level', ['vanta classic'])
        .order('created_at', { ascending: false });

      if (!error && data) {
        setQualificationQueue(data as MemberProfile[]);
      }
      setIsLoadingQueue(false);
    };
    loadQueue();
  }, [isMaster]);

  const loadUnitStaffData = async (commId: string) => {
    const staff = await fetchUnitStaff(commId);
    setUnitStaff(staff);
  };

  const checkPermission = (permissionId: string, communityId?: string): boolean => {
    if (isMaster) return true;
    if (communityId && communityId === selectedCommunityId) {
      return !!currentUserUnitPermissions[permissionId];
    }
    return !!currentUser.permissions?.[permissionId];
  };

  const loadCustomRoles = async (communityId: string) => {
    const roles = await rolesService.fetchCustomRoles(communityId);
    setCustomRoles(roles);
  };

  const loadCommunities = async () => {
    setIsLoadingCommunities(true);
    try {
      const sb = supabase;
      if (!sb) {
        setCommunities([]);
        return;
      }

      let data: Community[] = [];

      if (isMaster) {
        data = await communityService.fetchCommunities();
      } else {
        const owned = await communityService.fetchMyCommunities(currentUser.id);

        const { data: coOwnedData } = await sb
          .from('community_co_owners')
          .select('community:communities(*, owner:profiles!owner_id(full_name, avatar_url, gender))')
          .eq('user_id', currentUser.id);

        const { data: staffBoundData } = await sb
          .from('community_staff')
          .select('community:communities(*, owner:profiles!owner_id(full_name, avatar_url, gender))')
          .eq('user_id', currentUser.id);

        const mapBoundComm = (row: any) => {
          const c = row?.community;
          if (!c) return null;
          if (isCommunityArchived(c)) return null;

          return {
            id: c.id,
            name: c.name,
            description: c.description || '',
            image_url: c.image_url || '',
            logo_url: c.logo_url || '',
            type: c.type,
            address: c.address,
            city: c.city || '',
            state: c.state || '',
            latitude: c.latitude,
            longitude: c.longitude,
            owner_id: c.owner_id,
            owner_name: c.owner?.full_name || 'Membro VANTA',
            owner_avatar: c.owner?.avatar_url || getAvatarFallback(c.owner?.gender),
            is_active: c.is_active,
            eventIds: [],
            createdAt: new Date(c.created_at).getTime(),
            // mantém o flag disponível sem quebrar tipagem
            ...(typeof c.is_archived !== 'undefined' ? { is_archived: c.is_archived } : {})
          } as any as Community;
        };

        const mappedCoOwned = (coOwnedData || []).map(mapBoundComm).filter(Boolean) as Community[];
        const mappedStaffBound = (staffBoundData || []).map(mapBoundComm).filter(Boolean) as Community[];

        const ownedFiltered = (owned || []).filter((c: any) => !isCommunityArchived(c));
        const allIds = new Set(ownedFiltered.map(c => c.id));
        const combinedBound = [...mappedCoOwned, ...mappedStaffBound].filter(c => {
          if (allIds.has(c.id)) return false;
          allIds.add(c.id);
          return true;
        });

        data = [...ownedFiltered, ...combinedBound];
      }

      // VANTA_COMMUNITIES_GUARD: remove arquivadas também no master (ou qualquer retorno do service)
      const activeOnly = (data || []).filter((c: any) => !isCommunityArchived(c));

      const dataWithCoOwners = await Promise.all(
        (activeOnly || []).map(async (c) => {
          const coOwners = await fetchCommunityCoOwners(c.id);
          return { ...c, co_owners: coOwners };
        })
      );

      setCommunities(dataWithCoOwners);
    } finally {
      setIsLoadingCommunities(false);
    }
  };

  /**
   * ✅ FIX 1: carrega comunidades automaticamente ao abrir o painel (e quando trocar de usuário/role)
   */
  useEffect(() => {
    if (!currentUser?.id) return;
    if (!supabase) return;
    loadCommunities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.id, isMaster]);

  /**
   * ✅ FIX 2: se ainda não tem selectedCommunityId, escolhe a primeira da lista
   * ✅ FIX 3: se a selecionada sumiu/virou arquivada, corrige para a primeira ativa
   */
  useEffect(() => {
    if (communities.length === 0) return;

    const stillExists = selectedCommunityId
      ? communities.some(c => c.id === selectedCommunityId)
      : false;

    if (!selectedCommunityId || !stillExists) {
      setSelectedCommunityId(communities[0].id);
    }
  }, [communities, selectedCommunityId]);

  const handleCreateEvent = async (): Promise<boolean> => {
    if (!checkPermission('event_edit', selectedCommunityId || undefined)) return false;
    if (!eventForm.image || !eventForm.title.trim() || !selectedCommunityId) {
      vantaFeedback.toast('warning', 'Protocolo Incompleto', 'Defina banner e título.');
      return false;
    }
    setIsProcessing(true);
    try {
      const created = await eventService.createEvent({
        ...eventForm,
        communityId: selectedCommunityId!,
        creatorId: currentUser.id
      });

      if (created) {
        setEvents([created, ...events]);
        const currentComm = communities.find(c => c.id === selectedCommunityId);

        const staffTasks = (eventForm.staff || []).map(s =>
          notificationStore.addNotification('staff_assignment', s.id, currentUser.fullName, {
            eventId: created.id,
            communityName: currentComm?.name || 'Sua Unidade',
            roleName: s.role,
            date: eventForm.startDate,
            action_type: 'staff_assignment'
          })
        );

        await Promise.all(staffTasks);

        await createAuditLog({
          communityId: selectedCommunityId!,
          eventId: created.id,
          action: 'CREATE_EVENT_WITH_SCALE',
          category: 'GENERAL',
          details: {
            title: created.title,
            staff_count: (eventForm.staff || []).length,
            automated_inheritance: true
          }
        });

        setEventSuccess(true);
        setCuratorshipSuccess({ title: 'Sessão Publicada', subtitle: 'A escala de equipe foi automatizada com sucesso.' });
        setShowSuccessOverlay(true);
        return true;
      }
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateEvent = async (): Promise<boolean> => {
    if (!eventForm.id) return false;
    if (!checkPermission('event_edit', selectedCommunityId || undefined)) return false;

    setIsProcessing(true);
    try {
      const success = await eventService.updateEvent(eventForm.id, {
        ...eventForm
      });

      if (success) {
        setEvents(events.map(e => (e.id === (eventForm.id as string) ? { ...e, ...(eventForm as any) } : e)));

        await createAuditLog({
          communityId: selectedCommunityId!,
          eventId: eventForm.id,
          action: 'UPDATE_EVENT',
          category: 'GENERAL',
          details: { title: eventForm.title }
        });

        setEventSuccess(true);
        setCuratorshipSuccess({ title: 'Evento Atualizado', subtitle: 'As alterações foram sincronizadas.' });
        setShowSuccessOverlay(true);
        return true;
      }
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddStaff = async (selectedUser: MemberProfile, role: string, quotas: Record<string, number>) => {
    const newStaff: StaffMember = {
      id: selectedUser.id,
      email: (selectedUser as any).email || (selectedUser as any).instagram_handle || 'membro@vanta.com',
      role: role,
      status: 'PENDING'
    };
    const exists = (eventForm.staff || []).some((s: StaffMember) => s.id === newStaff.id);
    if (exists) {
      vantaFeedback.toast('warning', 'Membro já escalado', 'Este perfil já está na lista.');
      return;
    }
    setEventForm((prev: any) => ({ ...prev, staff: [...(prev.staff || []), newStaff] }));
  };

  const handleRemoveStaff = (staffId: string) => {
    setEventForm((prev: any) => ({ ...prev, staff: (prev.staff || []).filter((s: StaffMember) => s.id !== staffId) }));
  };

  const handleAddIndica = async () => {
    if (!newIndica.title || !newIndica.image) {
      vantaFeedback.toast('warning', 'Dados Incompletos', 'Título e imagem obrigatórios.');
      return;
    }
    setIsProcessing(true);
    try {
      await saveIndicaItem({
        title: newIndica.title,
        image_url: newIndica.image,
        tag: newIndica.tag,
        type: newIndica.type,
        event_id: newIndica.eventId || null,
        url: newIndica.url || undefined,
        is_active: true,
        city: null
      });
      setNewIndica({
        title: '',
        tag: 'EXCLUSIVE ACCESS',
        eventId: '',
        image: '',
        type: 'EVENT',
        url: ''
      });
      setIndicaSuccess(true);
      setCuratorshipSuccess({ title: 'Destaque Criado', subtitle: 'O item já está ativo no radar.' });
      setShowSuccessOverlay(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredQueue = useMemo(() => {
    let list = [...qualificationQueue];
    if (filterGender !== 'all') {
      list = list.filter(m => (m as any).gender === filterGender);
    }
    if (filterInfluence === 'high') {
      list = list.filter(m => ((m as any).followers_count || 0) >= 5000);
    }
    return list;
  }, [qualificationQueue, filterGender, filterInfluence]);

  const updateMemberLevel = (memberId: string, tag: string) => {
    setQualificationQueue(prev =>
      prev.map((m: any) => {
        if (m.id !== memberId) return m;

        const current = (m.curated_level as string[] | undefined) || [];
        const updated = current.includes(tag)
          ? current.filter(l => l !== tag)
          : [...current, tag];

        return { ...m, curated_level: updated };
      })
    );
  };

  const handleQualifyMember = async (memberId: string) => {
    const member: any = qualificationQueue.find((m: any) => m.id === memberId);

    const curated = (member?.curated_level as string[] | undefined) || [];
    if (!member || curated.length === 0) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase!
        .from('profiles')
        .update({ curated_level: curated })
        .eq('id', member.id);

      if (error) throw error;

      setQualificationQueue(prev => prev.filter((m: any) => m.id !== memberId));
      setCuratorshipSuccess({
        title: 'Qualificação Assinada',
        subtitle: 'As novas tags foram sincronizadas na rede.'
      });
      setShowSuccessOverlay(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateCommunity = async (): Promise<boolean> => {
    if (!communityForm.name || !communityForm.owner_id) {
      vantaFeedback.toast('warning', 'Responsável ausente', 'Atribua um dono à unidade.');
      return false;
    }
    setIsProcessing(true);
    try {
      const created = await communityService.createCommunity(communityForm as any);
      if (created) {
        // evita inserir arquivada por acidente
        if (!(created as any)?.is_archived) {
          setCommunities([created, ...communities]);
        } else {
          await loadCommunities();
        }
        setCuratorshipSuccess({ title: 'Unidade Criada', subtitle: 'O cluster já está operacional.' });
        setShowSuccessOverlay(true);
        return true;
      }
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateCommunity = async () => {
    if (!selectedCommunityId) return;
    setIsProcessing(true);
    try {
      const success = await communityService.updateCommunity(selectedCommunityId, communityForm as any);
      if (success) {
        await loadCommunities();
        setCuratorshipSuccess({ title: 'Unidade Atualizada', subtitle: 'Os protocolos foram sincronizados.' });
        setShowSuccessOverlay(true);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddressSearch = async () => {
    if (!communityForm.address) return;
    setIsGeocoding(true);
    try {
      const result = await geocodeEventAddress({
        location: communityForm.address,
        city: communityForm.city,
        state: communityForm.state
      });
      if (result) {
        setCommunityForm(prev => ({
          ...prev,
          latitude: result.latitude,
          longitude: result.longitude
        }));
      }
    } finally {
      setIsGeocoding(false);
    }
  };

  const addVariationToBatch = () => {
    if (!tempVariation.area || tempVariation.price === undefined) return;
    setTempBatch(prev => ({
      ...prev,
      variations: [
        ...(prev.variations || []),
        { ...tempVariation, id: Math.random().toString(36).substr(2, 9) } as TicketVariation
      ]
    }));
    setTempVariation({ area: 'Pista', gender: 'Unisex' });
  };

  const confirmBatch = () => {
    if (!tempBatch.name || !tempBatch.validUntil) return;
    setEventForm(prev => ({
      ...prev,
      batches: [
        ...prev.batches,
        { ...tempBatch, id: Math.random().toString(36).substr(2, 9), soldCount: 0 } as TicketBatch
      ]
    }));
    setTempBatch({ name: '', limit: 50, variations: [] });
    setShowBatchEditor(false);
  };

  const handleAddLegoRule = (rule: GuestListRule) => {
    setEventForm(prev => ({
      ...prev,
      guestListRules: [...prev.guestListRules, rule]
    }));
  };

  const handleRemoveLegoRule = (id: string) => {
    setEventForm(prev => ({
      ...prev,
      guestListRules: prev.guestListRules.filter(r => (r as any).id !== id)
    }));
  };

  // VANTA_ADMIN_CROPPER: Interceptador de Arquivos
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let ratio = 1;
    let shape: 'circle' | 'rect' = 'rect';

    if (field === 'logo') {
      ratio = 1;
      shape = 'rect';
    } else if (field === 'cover' || field === 'event_image' || field === 'image') {
      ratio = 16 / 9;
      shape = 'rect';
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setCropState({
        isOpen: true,
        src: base64,
        field: field,
        aspectRatio: ratio,
        maskShape: shape
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // VANTA_ADMIN_CROPPER: Finalização do Recorte
  const handleCropConfirm = (croppedBase64: string) => {
    const field = cropState.field;
    if (field === 'image') setNewIndica(prev => ({ ...prev, image: croppedBase64 }));
    if (field === 'logo') setCommunityForm(prev => ({ ...prev, logo_url: croppedBase64 }));
    if (field === 'cover') setCommunityForm(prev => ({ ...prev, image_url: croppedBase64 }));
    if (field === 'event_image') setEventForm(prev => ({ ...prev, image: croppedBase64 }));

    setCropState(prev => ({ ...prev, isOpen: false, src: '' }));
  };

  const handleCropCancel = () => {
    setCropState(prev => ({ ...prev, isOpen: false, src: '' }));
  };

  return {
    indicaItems,
    showSuccessOverlay,
    setShowSuccessOverlay,
    curatorshipSuccess,
    isProcessing,
    isGeocoding,
    isLoadingCommunities,
    communities,
    qualificationQueue,
    isLoadingQueue,
    selectedCommunityId,
    setSelectedCommunityId,
    currentScopeId,
    setCurrentScopeId,
    communityForm,
    setCommunityForm,
    eventForm,
    setEventForm,
    fileInputRef,
    logoInputRef,
    coverInputRef,
    eventImageInputRef,
    newIndica,
    setNewIndica,
    loadCommunities,
    handleCreateEvent,
    handleUpdateEvent,
    handleFileSelect,
    handleAddStaff,
    handleRemoveStaff,
    showBatchEditor,
    setShowBatchEditor,
    tempBatch,
    setTempBatch,
    tempVariation,
    setTempVariation,
    unitStaff,
    globalTags,
    checkPermission,
    handleAddIndica,
    filteredQueue,
    updateMemberLevel,
    handleQualifyMember,
    filterGender,
    setFilterGender,
    filterInfluence,
    setFilterInfluence,
    handleCreateCommunity,
    handleUpdateCommunity,
    handleAddressSearch,
    addVariationToBatch,
    confirmBatch,
    handleAddLegoRule,
    handleRemoveLegoRule,
    isMaster,
    currentUserUnitPermissions,
    cropState,
    handleCropConfirm,
    handleCropCancel,
    eventSuccess,
    setEventSuccess,
    indicaSuccess,
    setIndicaSuccess
  };
};
