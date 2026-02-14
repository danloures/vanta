import { supabase } from './supabaseClient';
import { uploadToVantaStorage } from '../features/profile/profileUtils';
import { TicketTransfer } from '../types';
import { notificationStore } from './notificationStore';

export interface VantaTicket {
  id: string;
  user_id: string;
  event_id: string;
  variation_id: string;
  status: 'active' | 'used' | 'cancelled' | 'transfer_pending';
  source: 'purchase' | 'benefit' | 'gift' | 'complimentary';
  hash: string;
  created_at: string;
  promoter_id?: string;
  guest_cpf?: string;
  guest_name?: string;
}

/**
 * VANTA_INVENTORY: Retorna o mapa de vendas por variação para um evento.
 */
export async function getSalesCounts(eventId: string): Promise<Record<string, number>> {
  if (!supabase) return {};
  
  const { data, error } = await supabase
    .from('user_tickets')
    .select('variation_id')
    .eq('event_id', eventId)
    .neq('status', 'cancelled');

  if (error || !data) return {};

  const counts: Record<string, number> = {};
  data.forEach(t => {
    if (t.variation_id) {
      counts[t.variation_id] = (counts[t.variation_id] || 0) + 1;
    }
  });
  return counts;
}

/**
 * VANTA_GIFT: Verifica quantos convites um CPF já ativou para um evento (Limite 2).
 */
export async function checkCpfLimit(eventId: string, cpf: string): Promise<number> {
  if (!supabase) return 0;
  const { count } = await supabase
    .from('user_tickets')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('guest_cpf', cpf);
  return count || 0;
}

/**
 * VANTA_SECURITY: Valida a titularidade do ingresso (Nome e CPF) para liberar o QR Code.
 * Reforçado para checar limite de CPF em cortesias pendentes.
 */
export async function validateTicketOwnership(params: {
  ticketId: string;
  guestName: string;
  guestCpf: string;
}): Promise<{ success: boolean; message: string }> {
  if (!supabase) return { success: false, message: "Erro de conexão" };

  try {
    // 1. Busca dados do ticket para verificar a fonte
    const { data: ticket, error: fetchError } = await supabase
      .from('user_tickets')
      .select('event_id, source')
      .eq('id', params.ticketId)
      .single();

    if (fetchError || !ticket) throw new Error("Ingresso não encontrado.");

    // 2. Se for cortesia, aplica a trava de segurança de CPF
    if (ticket.source === 'complimentary') {
      const cleanCpf = params.guestCpf.replace(/\D/g, '');
      const used = await checkCpfLimit(ticket.event_id, cleanCpf);
      if (used >= 2) {
        return { success: false, message: "Protocolo Negado: Limite de 2 cortesias por CPF atingido para este evento." };
      }
    }

    const { error } = await supabase
      .from('user_tickets')
      .update({
        guest_name: params.guestName.toUpperCase(),
        guest_cpf: params.guestCpf.replace(/\D/g, '')
      })
      .eq('id', params.ticketId);

    if (error) throw error;
    return { success: true, message: "Titularidade confirmada." };
  } catch (err: any) {
    console.error("[VANTA TICKET SECURITY] Erro na validação:", err);
    return { success: false, message: err.message || "Falha ao validar titularidade." };
  }
}

/**
 * VANTA_GIFT: Emite um convite cortesia vinculado a um promoter (Link Externo).
 */
