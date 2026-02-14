import React from 'react';
import { ICONS } from '../../constants';
import { VantaAvatar } from '../../components/VantaAvatar';
import { vantaFeedback } from '../../lib/feedbackStore';

interface ProfileEditModeProps {
  localData: any;
  setLocalData: (data: any) => void;
  isSaving: boolean;
  onCancel: () => void;
  onSave: () => void;
  pendingAvatarBlob: Blob | null;
  pendingGalleryBlobs: Record<number, Blob>;
  handleAvatarFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleGalleryFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleGalleryPhotoClick: (index: number) => void;
  removePhoto: (index: number) => void;
  setAsProfilePicture: (url: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  galleryFileInputRef: React.RefObject<HTMLInputElement | null>;
  onLogout: () => void;
}

export const ProfileEditMode: React.FC<ProfileEditModeProps> = ({
  localData, setLocalData, isSaving, onCancel, onSave,
  pendingAvatarBlob, pendingGalleryBlobs, handleAvatarFileChange,
  handleGalleryFileChange, handleGalleryPhotoClick, removePhoto,
  setAsProfilePicture, fileInputRef, galleryFileInputRef, onLogout
}) => {

  const handleSaveConfirm = () => {
    vantaFeedback.confirm({
      title: 'Atualizar Dados',
      message: 'Confirmar atualização de dados biométricos e cadastrais?',
      confirmLabel: 'Confirmar',
      onConfirm: onSave
    });
  };

  return (
    <div className="fixed inset-0 z-[500] w-full h-full bg-black p-8 pt-20 pb-32 animate-in fade-in duration-300 overflow-y-auto no-scrollbar">
      <header className="flex justify-between items-center mb-12">
        <button 
          onClick={onCancel} 
          className="text-zinc-500 text-[10px] font-black uppercase tracking-widest disabled:opacity-20"
          disabled={isSaving}
        >
          Cancelar
        </button>
        <h2 className="text-[11px] font-black text-white uppercase tracking-[0.4em]">Editar Perfil</h2>
        <button 
          onClick={handleSaveConfirm} 
          disabled={isSaving}
          className="text-[#d4af37] text-[10px] font-black uppercase tracking-widest disabled:animate-pulse"
        >
          {isSaving ? "Sincronizando..." : "Salvar"}
        </button>
      </header>

      <div className="space-y-12">
        <div className="flex flex-col items-center gap-4">
           <div className="w-24 h-24 rounded-full border border-white/10 relative overflow-hidden bg-zinc-900">
              <VantaAvatar 
                src={localData.avatar} 
                gender={localData.gender} 
                alt="Profile" 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity opacity-0 hover:opacity-100"
                disabled={isSaving}
              >
                <ICONS.Plus className="w-5 h-5 text-white" />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarFileChange} />
           </div>
           <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">
            {pendingAvatarBlob ? "IMAGEM PRONTA PARA SALVAR" : "Mudar Foto de Perfil"}
           </span>
        </div>

        <div className="space-y-3">
          <label className="text-[8px] text-zinc-600 font-black uppercase tracking-widest ml-4">Biografia (Max 400)</label>
          <textarea 
            value={localData.bio}
            onChange={(e) => setLocalData({...localData, bio: e.target.value.slice(0, 400)})}
            className="w-full bg-zinc-900 border border-white/5 rounded-[2rem] p-6 text-[11px] text-white outline-none focus:border-white/20 h-32 resize-none uppercase"
            placeholder="CONTE-NOS MAIS SOBRE VOCÊ..."
            disabled={isSaving}
          />
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-1 ml-4">
            <label className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">Galeria do Membro (Pré-visualização Local)</label>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input type="file" ref={galleryFileInputRef} className="hidden" accept="image/*" onChange={handleGalleryFileChange} />
            {[0, 1, 2, 3, 4, 5].map((idx) => {
              const imgUrl = localData.gallery[idx];
              const isCurrentlyProfile = imgUrl && imgUrl === localData.avatar;
              const isPending = !!pendingGalleryBlobs[idx];

              return (
                <div key={idx} className={`aspect-square bg-zinc-900 border ${isCurrentlyProfile ? 'border-[#d4af37]/50 shadow-[0_0_10px_rgba(212,175,55,0.2)]' : 'border-white/5'} rounded-2xl overflow-hidden relative group transition-all`}>
                  {imgUrl ? (
                    <>
                      <img src={imgUrl} className="w-full h-full object-cover" alt={`Gallery ${idx}`} />
                      <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => removePhoto(idx)} className="w-6 h-6 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center border border-white/5"><ICONS.Trash className="w-3 h-3 text-red-500" /></button>
                        <button onClick={() => setAsProfilePicture(imgUrl)} className={`w-6 h-6 ${isCurrentlyProfile ? 'bg-[#d4af37] text-black' : 'bg-black/60 text-[#d4af37]'} backdrop-blur-md rounded-full flex items-center justify-center border border-white/5 transition-colors`}><span className="text-[10px]">✨</span></button>
                      </div>
                      {isPending && <div className="absolute bottom-1 left-1 w-2 h-2 bg-[#d4af37] rounded-full animate-pulse"></div>}
                      <button onClick={() => handleGalleryPhotoClick(idx)} className="absolute inset-0 z-0"></button>
                    </>
                  ) : (
                    <button onClick={() => handleGalleryPhotoClick(idx)} className="w-full h-full flex items-center justify-center opacity-20">
                      <ICONS.Plus className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6 pt-6 border-t border-white/5">
           <h3 className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.3em] mb-4">Privacidade</h3>
           {[
             { id: 'profileInfo', label: 'Quem vê meu perfil?' },
             { id: 'confirmedEvents', label: 'Quem vê meus eventos?' },
             { id: 'messages', label: 'Quem pode me enviar msg?' }
           ].map(setting => (
             <div key={setting.id} className="flex flex-col gap-2">
               <span className="text-[8px] text-zinc-700 font-black uppercase ml-4">{setting.label}</span>
               <div className="flex bg-zinc-950 rounded-full p-1 border border-white/5">
                 {['todos', 'amigos', 'ninguem'].map(opt => (
                   <button 
                     key={opt}
                     onClick={() => setLocalData({...localData, privacy: {...localData.privacy, [setting.id]: opt}})}
                     className={`flex-1 py-2 text-[7px] font-black uppercase tracking-widest rounded-full transition-all ${localData.privacy[setting.id as keyof typeof localData.privacy] === opt ? 'bg-white text-black' : 'text-zinc-600'}`}
                     disabled={isSaving}
                   >
                     {opt}
                   </button>
                 ))}
               </div>
             </div>
           ))}
        </div>

        <div className="pt-12 space-y-4 border-t border-red-900/10">
           <button onClick={() => prompt("Para confirmar, digite SENHA:") && onLogout()} className="w-full py-5 border border-red-900/30 text-red-500 text-[9px] font-black uppercase tracking-widest rounded-full">Excluir Conta Permanentemente</button>
        </div>
      </div>

      {isSaving && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[11000] flex flex-col items-center justify-center space-y-4">
           <div className="w-12 h-12 border-4 border-[#d4af37]/20 border-t-[#d4af37] rounded-full animate-spin"></div>
           <p className="text-[10px] text-white font-black uppercase tracking-[0.4em] animate-pulse">Sincronizando Mídia...</p>
        </div>
      )}
    </div>
  );
};