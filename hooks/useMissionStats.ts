
import { useState, useEffect, useMemo } from 'react';
import { Event } from '../types';
import { fetchEventGuests } from '../lib/guestListApi';

export const useMissionStats = (eventId: string, event?: Event) => {
  const [guests, setGuests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMissionData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchEventGuests(eventId);
      setGuests(data);
    } catch (err) {
      console.error("[MISSION CONTROL HOOK] Erro ao carregar dados:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMissionData();
  }, [eventId]);

  const stats = useMemo(() => {
    const checkedInGuests = guests.filter(g => g.checkedIn);
    const checkedIn = checkedInGuests.length;
    const total = guests.length;
    const conversion = total > 0 ? (checkedIn / total) * 100 : 0;
    
    // Valor médio estimado VANTA
    const revenue = checkedIn * 150; 

    // 1. Lógica Vibe-Check (M vs F)
    let male = 0;
    let female = 0;
    checkedInGuests.forEach(g => {
      const rule = (event?.guestListRules || []).find(r => r.id === g.ruleId);
      if (rule) {
        const gChar = rule.gender.toString().charAt(0).toUpperCase();
        if (gChar === 'F') female++;
        else if (gChar === 'M') male++;
      }
    });
    
    const vibeTotal = male + female || 1;
    const vibe = {
      femalePct: (female / vibeTotal) * 100,
      malePct: (male / vibeTotal) * 100,
      female,
      male
    };

    // 2. Ranking de Promoters (Eficiência)
    const promoterMap = new Map();
    guests.forEach(g => {
      const email = g.addedByEmail;
      if (!promoterMap.has(email)) promoterMap.set(email, { total: 0, checked: 0 });
      const current = promoterMap.get(email);
      current.total++;
      if (g.checkedIn) current.checked++;
    });

    const promoterPerformance = Array.from(promoterMap.entries()).map(([email, data]) => ({
      name: email.split('@')[0].toUpperCase(),
      efficiency: (data.checked / data.total) * 100,
      in: data.checked,
      total: data.total
    })).sort((a, b) => b.efficiency - a.efficiency).slice(0, 5);

    // 3. Mix de Acesso (Top Regras)
    const ruleDistribution = (event?.guestListRules || []).map(rule => ({
      label: `${rule.type} ${rule.gender}`,
      count: checkedInGuests.filter(g => g.ruleId === rule.id).length
    })).sort((a, b) => b.count - a.count).slice(0, 3);

    return { 
      checkedIn, 
      total, 
      conversion, 
      revenue, 
      vibe, 
      promoterPerformance, 
      ruleDistribution 
    };
  }, [guests, event]);

  return { 
    guests, 
    isLoading, 
    stats, 
    refresh: loadMissionData 
  };
};