export async function issueComplimentaryTicket(params: {
  eventId: string;
  promoterId: string;
  guestName: string;
  guestCpf: string;
  userId?: string;
}): Promise<{ success: boolean; message: string }> {
  if (!supabase) return { success: false, message: "Erro de rede" };

  // 1. Validar CPF
  const used = await checkCpfLimit(params.eventId, params.guestCpf);
  if (used >= 2) {
    return { success: false, message: "Protocolo Negado: Limite de convites por CPF atingido." };
  }

  // 2. Validar Cota do Promoter
  const { data: event } = await supabase.from('events').select('staff').eq('id', params.eventId).single();
  const staffMember = event?.staff?.find((s: any) => s.id === params.promoterId);
  
  const { count: issued } = await supabase
    .from('user_tickets')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', params.eventId)
    .eq('promoter_id', params.promoterId)
    .eq('source', 'complimentary');

  if (staffMember && staffMember.vipQuota !== undefined && (issued || 0) >= staffMember.vipQuota) {
    return { success: false, message: "Sua cota cortesia para este evento está esgotada." };
  }

  // 3. Emitir Ticket Black Label
  const hash = btoa(`VIP-${params.promoterId}-${Date.now()}`).substring(0, 14).toUpperCase();
  const { error } = await supabase.from('user_tickets').insert([{
    user_id: params.userId || null,
    event_id: params.eventId,
    promoter_id: params.promoterId,
    guest_name: params.guestName.toUpperCase(),
    guest_cpf: params.guestCpf,
    source: 'complimentary',
    status: 'active',
    hash: hash
  }]);

  if (error) return { success: false, message: "Falha ao gerar protocolo cortesia." };
  return { success: true, message: "Convite Cortesia Ativado com Sucesso." };
}

/**
 * VANTA_GIFT: Envio Direto (Direct Drop) para a carteira de um membro.
 * Cria o ingresso sem validar CPF/Nome, deixando como "Aguardando Validação".
 */
export async function dropComplimentaryTicket(params: {
  eventId: string;
  promoterId: string;
  targetUserId: string;
}): Promise<{ success: boolean; message: string }> {
  if (!supabase) return { success: false, message: "Erro de rede" };

  // 1. Validar Cota do Promoter
  const { data: event } = await supabase.from('events').select('staff, title').eq('id', params.eventId).single();
  const staffMember = event?.staff?.find((s: any) => s.id === params.promoterId);

  const { count: issued } = await supabase
    .from('user_tickets')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', params.eventId)
    .eq('promoter_id', params.promoterId)
    .eq('source', 'complimentary');

  if (staffMember && staffMember.vipQuota !== undefined && (issued || 0) >= staffMember.vipQuota) {
    return { success: false, message: "Sua cota cortesia para este evento está esgotada." };
  }

  // 2. Emitir Ticket (Sem validar CPF ainda)
  const hash = btoa(`VIP-${params.promoterId}-${Date.now()}`).substring(0, 14).toUpperCase();
  const { error } = await supabase.from('user_tickets').insert([{
    user_id: params.targetUserId,
    event_id: params.eventId,
    promoter_id: params.promoterId,
    guest_name: null, // Será preenchido na validação
    guest_cpf: null, // Será preenchido na validação
    source: 'complimentary',
    status: 'active',
    hash: hash
  }]);

  if (error) return { success: false, message: "Falha ao enviar convite." };

  // 3. Notificar o Membro via RPC Soberana
  const { data: promoterProfile } = await supabase.from('profiles').select('full_name').eq('id', params.promoterId).single();
  const promoterName = promoterProfile?.full_name?.split(' ')[0] || 'Um Staff';

  await supabase.rpc('vanta_notify', {
    p_user_id: params.targetUserId,
    p_type: 'event_invite',
    p_text: `Você recebeu um VIP de ${promoterName}`,
    p_member_id: params.promoterId,
    p_event_id: params.eventId,
    p_metadata: { eventId: params.eventId }
  });

  return { success: true, message: "Convite enviado com sucesso para a carteira do membro." };
}

/**
 * Emite um novo convite com trava de segurança de estoque.
 */
