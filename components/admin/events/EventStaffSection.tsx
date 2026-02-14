
import React from 'react';
import { StaffMember } from '../../../types';
import { VantaAvatar } from '../../VantaAvatar';

interface EventStaffSectionProps {
  unitStaff: any[];
  eventForm: any;
  setEventForm: (form: any) => void;
  handleRestrictedAction: (action: () => void) => void;
}

export const EventStaffSection: React.FC<EventStaffSectionProps> = ({
  unitStaff,
  eventForm,
  setEventForm,
  handleRestrictedAction
}) => {

  const updateStaffVipQuota = (memberId: string, quota: number) => {
    setEventForm((prev: any) => ({
      ...prev,
      staff: prev.staff.map((s: StaffMember) => s.id === memberId ? { ...s, vipQuota: quota } : s)
    }));
  };

  const toggleUnitStaffInheritance = (member: any) => {
    const isAlreadyIn = (eventForm.staff || []).some((s: any) => s.id === member.id);
    if (isAlreadyIn) {
      // Remove
      setEventForm((prev: any) => ({ 
        ...prev, 
        staff: (prev.staff || []).filter((s: StaffMember) => s.id !== member.id) 
      }));
    } else {
      // Add
      const newStaff: StaffMember = {
        id: member.id,
        email: member.email || member.instagram_handle || 'membro@vanta.com',
        role: member.role || 'VANTA_STAFF',
        status: 'PENDING',
        vipQuota: 0
      };
      setEventForm((prev: any) => ({ ...prev, staff: [...(prev.staff || []), newStaff] }));
    }
  };

  return (
    <div className="space-y-8 p-8 bg-zinc-950 border border-white/5 rounded-[3rem] shadow-inner">
       <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
             <h3 className="text-[8px] font-black uppercase tracking-[0.4em] text-[#d4af37]">03. STAFF DA COMUNIDADE</h3>
             <span className="px-2 py-0.5 bg-[#d4af37]/10 text-[#d4af37] text-[5px] font-black uppercase rounded-full border border-[#d4af37]/20">Auto-Protocolo Ativo</span>
          </div>
          <p className="text-lg font-serif italic text-white">Equipe da Casa</p>
       </div>
       
       <div className="grid grid-cols-1 gap-3">
          {unitStaff.length > 0 ? unitStaff.map((member) => {
            const staffEntry = (eventForm.staff || []).find((s: any) => s.id === member.id);
            const isActive = !!staffEntry;
            const isConfirmed = staffEntry?.status === 'CONFIRMED';
            
            return (
              <div key={member.id} className={`p-4 rounded-2xl border transition-all flex flex-col gap-4 ${isActive ? 'bg-white/5 border-[#d4af37]/30' : 'bg-black border-white/5 opacity-40 grayscale'}`}>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full border border-white/10 p-0.5 overflow-hidden">
                         <VantaAvatar src={member.avatar_url} gender={member.gender} />
                       </div>
                       <div className="flex flex-col">
                         <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-white uppercase tracking-widest">{member.full_name}</span>
                            <span className="text-[5px] text-[#d4af37] font-black uppercase">Escala Fixa</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <span className="text-[6px] text-zinc-500 uppercase font-black">{member.role}</span>
                            {isActive && (
                              <span className={`text-[5px] font-black px-1.5 py-0.5 rounded-full ${isConfirmed ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                                {isConfirmed ? 'CONFIRMADO' : 'NOTIFICAÇÃO PENDENTE'}
                              </span>
                            )}
                         </div>
                       </div>
                    </div>
                    <button 
                      onClick={() => handleRestrictedAction(() => toggleUnitStaffInheritance(member))}
                      className={`w-10 h-6 rounded-full relative transition-all ${isActive ? 'bg-[#d4af37]' : 'bg-zinc-800'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isActive ? 'left-5' : 'left-1'}`}></div>
                    </button>
                 </div>

                 {isActive && (
                   <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      <label className="text-[7px] text-zinc-600 font-black uppercase tracking-widest">Cota Cortesia (VIP)</label>
                      <input 
                        type="number"
                        value={staffEntry.vipQuota || 0}
                        onChange={(e) => updateStaffVipQuota(member.id, parseInt(e.target.value) || 0)}
                        className="w-16 bg-black border border-white/10 rounded-lg p-2 text-[10px] text-center text-white outline-none focus:border-[#d4af37]/40"
                        min="0"
                      />
                   </div>
                 )}
              </div>
            );
          }) : <div className="py-8 text-center opacity-20 border border-dashed border-white/5 rounded-2xl"><p className="text-[8px] font-black uppercase">Nenhuma equipe fixa encontrada.</p></div>}
       </div>
    </div>
  );
};
