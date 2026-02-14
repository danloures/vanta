
import React, { useMemo } from 'react';

interface BirthDatePickerProps {
  value: string; // Formato YYYY-MM-DD
  onChange: (val: string) => void;
  error?: string;
}

export const BirthDatePicker: React.FC<BirthDatePickerProps> = ({ value, onChange, error }) => {
  const [year, month, day] = value ? value.split('-') : ['', '', ''];

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const arr = [];
    // Acesso exclusivo 18+ conforme curadoria VANTA
    for (let i = currentYear - 18; i >= 1920; i--) arr.push(i.toString());
    return arr;
  }, []);

  const months = [
    { v: '01', l: 'Jan' }, { v: '02', l: 'Fev' }, { v: '03', l: 'Mar' },
    { v: '04', l: 'Abr' }, { v: '05', l: 'Mai' }, { v: '06', l: 'Jun' },
    { v: '07', l: 'Jul' }, { v: '08', l: 'Ago' }, { v: '09', l: 'Set' },
    { v: '10', l: 'Out' }, { v: '11', l: 'Nov' }, { v: '12', l: 'Dez' }
  ];

  const days = useMemo(() => {
    const arr = [];
    // Calcula dias no mês selecionado para evitar 31 de fevereiro, etc.
    const daysInMonth = (month && year) ? new Date(parseInt(year), parseInt(month), 0).getDate() : 31;
    for (let i = 1; i <= daysInMonth; i++) arr.push(i.toString().padStart(2, '0'));
    return arr;
  }, [year, month]);

  const handleChange = (d: string, m: string, y: string) => {
    onChange(`${y}-${m}-${d}`);
  };

  const selectStyle = (hasValue: string) => `
    w-full bg-zinc-900/60 border ${error && !hasValue ? 'border-red-500/50' : 'border-white/5'} 
    rounded-2xl p-5 text-white text-[10px] font-black uppercase outline-none 
    appearance-none cursor-pointer transition-all focus:border-[#d4af37]/30 text-center
  `;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-3">
        {/* Dia */}
        <div className="relative group">
          <select 
            value={day} 
            onChange={(e) => handleChange(e.target.value, month, year)}
            className={selectStyle(day)}
          >
            <option value="" className="bg-zinc-950">DIA</option>
            {days.map(d => <option key={d} value={d} className="bg-zinc-950">{d}</option>)}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
            <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white"><path d="M7 10l5 5 5-5z"/></svg>
          </div>
        </div>

        {/* Mês */}
        <div className="relative group">
          <select 
            value={month} 
            onChange={(e) => handleChange(day, e.target.value, year)}
            className={selectStyle(month)}
          >
            <option value="" className="bg-zinc-950">MÊS</option>
            {months.map(m => <option key={m.v} value={m.v} className="bg-zinc-950">{m.l.toUpperCase()}</option>)}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
            <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white"><path d="M7 10l5 5 5-5z"/></svg>
          </div>
        </div>

        {/* Ano */}
        <div className="relative group">
          <select 
            value={year} 
            onChange={(e) => handleChange(day, month, e.target.value)}
            className={selectStyle(year)}
          >
            <option value="" className="bg-zinc-950">ANO</option>
            {years.map(y => <option key={y} value={y} className="bg-zinc-950">{y}</option>)}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
            <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white"><path d="M7 10l5 5 5-5z"/></svg>
          </div>
        </div>
      </div>
      {error && <p className="text-[7px] text-red-500 font-bold uppercase tracking-widest ml-4">{error}</p>}
    </div>
  );
};