export async function issueTicket(params: {
  userId: string;
  eventId: string;
  variationId: string;
  source: 'purchase' | 'benefit' | 'gift';
  limit?: number; // Limite da variação para conferência atômica
}): Promise<{ success: boolean; ticket?: VantaTicket; message?: string }> {
  if (!supabase) return { success: false, message: "Erro de conexão" };

  // 1. Verificação de Estoque em tempo real (Double-Check Guard)
  if (params.limit !== undefined) {
    const counts = await getSalesCounts(params.eventId);
    const sold = counts[params.variationId] || 0;
    if (sold >= params.limit) {
      return { success: false, message: "Este lote acabou de esgotar." };
    }
  }

  const hash = btoa(`${params.userId}-${params.eventId}-${Date.now()}`).substring(0, 12).toUpperCase();

  const { data, error } = await supabase
    .from('user_tickets')
    .insert([{
      user_id: params.userId,
      event_id: params.eventId,
      variation_id: params.variationId,
      source: params.source,
      status: 'active',
      hash: hash,
      // VANTA_SECURITY: Ingressos comprados nascem sem titular definido (requer validação na carteira)
      guest_name: null,
      guest_cpf: null
    }])
    .select()
    .single();

  if (error) {
    console.error("[VANTA TICKETS] Erro ao emitir ticket:", error);
    return { success: false, message: "Erro ao processar ticket." };
  }

  return { success: true, ticket: data };
}

/**
 * Valida um convite na portaria, garantindo que ele pertence ao evento atual.
 */
export async function validateTicket(ticketHash: string, eventId: string): Promise<{ success: boolean; message: string; ticket?: VantaTicket }> {
  if (!supabase) return { success: false, message: "Erro de conexão." };

  const { data, error = null } = await supabase
    .from('user_tickets')
    .select('*')
    .eq('hash', ticketHash.toUpperCase())
    .eq('event_id', eventId)
    .single();

  if (error || !data) {
    return { success: false, message: "Convite inválido para este evento." };
  }

  if (data.status === 'used') {
    return { success: false, message: "Este convite já foi utilizado." };
  }

  if (data.status === 'cancelled') {
    return { success: false, message: "Este convite foi cancelado." };
  }
  
  if (data.status === 'transfer_pending') {
    return { success: false, message: "Convite em processo de transferência." };
  }

  return { success: true, message: "Acesso Liberado.", ticket: data };
}

/**
 * Registra a entrada do membro (Check-in)
 */
export async function redeemTicket(ticketId: string): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('user_tickets')
    .update({ status: 'used', used_at: new Date().toISOString() })
    .eq('id', ticketId);

  return !error;
}

// =============================================================
// GIFT PROTOCOL (P2P Transfers)
// =============================================================

