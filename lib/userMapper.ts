
import { User, UserStatus, MemberLevel, MemberCuratedLevel } from '../types';

export const getAvatarFallback = (gender?: string): string => {
  const g = String(gender || '').toLowerCase();
  const isFemale = ['female', 'feminino', 'f', 'woman', 'mulher'].includes(g);
  return isFemale 
    ? 'https://bmqkdlqbtyvzlqpfrtdr.supabase.co/storage/v1/object/public/public_assets/f00b33a8-a117-400e-8a2d-68fda6462114/avatar-default-female.png' 
    : 'https://bmqkdlqbtyvzlqpfrtdr.supabase.co/storage/v1/object/public/public_assets/f00b33a8-a117-400e-8a2d-68fda6462114/avatar-default-male.png';
};

export const mapSupabaseUserToVantaUser = (sbUser: any): User => {
  const meta = sbUser.user_metadata || {};
  const appMeta = sbUser.app_metadata || {};
  
  const roleRaw = (appMeta.role ?? meta.role ?? 'user').toString().toLowerCase();
  const role = roleRaw || 'user';
  
  let statusEnum = UserStatus.APPROVED;
  if (['admin', 'master', 'vanta_master'].includes(role)) statusEnum = UserStatus.ADMIN;
  else if (['vanta_prod', 'produtor'].includes(role)) statusEnum = UserStatus.VANTA_PROD;
  else if (['vanta_socio', 'socio'].includes(role)) statusEnum = UserStatus.VANTA_SOCIO;
  else if (['vanta_promoter', 'promoter'].includes(role)) statusEnum = UserStatus.VANTA_PROMOTER;
  else if (['vanta_portaria', 'portaria'].includes(role)) statusEnum = UserStatus.VANTA_PORTARIA;
  else statusEnum = UserStatus.APPROVED;
  
  const gender = meta.gender;
  const avatarRaw = meta.avatar_url || meta.avatar;
  const avatar = avatarRaw || getAvatarFallback(gender);

  // VANTA_SOVEREIGN: Lógica de Normalização de Multi-Tags
  const rawCuratedLevel = meta.curated_level;
  const curatedLevelArray = Array.isArray(rawCuratedLevel) 
    ? rawCuratedLevel 
    : [rawCuratedLevel || 'VANTA CLASSIC'];

  return {
    id: sbUser.id,
    fullName: meta.full_name || 'Membro VANTA',
    username: meta.username || 'vanta_member',
    email: sbUser.email || '',
    phone_e164: meta.phone_e164 || meta.phone,
    instagram: meta.instagram || meta.instagram_handle || meta.instagram_username || 'vanta_member',
    gender: gender,
    status: statusEnum,
    role: role,
    permissions: meta.permissions || {}, 
    level: (meta.level as MemberLevel) || MemberLevel.CLASSIC,
    curatedLevel: curatedLevelArray, // Atribuído como Array
    selfieUrl: meta.selfie_url,
    avatar: avatar,
    bio: meta.bio || '',
    gallery: Array.isArray(meta.gallery) ? meta.gallery : [],
    isVantaPlus: !!meta.is_vanta_plus,
    privacy: meta.privacy || { profileInfo: 'todos', confirmedEvents: 'amigos', messages: 'amigos' },
    joinedAt: new Date(sbUser.created_at).getTime(),
    vantaMoments: 0,
    friends: [],
    friendRequestsSent: [],
    friendRequestsReceived: [],
    confirmedEventsIds: [],
    isGloballyRestricted: !!meta.is_globally_restricted,
    restriction_notes: meta.restriction_notes || '',
    approvedByName: meta.approved_by_name,
    approvedAt: meta.approved_at
  };
};
