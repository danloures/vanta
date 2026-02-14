import React from 'react';
import { Event, User, isVantaMaster } from '../types';
import { useAdminLogic } from '../features/admin/logic/useAdminLogic';
import { AdminHome } from './admin/AdminHome';
import { AdminIndica } from './admin/AdminIndica';
import { AdminCuratorship } from './admin/AdminCuratorship';
import { AdminCommunities } from './admin/AdminCommunities';
import { AdminEvents } from './admin/AdminEvents';
import { AdminMembers } from './admin/AdminMembers';
import { AdminPortaria } from './admin/AdminPortaria';
import { AdminBroadcaster } from './admin/AdminBroadcaster';
import { AdminConnectionTest } from './admin/AdminConnectionTest'; 
import { EthicsWarRoom } from './admin/ethics/EthicsWarRoom'; 
import { AdminStaffTemplates } from './admin/AdminStaffTemplates'; 
import { AdminGlobalTags } from './admin/AdminGlobalTags'; 
import { AdminTeamManagement } from './admin/AdminTeamManagement'; 
import { UnitStaffManagement } from './admin/UnitStaffManagement';
import { EventMissionControl } from './admin/EventMissionControl';
import { ICONS } from '../constants';
import { VantaImageCropper } from '../features/profile/VantaImageCropper';
import { useTelemetry } from '../hooks/useTelemetry';

interface AdminDashboardProps { 
  currentUser: User; 
  events: Event[]; 
  setEvents: (events: Event[]) => void; 
  onExit: () => void;
}

