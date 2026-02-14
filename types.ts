

export interface GuestEntry { 
  id: string; 
  eventId: string; 
  name: string; 
  userId?: string; 
  ruleId: string; 
  addedByEmail: string; 
  checkedIn: boolean; 
  checkInTime?: number;
  notifyOnArrival?: boolean;
}

export enum UserStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ADMIN = 'ADMIN',
  VANTA_PROD = 'VANTA_PROD',
  VANTA_SOCIO = 'VANTA_SOCIO',
  VANTA_PROMOTER = 'VANTA_PROMOTER',
  VANTA_PORTARIA = 'VANTA_PORTARIA',
  VANTA_STAFF = 'VANTA_STAFF',
  VANTA_FINANCEIRO = 'VANTA_FINANCEIRO',
  RESTRICTED = 'RESTRICTED'
}

export const VANTA_MASTER_ROLES = ['admin', 'master', 'vanta_master'];

export const isVantaMaster = (user: { role: string } | null | undefined): boolean => {
  if (!user) return false;
  return VANTA_MASTER_ROLES.includes(user.role.toLowerCase());
};

export enum MemberLevel {
  CLASSIC = 'CLASSIC',
  PLUS = 'PLUS',
  BLACK = 'BLACK'
}

export enum MemberCuratedLevel {
  CLASSIC = 'VANTA CLASSIC',
  VIP = 'VANTA VIP',
  ELITE = 'VANTA ELITE'
}

export type PrivacyLevel = 'todos' | 'amigos' | 'ninguem';

/**
 * VANTA_IDENTITY: Interface unificada para o usuário logado (Dono da Sessão).
 * Contém PII para gestão pessoal.
 */
export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone_e164: string;
  instagram: string;
  gender: string | null;
  status: UserStatus;
  role: string;
  permissions?: Record<string, boolean>;
  level: MemberLevel;
  curatedLevel: string[]; 
  selfieUrl?: string;
  avatar: string;
  bio?: string;
  gallery: string[];
  isVantaPlus: boolean;
  privacy: {
    profileInfo: PrivacyLevel;
    confirmedEvents: PrivacyLevel;
    messages: PrivacyLevel;
  };
  joinedAt: number;
  vantaMoments: number;
  friends: string[];
  friendRequestsSent: string[];
  friendRequestsReceived: string[];
  confirmedEventsIds: string[];
  isGloballyRestricted: boolean;
  restriction_notes: string;
  approvedByName?: string;
  approvedAt?: string;
}

/**
 * VANTA_IDENTITY: Interface para perfis de outros membros na rede.
 * Higienizada: Zero PII (Sem email, Sem telefone).
 */
export interface MemberProfile { 
  id: string; 
  username: string | null;
  full_name: string | null; 
  instagram_handle: string | null; 
  avatar_url: string | null; 
  city: string | null; 
  state: string | null; 
  gender: string | null; 
  bio?: string | null;
  role?: string;
  permissions?: Record<string, boolean>;
  curated_level: string[]; 
  followers_count?: number;
  gallery?: string[];
  approved_at?: string | null;
  is_globally_restricted?: boolean;
}

export interface TicketBatch {
  id: string;
  name: string;
  limit: number;
  validUntil: string;
  validUntilTime: string;
  variations: TicketVariation[];
  soldCount: number;
}

export interface TicketVariation {
  id: string;
  area: string;
  gender: string;
  price: number;
  limit: number;
}

export interface GuestListRule {
  id: string;
  type: 'VIP' | 'DISCOUNT' | 'CONSUMPTION';
  gender: 'M' | 'F' | 'Unisex';
  area: string;
  value: number;
  deadline: string | null;
}

export interface PromoterLimit {
  ruleId: string;
  limit: number;
}

export interface StaffMember {
  id: string;
  email: string;
  role: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  promoterLimits?: PromoterLimit[];
  vipQuota?: number;
}

