
import { supabase } from './supabaseClient';
import { 
  IncidenceReport, 
  IncidenceStatus, 
  VerdictChoice,
  IncidenceProof // Imported from types to fix definition mismatch
} from '../types';

/**
 * VANTA_ETHICS_API: Interfaces internas de suporte (Dossiê e Votos)
 */
// Removed local IncidenceProof definition as it is now centrally managed in types.ts

export interface CouncilVote {
  id: string;
  reportId: string;
  voterId: string;
  choice: VerdictChoice;
  weight: number;
  createdAt: string;
}

/**
 * Busca todos os chamados de incidência filtrados por status.
 * Realiza o JOIN com perfis para exibição de nomes e avatares.
 */
export async function fetchIncidences(status?: IncidenceStatus[]): Promise<IncidenceReport[]> {
  if (!supabase) return [];

  let query = supabase
    .from('incidence_reports')
    .select(`
      *,
      subject:profiles!subject_id(full_name, avatar_url, instagram_handle),
      reporter:profiles!reporter_id(full_name)
    `)
    .order('created_at', { ascending: false });

  if (status && status.length > 0) {
    query = query.in('status', status);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[VANTA ETHICS] Erro ao listar chamados:", error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    communityId: row.community_id,
    reporterId: row.reporter_id,
    subjectId: row.subject_id,
    subjectName: row.subject?.full_name,
    description: row.description,
    status: row.status as IncidenceStatus,
    finalVerdict: row.final_verdict as VerdictChoice,
    votingDeadline: row.voting_deadline,
    votedRoles: row.voter_roles,
    createdAt: row.created_at,
    closedAt: row.closed_at,
    // Metadados injetados para a UI
    subject: row.subject,
    reporter: row.reporter
  })) as any[];
}

/**
 * Abre um novo chamado de incidência (Dossiê).
 */
export async function createIncidenceReport(params: {
  communityId: string;
  reporterId: string;
  subjectId: string;
  description: string;
}) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('incidence_reports')
    .insert([{
      community_id: params.communityId,
      reporter_id: params.reporterId,
      subject_id: params.subjectId,
      description: params.description,
      status: 'open'
    }])
    .select()
    .single();

  if (error) {
    console.error("[VANTA ETHICS] Erro ao criar chamado:", error);
    return null;
  }
  return data;
}

/**
 * Faz o upload de provas (imagens/vídeos) vinculadas a um chamado.
 */
export async function uploadIncidenceProof(reportId: string, fileBlob: Blob, type: 'image' | 'video'): Promise<string | null> {
  if (!supabase) return null;
  const fileName = `${reportId}/${Date.now()}.${type === 'image' ? 'jpg' : 'mp4'}`;
  
  const { error: uploadError } = await supabase.storage
    .from('incidence-proofs')
    .upload(fileName, fileBlob, { contentType: type === 'image' ? 'image/jpeg' : 'video/mp4' });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage.from('incidence-proofs').getPublicUrl(fileName);
  
  await supabase.from('incidence_proofs').insert([{
    report_id: reportId,
    file_url: publicUrl,
    file_type: type
  }]);

  return publicUrl;
}

/**
 * Inicia a etapa de votação para um chamado aberto.
 */
export async function startCouncilVoting(reportId: string, roles: string[], deadlineHours: number = 24) {
  if (!supabase) return false;
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + deadlineHours);
  
  const { error } = await supabase
    .from('incidence_reports')
    .update({ 
      status: 'voting', 
      voter_roles: roles,
      voting_deadline: deadline.toISOString()
    })
    .eq('id', reportId);
    
  return !error;
}

/**
 * Registra o voto de um membro do conselho (Staff).
 */
export async function castCouncilVote(params: {
  reportId: string;
  voterId: string;
  choice: VerdictChoice;
  weight?: number;
}) {
  if (!supabase) return false;
  
  const { error } = await supabase
    .from('council_votes')
    .insert([{
      report_id: params.reportId,
      // Fix: Use correct property name 'voterId' from params
      voter_id: params.voterId,
      choice: params.choice,
      weight: params.weight || 1
    }]);

  if (error) {
    if (error.code === '23505') throw new Error("Voto já registrado para este perfil.");
    console.error("[VANTA ETHICS] Erro ao votar:", error);
    return false;
  }
  
  return true;
}

/**
 * Encerra um chamado, apura os votos e aplica as restrições necessárias.
 */
export async function closeIncidenceReport(reportId: string) {
  if (!supabase) return null;
  
  try {
    // 1. Apuração de Votos
    const { data: votes } = await supabase
      .from('council_votes')
      .select('choice, weight')
      .eq('report_id', reportId);

    let winner = VerdictChoice.ABSOLVICAO;
    
    if (votes && votes.length > 0) {
      const tallies: Record<string, number> = {
        [VerdictChoice.ADVERTENCIA]: 0,
        [VerdictChoice.SUSPENSAO]: 0,
        [VerdictChoice.BANIMENTO]: 0,
        [VerdictChoice.ABSOLVICAO]: 0
      };

      votes.forEach(v => {
        if (v.choice in tallies) {
          tallies[v.choice] += (v.weight || 1);
        }
      });

      // Define o veredito vencedor por peso
      winner = Object.entries(tallies).reduce((a, b) => a[1] > b[1] ? a : b)[0] as VerdictChoice;
    }

    // 2. Busca dados do réu
    const { data: report } = await supabase
      .from('incidence_reports')
      .select('subject_id, description')
      .eq('id', reportId)
      .single();

    if (report) {
      // 3. Aplicação de Restrição se culpado
      if (winner === VerdictChoice.SUSPENSAO || winner === VerdictChoice.BANIMENTO) {
        await applyGlobalRestriction(report.subject_id, `Veredito: ${winner.toUpperCase()}. Motivo: ${report.description}`);
      }

      // 4. Fechamento do chamado
      await supabase
        .from('incidence_reports')
        .update({ 
          status: 'closed', 
          final_verdict: winner, 
          closed_at: new Date().toISOString() 
        })
        .eq('id', reportId);
    }

    return winner;
  } catch (err) {
    console.error("[VANTA ETHICS] Falha ao encerrar chamado:", err);
    return null;
  }
}

/**
 * Retorna o dossiê completo de um chamado (relato + provas).
 */
export async function getIncidenceDossier(reportId: string) {
  if (!supabase) return null;
  
  const { data: report, error: rErr } = await supabase
    .from('incidence_reports')
    .select(`
      *, 
      subject:profiles!subject_id(full_name, avatar_url, instagram_handle), 
      reporter:profiles!reporter_id(full_name)
    `)
    .eq('id', reportId)
    .single();
    
  if (rErr) {
    console.error("[VANTA ETHICS] Erro ao carregar dossiê:", rErr);
    return null;
  }

  const { data: proofs } = await supabase
    .from('incidence_proofs')
    .select('*')
    .eq('report_id', reportId);
    
  return { 
    report: {
      ...report,
      subjectName: report.subject?.full_name
    }, 
    proofs: (proofs || []).map(p => ({
      id: p.id,
      reportId: p.report_id,
      fileUrl: p.file_url,
      fileType: p.file_type,
      createdAt: p.created_at
    })), 
    error: rErr 
  };
}

/**
 * Aplica restrição global a um perfil de membro (Aura de Restrição).
 */
export async function applyGlobalRestriction(userId: string, notes: string) {
  if (!supabase) return false;
  
  const { error } = await supabase
    .from('profiles')
    .update({ 
      is_globally_restricted: true, 
      restriction_notes: notes 
    })
    .eq('id', userId);
    
  return !error;
}