type AdminView = 'HUB' | 'INDICA' | 'CURADORIA' | 'MEMBROS' | 'COMUNIDADES' | 'CREATE_UNIDADE' | 'EDIT_UNIDADE' | 'MANAGE_UNIDADE' | 'CREATE_EVENTO' | 'EDIT_EVENTO' | 'PORTARIA' | 'DIAGNOSTICO' | 'BROADCASTER' | 'ETICA' | 'STAFF_TEMPLATES' | 'GLOBAL_TAGS' | 'TEAM' | 'FINANCEIRO' | 'PERMISSOES' | 'EVENTOS' | 'UNIT_STAFF_MGMT' | 'EVENT_MISSION';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, events, setEvents, onExit }) => {
  const [activeView, setActiveView] = React.useState<AdminView>('HUB');
  const [targetEventId, setTargetEventId] = React.useState<string | null>(null);
  const [isRouting, setIsRouting] = React.useState(true);
  
  const mainRef = React.useRef<HTMLDivElement>(null);
  const logic = useAdminLogic(currentUser, events, setEvents);

  const effectiveRole = currentUser.role.toLowerCase();
  const isMaster = isVantaMaster(currentUser);

  // VANTA_SENSOR: Monitoramento ativo da navegação administrativa
  // Isso cria o rastro de auditoria visual ("Câmera de Segurança Lógica")
  useTelemetry(
    `ADMIN_VIEW:${activeView}`, 
    logic.selectedCommunityId || targetEventId || 'GLOBAL',
    activeView // Força o log sempre que a view mudar
  );

  // VANTA_CONTEXT: Título dinâmico baseado na unidade ou evento em foco
  const brandTitle = React.useMemo(() => {
    if (isMaster) return "VANTA";

    // 1. Prioridade: Nome do Evento (Se estiver em Mission Control ou Portaria específica)
    if (targetEventId) {
      const ev = events.find(e => e.id === targetEventId);
      if (ev) return ev.title;
    }

    // 2. Segunda Prioridade: Nome da Unidade / Comunidade
    if (logic.selectedCommunityId) {
      const comm = logic.communities.find(c => c.id === logic.selectedCommunityId);
      if (comm) return comm.name;
    }

    return "VANTA";
  }, [isMaster, targetEventId, logic.selectedCommunityId, logic.communities, events]);

  // VANTA_ROUTING: Direcionamento Inteligente na Entrada
  React.useEffect(() => {
    const performInitialRouting = async () => {
      if (!isRouting) return;

      if (isMaster) {
        setIsRouting(false);
        return;
      }

      await logic.loadCommunities();

      if (['vanta_prod', 'produtor', 'vanta_socio', 'socio', 'vanta_financeiro'].includes(effectiveRole)) {
        if (logic.communities.length === 1) {
          logic.setSelectedCommunityId(logic.communities[0].id);
          setActiveView(effectiveRole === 'vanta_financeiro' ? 'FINANCEIRO' : 'MANAGE_UNIDADE');
        } else {
          setActiveView('COMUNIDADES');
        }
        setIsRouting(false);
        return;
      }

      if (['vanta_portaria', 'portaria', 'vanta_promoter', 'promoter', 'vanta_staff'].includes(effectiveRole)) {
        const myEvents = events.filter(e => (e.staff || []).some(s => s.id === currentUser.id));
        if (myEvents.length === 1) {
           setTargetEventId(myEvents[0].id);
           setActiveView('EVENT_MISSION');
        } else {
           setActiveView('PORTARIA');
        }
        setIsRouting(false);
        return;
      }

      setIsRouting(false);
    };

    performInitialRouting();
  }, [effectiveRole, isMaster, logic.communities.length, events.length]);

  /**
   * VANTA_CONTEXT: Mapeamento de permissões para cada visão administrativa.
   */
  const permissionMap: Partial<Record<AdminView, string>> = {
    'MEMBROS': 'list_view',
    'CURADORIA': 'list_view',
    'INDICA': 'unit_edit',
    'COMUNIDADES': 'unit_edit',
    'MANAGE_UNIDADE': 'unit_edit',
    'CREATE_EVENTO': 'event_edit',
    'EDIT_EVENTO': 'event_edit',
    'PORTARIA': 'list_checkin',
    'STAFF_TEMPLATES': 'unit_staff',
    'FINANCEIRO': 'unit_finance',
    'ETICA': 'unit_staff',
    'TEAM': 'unit_staff',
    'UNIT_STAFF_MGMT': 'unit_staff',
    'EVENT_MISSION': 'list_view'
  };

  // VANTA_PERMISSIONS: Proteção de Rota Soberana baseada em Contexto
  React.useEffect(() => {
    if (activeView === 'HUB' || isRouting) return;
    if (isMaster) return;

    const requiredPermission = permissionMap[activeView];
    if (requiredPermission) {
      const hasPermission = logic.checkPermission(requiredPermission, logic.selectedCommunityId || undefined);
      if (!hasPermission) {
        console.warn(`[VANTA SECURITY] Jurisdição negada para visão: ${activeView}`);
        setActiveView('HUB');
      }
    }
  }, [activeView, logic.currentUserUnitPermissions, logic.selectedCommunityId, isMaster, isRouting]);

  React.useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [activeView, targetEventId]);

  React.useEffect(() => {
    (window as any).__VANTA_EVENT_REDIREC__ = (id: string) => {
      setTargetEventId(id);
      setActiveView('EVENT_MISSION'); 
    };
    (window as any).__VANTA_NAV_TO__ = (view: AdminView) => setActiveView(view);
    return () => { 
      delete (window as any).__VANTA_EVENT_REDIREC__; 
      delete (window as any).__VANTA_NAV_TO__;
    };
  }, []);

  const renderHeader = (title: string, onBack?: () => void) => (
    <header className="px-6 pt-14 pb-6 bg-zinc-950 border-b border-white/5 flex justify-between items-center shrink-0">
      {onBack ? (
        <button onClick={onBack} className="flex items-center gap-2 text-[9px] font-black uppercase text-[#d4af37]">
          <ICONS.ArrowLeft className="w-4 h-4" /> Voltar
        </button>
      ) : (
        <div className="flex items-center gap-2 overflow-hidden">
           <h1 className="text-xl font-serif italic tracking-tighter truncate max-w-[180px]">
            {brandTitle} <span className="text-[#d4af37]">ADMIN</span>
           </h1>
           {isMaster && (
             <div className="px-2 py-0.5 bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-full shrink-0">
               <span className="text-[5px] text-[#d4af37] font-black uppercase tracking-widest">Sovereign Mode</span>
             </div>
           )}
        </div>
      )}
      {!onBack && <button onClick={onExit} className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[8px] font-black uppercase shrink-0">Sair</button>}
      <h1 className="text-[9px] font-black text-zinc-500 uppercase truncate max-w-[100px] text-right">{title}</h1>
    </header>
  );

  if (isRouting) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center text-white">
        <div className="w-8 h-8 border-2 border-white/10 border-t-[#d4af37] rounded-full animate-spin mb-4"></div>
        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-500">Sincronizando Identidade...</p>
      </div>
    );
  }

  const isAuthorized = !permissionMap[activeView] || isMaster || logic.checkPermission(permissionMap[activeView]!, logic.selectedCommunityId || undefined);
  const viewToRender = isAuthorized ? activeView : 'HUB';

  return (
    <div className="h-screen bg-black flex flex-col text-white overflow-hidden">
      {renderHeader(viewToRender === 'HUB' ? "HUB CENTRAL" : viewToRender.replace('_', ' '), (viewToRender === 'HUB' || !isMaster) ? undefined : () => setActiveView('HUB'))}

      <main ref={mainRef} className="flex-1 overflow-y-auto no-scrollbar p-6 pb-48">
        {viewToRender === 'HUB' && <AdminHome userRole={effectiveRole} setActiveView={setActiveView} currentUser={currentUser} />}
        {viewToRender === 'INDICA' && <AdminIndica events={events} />}
        {viewToRender === 'CURADORIA' && <AdminCuratorship {...logic} />}
        {(['COMUNIDADES', 'CREATE_UNIDADE', 'EDIT_UNIDADE', 'MANAGE_UNIDADE'].includes(viewToRender)) && (
          <AdminCommunities 
            view={viewToRender === 'COMUNIDADES' ? 'LIST' : viewToRender === 'CREATE_UNIDADE' ? 'CREATE' : viewToRender === 'EDIT_UNIDADE' ? 'EDIT' : 'MANAGE'}
            {...logic}
            isMaster={isMaster}
            currentUser={{...currentUser, role: effectiveRole}}
            events={events}
            setActiveView={setActiveView}
            setEventForm={logic.setEventForm}
            onSelectEventForStaff={(id) => { setTargetEventId(id); setActiveView('EVENT_MISSION'); }}
          />
        )}
        {viewToRender === 'FINANCEIRO' && logic.selectedCommunityId && (
          <div className="space-y-10 animate-in fade-in duration-700">
             <div className="flex flex-col gap-1 px-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#d4af37] italic">CONTROLE DE CAIXA</h3>
                <p className="text-2xl font-serif italic text-white tracking-tighter uppercase">Inteligência Financeira</p>
             </div>
             {/* Componente Financeiro Integrado */}
             {/* <AdminFinance communityId={logic.selectedCommunityId} /> */}
             <div className="p-8 bg-zinc-900/40 border border-dashed border-white/5 rounded-[2.5rem] text-center">
                <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Módulo financeiro em processamento de segurança.</p>
             </div>
          </div>
        )}
        {viewToRender === 'EVENTOS' && (
          <AdminEvents 
            currentUser={currentUser}
            selectedCommunityId={logic.selectedCommunityId}
            communities={logic.communities}
            events={events}
            eventForm={logic.eventForm}
            setEventForm={logic.setEventForm}
            handleCreateEvent={logic.handleCreateEvent}
            handleUpdateEvent={logic.handleUpdateEvent}
            eventImageInputRef={logic.eventImageInputRef}
            handleFileSelect={logic.handleFileSelect}
            isProcessing={logic.isProcessing}
            showBatchEditor={logic.showBatchEditor}
            setShowBatchEditor={logic.setShowBatchEditor}
            tempBatch={logic.tempBatch}
            setTempBatch={logic.setTempBatch}
            tempVariation={logic.tempVariation}
            setTempVariation={logic.setTempVariation}
            addVariationToBatch={logic.addVariationToBatch}
            confirmBatch={logic.confirmBatch}
            handleAddStaff={logic.handleAddStaff}
            handleRemoveStaff={logic.handleRemoveStaff}
            handleAddLegoRule={logic.handleAddLegoRule}
            handleRemoveLegoRule={logic.handleRemoveLegoRule}
            unitStaff={logic.unitStaff}
          />
        )}
        {(viewToRender === 'CREATE_EVENTO' || viewToRender === 'EDIT_EVENTO') && (
          <AdminEvents
            isEditing={viewToRender === 'EDIT_EVENTO'}
            currentUser={currentUser}
            selectedCommunityId={logic.selectedCommunityId}
            communities={logic.communities}
            events={events}
            eventForm={logic.eventForm}
            setEventForm={logic.setEventForm}
            handleCreateEvent={async () => {
              const success = await logic.handleCreateEvent();
              if (success) setActiveView('MANAGE_UNIDADE');
            }}
            handleUpdateEvent={async () => {
              const success = await logic.handleUpdateEvent();
              if (success) setActiveView('MANAGE_UNIDADE');
            }}
            eventImageInputRef={logic.eventImageInputRef}
            handleFileSelect={logic.handleFileSelect}
            isProcessing={logic.isProcessing}
            showBatchEditor={logic.showBatchEditor}
            setShowBatchEditor={logic.setShowBatchEditor}
            tempBatch={logic.tempBatch}
            setTempBatch={logic.setTempBatch}
            tempVariation={logic.tempVariation}
            setTempVariation={logic.setTempVariation}
            addVariationToBatch={logic.addVariationToBatch}
            confirmBatch={logic.confirmBatch}
            handleAddStaff={logic.handleAddStaff}
            handleRemoveStaff={logic.handleRemoveStaff}
            handleAddLegoRule={logic.handleAddLegoRule}
            handleRemoveLegoRule={logic.handleRemoveLegoRule}
            unitStaff={logic.unitStaff}
          />
        )}
        {viewToRender === 'MEMBROS' && <AdminMembers />}
        {viewToRender === 'PORTARIA' && <AdminPortaria events={events} currentUser={currentUser} />}
        {viewToRender === 'EVENT_MISSION' && targetEventId && (
          <EventMissionControl 
            eventId={targetEventId} 
            currentUser={currentUser} 
            events={events}
            onBack={() => {
              setTargetEventId(null);
              // Se eu era promoter ou staff, volto para portaria ou hub. Se unit manager, para manage unit.
              if (['vanta_promoter', 'promoter', 'vanta_staff'].includes(effectiveRole)) {
                setActiveView('PORTARIA');
              } else {
                setActiveView('MANAGE_UNIDADE');
              }
            }} 
          />
        )}
        {viewToRender === 'BROADCASTER' && <AdminBroadcaster events={events} currentUser={currentUser} />}
        {viewToRender === 'DIAGNOSTICO' && <AdminConnectionTest />}
        {viewToRender === 'ETICA' && (
          <EthicsWarRoom 
            currentUser={currentUser} 
            communityId={logic.selectedCommunityId || undefined} 
            communities={logic.communities}
          />
        )}
        {viewToRender === 'STAFF_TEMPLATES' && (
          <AdminStaffTemplates 
            currentUser={currentUser} 
            selectedCommunityId={logic.selectedCommunityId} 
            communities={logic.communities} 
          />
        )}
        {viewToRender === 'GLOBAL_TAGS' && <AdminGlobalTags currentUser={currentUser} />}
        {viewToRender === 'TEAM' && <AdminTeamManagement currentUser={currentUser} />}
        {viewToRender === 'UNIT_STAFF_MGMT' && logic.selectedCommunityId && (
          <UnitStaffManagement 
            communityId={logic.selectedCommunityId} 
            currentUser={currentUser}
            onBack={() => setActiveView('MANAGE_UNIDADE')}
          />
        )}
        {viewToRender === 'PERMISSOES' && (
          <div className="py-20 text-center opacity-30 border border-dashed border-white/5 rounded-[3rem]">
             <p className="text-[8px] text-zinc-500 font-black uppercase">Módulo em desenvolvimento.</p>
          </div>
        )}
      </main>

      {/* VANTA_CROPPER: Global Overlay for Image Processing */}
      {logic.cropState.isOpen && (
        <VantaImageCropper 
          imageSrc={logic.cropState.src}
          onConfirm={logic.handleCropConfirm}
          onCancel={logic.handleCropCancel}
          aspectRatio={logic.cropState.aspectRatio}
          maskShape={logic.cropState.maskShape}
        />
      )}
    </div>
  );
};