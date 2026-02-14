import React, { useState, useEffect } from 'react';
import { GlobalTag, User } from '../../types';
import { fetchGlobalTags, createGlobalTag, deleteGlobalTag } from '../../lib/tagsApi';
import { ICONS } from '../../constants';

interface AdminGlobalTagsProps {
  currentUser: User;
}

export const AdminGlobalTags: React.FC<AdminGlobalTagsProps> = ({ currentUser }) => {
  const [tags, setTags] = useState<GlobalTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: '',
    color: '#d4af37',
    priority: 0
  });

  useEffect(() => { loadTags(); }, []);

  const loadTags = async () => {
    setIsLoading(true);
    const data = await fetchGlobalTags();
    setTags(data);
    setIsLoading(false);
  };

  const handleCreate = async () => {
    if (!form.name) return;
    setIsProcessing(true);
    const success = await createGlobalTag(form);
    if (success) {
      await loadTags();
      setShowForm(false);
      setForm({ name: '', color: '#d4af37', priority: 0 });
    }
    setIsProcessing(false);
  };

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom duration-500 pb-32">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">CURADORIA MÁXIMA</h3>
          <p className="text-[22px] font-serif italic text-white tracking-tighter uppercase">Tags de Elite</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-6 py-3 bg-white text-black text-[9px] font-black uppercase rounded-full shadow-lg">Nova Tag</button>
      </div>

      {showForm && (
        <div className="p-8 bg-zinc-950 border border-[#d4af37]/20 rounded-[3rem] space-y-6 animate-in zoom-in-95">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="NOME DA TAG" className="bg-zinc-900 border border-white/5 rounded-2xl p-4 text-[10px] text-white uppercase outline-none" />
              <div className="flex gap-2">
                <input type="color" value={form.color} onChange={e => setForm({...form, color: e.target.value})} className="h-14 w-14 bg-zinc-900 border border-white/5 rounded-2xl cursor-pointer p-1" />
                <input type="number" value={form.priority} onChange={e => setForm({...form, priority: Number(e.target.value)})} placeholder="PRIORIDADE" className="flex-1 bg-zinc-900 border border-white/5 rounded-2xl p-4 text-[10px] text-white uppercase outline-none" />
              </div>
           </div>
           <div className="flex gap-4">
              <button onClick={handleCreate} disabled={isProcessing} className="flex-1 py-4 bg-white text-black text-[10px] font-black uppercase rounded-full">Criar Tag</button>
              <button onClick={() => setShowForm(false)} className="px-8 py-4 text-zinc-600 text-[10px] font-black uppercase">Fechar</button>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {isLoading ? (
          <div className="py-20 flex justify-center"><div className="w-6 h-6 border-2 border-white/10 border-t-[#d4af37] rounded-full animate-spin"></div></div>
        ) : tags.length > 0 ? tags.map(tag => (
          <div key={tag.id} className="p-5 bg-zinc-900 border border-white/5 rounded-3xl flex items-center justify-between group">
             <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]" style={{ backgroundColor: tag.color }}></div>
                <h4 className="text-white text-[11px] font-black uppercase tracking-widest">{tag.name}</h4>
             </div>
             <div className="flex items-center gap-6">
                <span className="text-[7px] text-zinc-600 font-black uppercase tracking-widest">Peso: {tag.priority}</span>
                <button onClick={() => deleteGlobalTag(tag.id).then(loadTags)} className="text-red-900/40 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><ICONS.Trash className="w-4 h-4" /></button>
             </div>
          </div>
        )) : (
          <div className="py-20 text-center border border-dashed border-white/5 rounded-[3rem] opacity-30">
            <p className="text-[8px] text-zinc-500 font-black uppercase">Nenhuma tag customizada.</p>
          </div>
        )}
      </div>
    </div>
  );
};