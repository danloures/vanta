import React, { useState, useEffect, useRef } from 'react';
import { User, canAccessAdminPanel } from '../../types';
import { profileStore } from './profileState';
import { supabase } from '../../lib/supabaseClient';
import { compressImage, base64ToBlob, uploadToVantaStorage } from './profileUtils';
import { ProfileEditMode } from './ProfileEditMode';
import { ProfileDisplayMode } from './ProfileDisplayMode';
import { VantaImageCropper } from './VantaImageCropper';
import { vantaFeedback } from '../../lib/feedbackStore';

interface ProfileFeatureProps {
  currentUser: User;
  onLogout: () => void;
  onOpenAdmin: () => void;
}

export const ProfileFeature: React.FC<ProfileFeatureProps> = ({ currentUser, onLogout, onOpenAdmin }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'perfil' | 'carteira'>('perfil');
  
  // Estado do Cropper
  const [croppingData, setCroppingData] = useState<{
    src: string;
    type: 'avatar' | 'gallery';
    index?: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number | null>(null);

  const [pendingAvatarBlob, setPendingAvatarBlob] = useState<Blob | null>(null);
  const [pendingGalleryBlobs, setPendingGalleryBlobs] = useState<Record<number, Blob>>({});
  const [localPreviewUrls, setLocalPreviewUrls] = useState<string[]>([]);

  const [localData, setLocalData] = useState({
    bio: currentUser.bio || "",
    avatar: currentUser.avatar,
    gallery: currentUser.gallery || [],
    isPlus: currentUser.isVantaPlus || false,
    privacy: currentUser.privacy || {
      profileInfo: 'todos',
      confirmedEvents: 'amigos',
      messages: 'amigos'
    },
    gender: currentUser.gender
  });

  useEffect(() => {
    setLocalData({
      bio: currentUser.bio || "",
      avatar: currentUser.avatar,
      gallery: currentUser.gallery || [],
      isPlus: currentUser.isVantaPlus || false,
      privacy: currentUser.privacy || {
        profileInfo: 'todos',
        confirmedEvents: 'amigos',
        messages: 'amigos'
      },
      gender: currentUser.gender
    });
  }, [currentUser]);

  const cleanupPreviews = () => {
    localPreviewUrls.forEach(url => URL.revokeObjectURL(url));
    setLocalPreviewUrls([]);
    setPendingAvatarBlob(null);
    setPendingGalleryBlobs({});
  };

  const handleSave = () => {
    if (!supabase || !currentUser) return;
    
    const avatarBlobSnapshot = pendingAvatarBlob;
    const galleryBlobsSnapshot = { ...pendingGalleryBlobs };
    const dataSnapshot = { ...localData };

    profileStore.updateProfile({
      ...dataSnapshot
    });
    
    setIsEditing(false);
    // VANTA_FEEDBACK: Toast Centralizado
    vantaFeedback.toast('success', 'Informações atualizadas', 'Perfil salvo com sucesso.');

    const runBackgroundSync = async () => {
      console.log("[VANTA_SYNC] Iniciando persistência em segundo plano...");
      try {
        let finalAvatarUrl = dataSnapshot.avatar;
        let finalGalleryUrls = [...dataSnapshot.gallery];
        const uploadTasks: Promise<any>[] = [];
        
        if (avatarBlobSnapshot) {
          uploadTasks.push(
            uploadToVantaStorage(currentUser.id, avatarBlobSnapshot, 'avatar_main')
              .then(url => ({ type: 'avatar', url }))
          );
        }
        
        (Object.entries(galleryBlobsSnapshot) as [string, Blob][]).forEach(([idx, blob]) => {
          const index = Number(idx);
          uploadTasks.push(
            uploadToVantaStorage(currentUser.id, blob, `gallery_${index}`)
              .then(url => ({ type: 'gallery', index, url }))
          );
        });

        if (uploadTasks.length > 0) {
          const results = await Promise.all(uploadTasks);
          results.forEach(res => {
            if (res.type === 'avatar') finalAvatarUrl = res.url;
            else if (res.type === 'gallery') finalGalleryUrls[res.index] = res.url;
          });
        }

        const updates: any = {
          bio: dataSnapshot.bio,
          privacy: dataSnapshot.privacy,
          avatar_url: finalAvatarUrl,
          gallery: finalGalleryUrls,
          updated_at: new Date().toISOString()
        };

        await supabase.from('profiles').update(updates).eq('id', currentUser.id);
        await (supabase.auth as any).updateUser({
          data: { avatar_url: finalAvatarUrl, bio: dataSnapshot.bio, gallery: finalGalleryUrls }
        });

        profileStore.updateProfile({ ...dataSnapshot, avatar: finalAvatarUrl, gallery: finalGalleryUrls });
        console.log("[VANTA_SYNC] Sincronização concluída com sucesso.");
      } catch (err: any) {
        console.error("[VANTA_SYNC] Erro na sincronização:", err);
      } finally {
        cleanupPreviews();
      }
    };

    runBackgroundSync();
  };

  const handleGalleryPhotoClick = (index: number) => {
    setActiveGalleryIndex(index);
    galleryFileInputRef.current?.click();
  };

  const handleGalleryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeGalleryIndex !== null) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCroppingData({
          src: reader.result as string,
          type: 'gallery',
          index: activeGalleryIndex!
        });
        setActiveGalleryIndex(null);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCroppingData({
          src: reader.result as string,
          type: 'avatar'
        });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleCropComplete = async (croppedBase64: string) => {
    if (!croppingData) return;
    
    try {
      const blob = base64ToBlob(croppedBase64);
      
      if (croppingData.type === 'avatar') {
        setPendingAvatarBlob(blob);
        // Atualização funcional para garantir reatividade imediata no UI
        setLocalData(prev => ({ ...prev, avatar: croppedBase64 }));
      } else if (croppingData.type === 'gallery' && croppingData.index !== undefined) {
        setPendingGalleryBlobs(prev => ({ ...prev, [croppingData.index!]: blob }));
        setLocalData(prev => {
          const newGallery = [...prev.gallery];
          newGallery[croppingData.index!] = croppedBase64;
          return { ...prev, gallery: newGallery };
        });
      }
    } catch (err) {
      console.error("Erro ao processar recorte:", err);
    } finally {
      setCroppingData(null);
    }
  };

  const removePhoto = (index: number) => {
    setLocalData(prev => {
      const newGallery = [...prev.gallery];
      newGallery[index] = ""; 
      return { ...prev, gallery: newGallery };
    });
    setPendingGalleryBlobs(prev => {
      const newPending = { ...prev };
      delete newPending[index];
      return newPending;
    });
  };

  const setAsProfilePicture = (url: string) => {
    const galleryIdx = localData.gallery.indexOf(url);
    if (galleryIdx !== -1 && pendingGalleryBlobs[galleryIdx]) {
      setPendingAvatarBlob(pendingGalleryBlobs[galleryIdx]);
    } else {
      setPendingAvatarBlob(null);
    }
    setLocalData(prev => ({ ...prev, avatar: url }));
  };

  const handleCancel = () => {
    cleanupPreviews();
    setIsEditing(false);
  };

  const isAdmin = canAccessAdminPanel(currentUser);

  return (
    <>
      {isEditing ? (
        <ProfileEditMode 
          localData={localData}
          setLocalData={setLocalData}
          isSaving={isSaving}
          onCancel={handleCancel}
          onSave={handleSave}
          pendingAvatarBlob={pendingAvatarBlob}
          pendingGalleryBlobs={pendingGalleryBlobs}
          handleAvatarFileChange={handleAvatarFileChange}
          handleGalleryFileChange={handleGalleryFileChange}
          handleGalleryPhotoClick={handleGalleryPhotoClick}
          removePhoto={removePhoto}
          setAsProfilePicture={setAsProfilePicture}
          fileInputRef={fileInputRef}
          galleryFileInputRef={galleryFileInputRef}
          onLogout={onLogout}
        />
      ) : (
        <ProfileDisplayMode 
          currentUser={currentUser}
          localData={localData}
          activeSubTab={activeSubTab}
          setActiveSubTab={setActiveSubTab}
          onEdit={() => setIsEditing(true)}
          onLogout={onLogout}
          onOpenAdmin={onOpenAdmin}
          isAdmin={isAdmin}
        />
      )}

      {/* OVERLAY DE RECORTE VANTA */}
      {croppingData && (
        <VantaImageCropper 
          imageSrc={croppingData.src}
          onConfirm={handleCropComplete}
          onCancel={() => setCroppingData(null)}
        />
      )}
    </>
  );
};