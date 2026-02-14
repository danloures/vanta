
import { useState, useEffect, useMemo } from 'react';
import { Event, GuestEntry, User, GuestListRule, StaffMember } from '../types';
import { fetchEventGuests, checkInGuest, addGuestToEventList } from '../lib/guestListApi';
import { isEventExpired } from '../lib/eventsApi';
import { sortRulesByTimeline } from '../lib/accessRulesLogic';
import { vantaFeedback } from '../lib/feedbackStore';

export const usePortariaLogic = (selectedEvent: Event | null, currentUser: User) => {
  const [now, setNow] = useState(new Date());
  const [genderFilter, setGenderFilter] = useState<'M' | 'F' | 'ALL'>('ALL');
  const [guests, setGuests] = useState<GuestEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [bulkText, setBulkText] = useState('');
  const [selectedRuleId, setSelectedRuleId] = useState('');

  const roleLower = currentUser.role.toLowerCase();
  const isSocio = ['vanta_socio', 'socio'].includes(roleLower);
  const isPortaria = ['vanta_portaria', 'portaria'].includes(roleLower);
  const isPromoter = ['vanta_promoter', 'promoter'].includes(roleLower);
  const isProd = ['vanta_prod', 'produtor'].includes(roleLower);
  const isMaster = ['admin', 'master', 'vanta_master'].includes(roleLower);
  
  const canCheckIn = isPortaria || isMaster;

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const loadGuests = async () => {
    if (!selectedEvent) return;
    setIsSyncing(true);
    try {
      const data = await fetchEventGuests(selectedEvent.id);
      if (isPromoter) {
        setGuests(data.filter(g => g.addedByEmail === currentUser.email));
      } else {
        setGuests(data);
      }
    } catch (err) {
      console.error("[VANTA PORTARIA] Erro ao sincronizar convidados:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (selectedEvent) {
      loadGuests();
    }
  }, [selectedEvent?.id]);

  const handleCheckIn = async (guest: GuestEntry) => {
    if (!selectedEvent || !canCheckIn) return;
    const success = await checkInGuest(guest.id, selectedEvent.id, currentUser.email);
    if (success) {
      setGuests(prev => prev.map(g => g.id === guest.id ? { ...g, checkedIn: true, checkInTime: Date.now() } : g));
      vantaFeedback.toast('success', 'Check-in Realizado', `${guest.name} está na casa.`);
    }
  };

  const handleBulkAddGuests = async () => {
    if (!selectedEvent || !selectedRuleId || !bulkText.trim()) return;

    const names = bulkText.split('\n').map(n => n.trim()).filter(n => n.length > 2);
    if (names.length === 0) return;

    if (isPromoter) {
      const staffInfo = (selectedEvent.staff || []).find(s => s.id === currentUser.id);
      const limitObj = staffInfo?.promoterLimits?.find(pl => pl.ruleId === selectedRuleId);
      const alreadyAdded = guests.filter(g => g.ruleId === selectedRuleId && g.addedByEmail === currentUser.email).length;
      const remaining = (limitObj?.limit || 0) - alreadyAdded;

      if (names.length > remaining) {
        vantaFeedback.toast('warning', 'Limite Insuficiente', `Sua cota permite apenas mais ${remaining} nomes.`);
        return;
      }
    }

    setIsSyncing(true);
    try {
      for (const name of names) {
        await addGuestToEventList({
          eventId: selectedEvent.id,
          ruleId: selectedRuleId,
          name: name,
          addedByEmail: currentUser.email
        });
      }
      setBulkText('');
      await loadGuests();
      vantaFeedback.toast('success', 'Lista Protocolada', `${names.length} nomes inseridos com sucesso.`);
    } catch (err) {
      vantaFeedback.toast('error', 'Falha no Protocolo', 'Erro ao processar lista em lote.');
    } finally {
      setIsSyncing(false);
    }
  };

  const reportData = useMemo(() => {
    if (!selectedEvent || guests.length === 0) return null;
    
    const totalGuests = guests.length;
    const checkedInCount = guests.filter(g => g.checkedIn).length;
    const occupancy = totalGuests > 0 ? (checkedInCount / totalGuests) * 100 : 0;

    const ruleStats = (selectedEvent.guestListRules || []).map(rule => {
      const ruleGuests = guests.filter(g => g.ruleId === rule.id);
      return {
        id: rule.id,
        label: `${rule.type} ${rule.gender} (${rule.area})`,
        total: ruleGuests.length,
        entries: ruleGuests.filter(g => g.checkedIn).length
      };
    }).filter(s => s.total > 0);

    const promoterRanking = [...new Set(guests.map(g => g.addedByEmail).filter(Boolean))]
      .map(email => {
        const myGuests = guests.filter(g => g.addedByEmail === email);
        const myEntries = myGuests.filter(g => g.checkedIn).length;
        return {
          email: (email as string).split('@')[0].toUpperCase(),
          fullEmail: email as string,
          total: myGuests.length,
          entries: myEntries,
          conversion: myGuests.length > 0 ? (myEntries / myGuests.length) * 100 : 0
        };
      })
      .sort((a, b) => b.entries - a.entries);

    return { totalGuests, checkedInCount, occupancy, ruleStats, promoterRanking };
  }, [guests, selectedEvent]);

  const timelineRules = useMemo(() => sortRulesByTimeline(selectedEvent?.guestListRules || []), [selectedEvent?.guestListRules]);
  
  const filteredTimeline = useMemo(() => timelineRules.filter(r => {
    if (genderFilter === 'ALL') return true;
    const g = r.gender.toString().charAt(0).toUpperCase();
    return g === genderFilter;
  }), [timelineRules, genderFilter]);

  const filteredGuests = useMemo(() => guests.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPromoter = !isPromoter || g.addedByEmail === currentUser.email;
    return matchesSearch && matchesPromoter;
  }), [guests, searchQuery, isPromoter, currentUser.email]);

  return {
    now,
    genderFilter,
    setGenderFilter,
    guests,
    searchQuery,
    setSearchQuery,
    isSyncing,
    loadGuests,
    handleCheckIn,
    reportData,
    filteredTimeline,
    filteredGuests,
    isSocio,
    isPortaria,
    isPromoter,
    isProd,
    isMaster,
    canCheckIn,
    bulkText,
    setBulkText,
    selectedRuleId,
    setSelectedRuleId,
    handleBulkAddGuests
  };
};
