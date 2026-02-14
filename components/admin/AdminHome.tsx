import React, { useState, useEffect } from 'react';
import { User, isVantaMaster } from '../../types';
import { supabase } from '../../lib/supabaseClient';

interface AdminHomeProps {
  userRole: string;
  setActiveView: (view: any) => void;
  currentUser: User;
}

export const AdminHome: React.FC<AdminHomeProps> = ({ userRole, setActiveView, currentUser }) => {
  const roleLower = userRole.toLowerCase();
  const isMaster = isVantaMaster(currentUser);
  const [hasAnyContextPermission, setHasAnyContextPermission] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isMaster || !supabase) return;

    const loadAggregatedPermissions = async () => {
      const { data } = await supabase
        .from('community_staff')
        .select('permissions')
        .eq('user_id', currentUser.id);
      
      if (data) {
        const aggregated: Record<string, boolean> = {};
        data.forEach(row => {
          Object.entries(row.permissions || {}).forEach(([key, val]) => {
            if (val) aggregated[key] = true;
          });
        });
        setHasAnyContextPermission(aggregated);
      }
    };
    loadAggregatedPermissions();
  }, [currentUser.id, isMaster]);

  const actions = [
    { id: 'TEAM', label: 'Time Vanta', icon: '👔', roles: ['admin', 'master', 'vanta_master'], permissionId: 'unit_staff' },
    { id: 'MEMBROS', label: 'Membros', icon: '👥', roles: ['admin', 'master', 'vanta_master'], permissionId: 'list_view' },
    { id: 'CURADORIA', label: 'Curadoria', icon: '✨', roles: ['admin', 'master', 'vanta_master'], permissionId: 'list_view' },
    { id: 'INDICA', label: 'Vanta Indica', icon: '🌟', roles: ['admin', 'master', 'vanta_master'], permissionId: 'unit_edit' },
    { id: 'COMUNIDADES', label: 'Comunidades', icon: '🌐', roles: ['admin', 'master', 'vanta_master', 'vanta_prod', 'produtor', 'vanta_socio'], permissionId: 'unit_edit' },
    { id: 'EVENTOS', label: 'Eventos', icon: '🎟️', roles: ['admin', 'master', 'vanta_master', 'vanta_prod', 'produtor', 'vanta_socio'], permissionId: 'event_view' },
    { id: 'PORTARIA', label: 'Portaria', icon: '🔍', roles: ['admin', 'master', 'vanta_master', 'vanta_portaria', 'portaria', 'vanta_staff'], permissionId: 'list_checkin' },
    { id: 'BROADCASTER', label: 'Broadcaster', icon: '💎', roles: ['admin', 'master', 'vanta_master'] },
    
    { id: 'STAFF_TEMPLATES', label: 'Staff', icon: '🛠️', roles: ['admin', 'master', 'vanta_master', 'vanta_prod', 'produtor', 'vanta_socio'], permissionId: 'unit_staff' },
    { id: 'GLOBAL_TAGS', label: 'Tags', icon: '🏷️', roles: ['admin', 'master', 'vanta_master'] },
    
    { id: 'DIAGNOSTICO', label: 'Diagnóstico', icon: '🚨', roles: ['admin', 'master', 'vanta_master'] },
    { id: 'FINANCEIRO', label: 'Financeiro', icon: '💰', roles: ['admin', 'master', 'vanta_master', 'vanta_prod', 'produtor', 'vanta_socio', 'vanta_financeiro'], permissionId: 'unit_finance' },
    { id: 'PERMISSOES', label: 'Permissões', icon: '🔑', roles: ['admin', 'master', 'vanta_master', 'vanta_prod', 'vanta_socio'], permissionId: 'unit_staff' },
    { id: 'ETICA', label: 'Ética', icon: '⚖️', roles: ['admin', 'master', 'vanta_master', 'vanta_prod', 'vanta_socio', 'vanta_portaria'], permissionId: 'unit_staff' },
  ];

  const filteredActions = actions.filter(action => {
    if (isMaster) return true;
    const hasRole = action.roles.includes(roleLower);
    if (action.permissionId) {
      const hasGlobalPerm = !!currentUser.permissions?.[action.permissionId];
      const hasContextPerm = !!hasAnyContextPermission[action.permissionId];
      return hasRole && (hasGlobalPerm || hasContextPerm);
    }
    return hasRole;
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="grid grid-cols-2 gap-4">
        {filteredActions.map(action => (
          <button 
            key={action.id} 
            onClick={() => setActiveView(action.id)}
            className="aspect-square p-8 bg-zinc-900/40 border border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 active:scale-95 transition-all hover:bg-zinc-800/60 group relative overflow-hidden"
          >
            {['CURADORIA', 'BROADCASTER', 'GLOBAL_TAGS', 'MEMBROS', 'TEAM'].includes(action.id) && (
              <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
                 <span className="text-[10px]">👑</span>
              </div>
            )}
            
            {action.id === 'ETICA' && (
              <div className="absolute inset-0 bg-red-600/5 group-hover:bg-red-600/10 transition-colors pointer-events-none" />
            )}

            <span className={`text-3xl ${action.id === 'ETICA' ? 'drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]' : ''}`}>
              {action.icon}
            </span>
            <span className={`text-[9px] font-black uppercase tracking-widest text-center ${action.id === 'ETICA' ? 'text-red-500' : 'text-zinc-400'}`}>
              {action.label}
            </span>
          </button>
        ))}
      </div>
      
      {filteredActions.length === 0 && (
        <div className="py-32 text-center opacity-30 border border-dashed border-white/5 rounded-[3rem]">
           <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em]">Nenhum comando liberado para sua identidade.</p>
        </div>
      )}
    </div>
  );
};