export async function initiateTicketTransfer(
  ticketId: string, 
  senderId: string, 
  receiverId: string, 
  selfieBlob: Blob
): Promise<{ success: boolean; message?: string }> {
  if (!supabase) return { success: false, message: "Erro de conexão." };

  try {
    // 1. Upload da Selfie de Segurança
    const fileName = `transfers/${senderId}_${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from('selfies') 
      .upload(fileName, selfieBlob, { contentType: 'image/jpeg' });
    
    if (uploadError) throw uploadError;
    const { data: { publicUrl } } = supabase.storage.from('selfies').getPublicUrl(fileName);

    // 2. Criar registro de transferência
    const { error: transferError } = await supabase
      .from('ticket_transfers')
      .insert([{
        ticket_id: ticketId,
        sender_id: senderId,
        receiver_id: receiverId,
        security_selfie_url: publicUrl,
        status: 'pending'
      }]);

    if (transferError) throw transferError;

    // 3. Bloquear o ticket original temporariamente (Status atomico)
    const { error: updateError } = await supabase
      .from('user_tickets')
      .update({ status: 'transfer_pending' })
      .eq('id', ticketId);

    if (updateError) throw updateError;

    // 4. Notificar o destinatário via sistema de Inbox RPC Soberana
    await supabase.rpc('vanta_notify', {
      p_user_id: receiverId,
      p_type: 'message',
      p_text: 'Você recebeu um presente de acesso (Gift Protocol).',
      p_member_id: senderId,
      p_event_id: null,
      p_metadata: { action_type: 'gift_transfer' }
    });

    return { success: true };
  } catch (err: any) {
    console.error("[GIFT PROTOCOL] Falha ao iniciar:", err);
    return { success: false, message: err.message || "Falha ao iniciar transferência." };
  }
}

export async function getPendingTransfers(userId: string): Promise<TicketTransfer[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('ticket_transfers')
    .select(`
      *,
      sender:profiles!sender_id(full_name, avatar_url),
      ticket:user_tickets(
        event:events(title, start_at, image_url)
      )
    `)
    .eq('receiver_id', userId)
    .eq('status', 'pending');

  if (error || !data) return [];

  return data.map((t: any) => ({
    id: t.id,
    ticketId: t.ticket_id,
    senderId: t.sender_id,
    receiverId: t.receiver_id,
    status: t.status,
    securitySelfieUrl: t.security_selfie_url,
    createdAt: t.created_at,
    event: {
      title: t.ticket?.event?.title,
      date: new Date(t.ticket?.event?.start_at).toLocaleDateString('pt-BR'),
      image: t.ticket?.event?.image_url
    },
    sender: {
      name: t.sender?.full_name,
      avatar: t.sender?.avatar_url
    }
  }));
}

export async function respondToTransfer(
  transferId: string, 
  action: 'accept' | 'return',
  userId: string
): Promise<{ success: boolean; message?: string }> {
  if (!supabase) return { success: false, message: "Erro de conexão." };

  try {
    const { data: transfer, error: fetchError } = await supabase
      .from('ticket_transfers')
      .select('ticket_id, sender_id, receiver_id')
      .eq('id', transferId)
      .single();

    if (fetchError || !transfer) throw new Error("Transferência não encontrada.");
    if (transfer.receiver_id !== userId) throw new Error("Não autorizado.");

    if (action === 'return') {
      await supabase.from('ticket_transfers').update({ status: 'returned' }).eq('id', transferId);
      await supabase.from('user_tickets').update({ status: 'active' }).eq('id', transfer.ticket_id);
      return { success: true, message: "Presente devolvido." };
    }

    if (action === 'accept') {
      const newHash = btoa(`${userId}-${transfer.ticket_id}-${Date.now()}`).substring(0, 12).toUpperCase();
      await supabase.from('ticket_transfers').update({ status: 'accepted' }).eq('id', transferId);
      
      // VANTA_SECURITY: Resetar titularidade ao aceitar transferência (Novo dono deve validar)
      const { error: ticketUpdateError } = await supabase
        .from('user_tickets')
        .update({ 
          user_id: userId, 
          hash: newHash, 
          status: 'active',
          source: 'gift',
          guest_name: null,
          guest_cpf: null
        })
        .eq('id', transfer.ticket_id);

      if (ticketUpdateError) throw ticketUpdateError;
      return { success: true, message: "Acesso aceito e adicionado à sua carteira." };
    }

    return { success: false };
  } catch (err: any) {
    console.error("[GIFT PROTOCOL] Falha na resposta:", err);
    return { success: false, message: err.message };
  }
}

/**
 * VANTA_GIFT_SIGNAL: Executa o check-in de um ticket e sinaliza o promoter original.
 */
export async function redeemComplimentaryTicket(ticketId: string, staffEmail: string): Promise<boolean> {
  if (!supabase) return false;

  const { data: ticket, error: fetchErr } = await supabase
    .from('user_tickets')
    .select('*, events(title)')
    .eq('id', ticketId)
    .single();

  if (fetchErr || !ticket) return false;

  const { error } = await supabase
    .from('user_tickets')
    .update({ status: 'used', used_at: new Date().toISOString() })
    .eq('id', ticketId);

  if (!error && ticket.promoter_id) {
    // Sinalização em Tempo Real para o Promoter via notificationStore (que agora usa RPC)
    await notificationStore.addNotification('guest_arrival', ticket.promoter_id, 'Protocolo de Recepção', {
      guestName: ticket.guest_name,
      eventTitle: (ticket as any).events?.title,
      action_type: 'guest_arrival'
    });
  }

  return !error;
}