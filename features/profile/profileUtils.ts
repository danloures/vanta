import { supabase } from '../../lib/supabaseClient';

/**
 * VANTA_UTILS: Utilitário de compressão de imagem de alta performance.
 */
export const compressImage = (base64: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
      }
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => resolve(base64);
  });
};

/**
 * VANTA_UTILS: Gera o recorte final baseado no enquadramento do usuário.
 * Suporta Aspect Ratio dinâmico.
 */
export const generateCroppedImage = (
  imageSrc: string, 
  cropArea: { x: number; y: number; width: number; height: number },
  targetWidth = 800,
  targetHeight = 800
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Limpa o canvas para garantir que não haja sobras de transparência
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Desenha a imagem forçando o preenchimento da área de destino
        ctx.drawImage(
          img, 
          cropArea.x, cropArea.y, cropArea.width, cropArea.height,
          0, 0, targetWidth, targetHeight
        );
      }
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
  });
};

export const base64ToBlob = (base64: string): Blob => {
  const parts = base64.split(',');
  const byteString = atob(parts[1]);
  const mimeString = parts[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
};

export const uploadToVantaStorage = async (userId: string, blob: Blob, fileName: string): Promise<string> => {
  if (!supabase) throw new Error("Conexão com a rede VANTA não estabelecida.");
  const bucketName = 'profiles';
  const filePath = `${userId}/${fileName}.jpg`;
  
  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, blob, { 
      contentType: 'image/jpeg', 
      upsert: true, 
      cacheControl: '0'
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
  return `${data.publicUrl}?v=${Date.now()}`;
};