export interface Event {
  id: string;
  communityId: string;
  creatorId: string;
  title: string;
  description: string;
  image: string;
  city: string;
  state: string;
  location: string;
  startDate: string;
  startTime: string;
  endTime: string;
  isVipOnly: boolean;
  isFeatured?: boolean;
  isTransferEnabled?: boolean;
  vibeTags?: string[];
  lineup?: string;
  dressCode?: string;
  entryTips?: string;
  latitude: number | null;
  longitude: number | null;
  capacity: number;
  rsvps: number;
  staff: StaffMember[];
  batches: TicketBatch[];
  guestListRules: GuestListRule[];
  isListEnabled: boolean;
}

export enum CommunityType {
  BOATE = 'BOATE',
  PRODUTORA = 'PRODUTORA'
}

export interface Community {
  id: string;
  name: string;
  description: string;
  image_url: string;
  logo_url: string;
  type: CommunityType;
  address: string;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  owner_id: string;
  owner_name?: string;
  owner_avatar?: string;
  is_active: boolean;
  eventIds: string[];
  createdAt: number;
  co_owners?: string[];
  stats?: {
    eventCount: number;
    totalRsvps: number;
    totalRevenue: number;
  };
}

export interface GlobalTag {
  id: string;
  name: string;
  color: string;
  priority: number;
}

export interface CustomRole {
  id: string;
  communityId: string;
  name: string;
  scope: 'global' | 'local';
  permissions: Record<string, boolean>;
}

export const EVENT_PERMISSIONS = [
  { id: 'event_view', label: 'Ver Eventos' },
  { id: 'event_edit', label: 'Editar Eventos' },
  { id: 'list_view', label: 'Ver Listas' },
  { id: 'list_checkin', label: 'Executar Check-in' }
];

export const COMMUNITY_PERMISSIONS = [
  { id: 'unit_edit', label: 'Editar Unidade' },
  { id: 'unit_staff', label: 'Gerir Equipe' },
  { id: 'unit_finance', label: 'Ver Financeiro' }
];

export const canAccessAdminPanel = (user: User): boolean => {
  const role = user.role.toLowerCase();
  return isVantaMaster(user) || ['vanta_prod', 'produtor', 'vanta_socio', 'vanta_promoter', 'vanta_portaria', 'vanta_staff', 'vanta_financeiro'].includes(role);
};

export interface TicketTransfer {
  id: string;
  ticketId: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'returned';
  securitySelfieUrl: string;
  createdAt: string;
  event?: {
    title: string;
    date: string;
    image: string;
  };
  sender?: {
    name: string;
    avatar: string;
  };
}

export type RsvpStatus = 'going' | 'maybe' | 'not_going';

export enum IncidenceStatus {
  OPEN = 'open',
  VOTING = 'voting',
  CLOSED = 'closed'
}

export enum VerdictChoice {
  ABSOLVICAO = 'absolvicao',
  ADVERTENCIA = 'advertencia',
  SUSPENSAO = 'suspensao',
  BANIMENTO = 'banimento'
}

export interface IncidenceReport {
  id: string;
  communityId: string;
  reporterId: string;
  subjectId: string;
  subjectName: string;
  description: string;
  status: IncidenceStatus;
  finalVerdict?: VerdictChoice;
  votingDeadline?: string;
  votedRoles?: string[];
  createdAt: string;
  closedAt?: string;
}

export interface IncidenceProof {
  id: string;
  reportId: string;
  fileUrl: string;
  fileType: 'image' | 'video';
  createdAt: string;
}

export interface StaffTemplate {
  id: string;
  communityId: string | null;
  name: string;
  description: string;
  dos: string[];
  donts: string[];
  permissions: Record<string, boolean>;
  isGlobal: boolean;
  createdAt: string;
}

export type AuditCategory = 'GENERAL' | 'FINANCE' | 'STAFF' | 'LIST' | 'SYSTEM' | 'ETHICS';

export interface VantaAuditLog {
  id: string;
  community_id: string | null;
  event_id: string | null;
  action: string;
  category: AuditCategory;
  performed_by_id: string;
  performed_by_name: string;
  target_id: string | null;
  details: any;
  created_at: string;
}

export interface CommunityStaff {
  id: string;
  community_id: string;
  user_id: string;
  template_id: string;
  role_name: string;
  permissions: Record<string, boolean>;
  created_at: string;
}

