import React from 'react';
import { getAvatarFallback } from '../lib/userMapper';

interface VantaAvatarProps {
  src?: string | null;
  gender?: string | null;
  className?: string;
  alt?: string;
}

/**
 * VANTA_UI: Componente Soberano de Identidade.
 * Unifica o tratamento de imagens, fallbacks por gênero e refresh de cache.
 * Ajustado para suportar previews locais (blobs e base64) sem corromper o recurso.
 * Implementa preenchimento total via object-fit: cover forçado e arredondamento rígido.
 */
export const VantaAvatar: React.FC<VantaAvatarProps> = ({ 
  src, 
  gender, 
  className = "w-full h-full object-cover", 
  alt = "Membro" 
}) => {
  // 1. Lógica de fallback: Se o src for nulo, vazio ou for um placeholder genérico
  const needsFallback = !src || src.includes('avatar-default') || src === '';
  
  // 2. Detecção de Recurso Local: Blobs ou Data-URLs (Base64) - Prioridade Total
  const isLocalResource = src?.startsWith('blob:') || src?.startsWith('data:');

  const getFinalSrc = () => {
    if (needsFallback) {
      return getAvatarFallback(gender || undefined);
    }

    if (isLocalResource) {
      return src; 
    }

    // Para URLs remotas (Supabase), injetamos o cache-buster para forçar o refresh
    const connector = src!.includes('?') ? '&' : '?';
    return `${src}${connector}v=${Date.now()}`;
  };

  const finalSrc = getFinalSrc();

  return (
    <img 
      src={finalSrc} 
      alt={alt}
      className={className}
      loading="lazy"
      style={{ 
        objectFit: 'cover',
        objectPosition: 'center',
        borderRadius: '50%', // Blindagem extra de arredondamento
        overflow: 'hidden'
      }}
      onError={(e) => {
        (e.target as HTMLImageElement).src = getAvatarFallback(gender || undefined);
      }}
    />
  );
};