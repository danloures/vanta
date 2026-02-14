
import React from 'react';
import { BR_STATES_CITIES } from '../../../data/brStatesCities';
import { BirthDatePicker } from '../../BirthDatePicker';

interface SignupStepBasicProps {
  signupData: any;
  setSignupData: (data: any) => void;
  signupErrors: Record<string, string>;
  setSignupErrors: (errors: any) => void;
  touched: Record<string, boolean>;
  setTouched: (touched: any) => void;
  handleBlur: (field: string) => void;
  getInputClass: (field: string) => string;
  renderError: (field: string) => React.ReactNode;
  setSignupStep: (step: number) => void;
  onBackToLanding: () => void;
  isStep1Valid: boolean;
}

export const SignupStepBasic: React.FC<SignupStepBasicProps> = ({
  signupData, setSignupData, signupErrors, setSignupErrors, touched, setTouched,
  handleBlur, getInputClass, renderError, setSignupStep, onBackToLanding, isStep1Valid
}) => {
  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="space-y-1">
        <label className="text-[7px] text-zinc-600 font-black uppercase tracking-widest ml-4">Nome completo</label>
        <input 
          value={signupData.fullName} 
          onBlur={() => handleBlur('fullName')}
          onChange={e => {
            setSignupData({...signupData, fullName: e.target.value});
            if(signupErrors.fullName) setSignupErrors({...signupErrors, fullName: ''});
          }} 
          placeholder="Ex: Joao Antonio Oliveira" 
          className={getInputClass('fullName')}
        />
        {renderError('fullName')}
      </div>
      <div className="space-y-1">
        <label className="text-[7px] text-zinc-600 font-black uppercase tracking-widest ml-4">Nascimento</label>
        <BirthDatePicker 
          value={signupData.birthDate} 
          onChange={val => {
            setSignupData({...signupData, birthDate: val});
            setTouched((prev: any) => ({...prev, birthDate: true}));
            if(signupErrors.birthDate) setSignupErrors({...signupErrors, birthDate: ''});
          }} 
          error={touched.birthDate ? signupErrors.birthDate : ''} 
        />
      </div>
      
      <div className="space-y-1">
        <label className="text-[7px] text-zinc-600 font-black uppercase tracking-widest ml-4">Gênero</label>
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={() => {
              setSignupData({...signupData, gender: 'male'});
              setTouched((prev: any) => ({...prev, gender: true}));
              if(signupErrors.gender) setSignupErrors({...signupErrors, gender: ''});
            }}
            className={`flex-1 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${signupData.gender === 'male' ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-500 border-white/5'}`}
          >
            Masculino
          </button>
          <button 
            type="button"
            onClick={() => {
              setSignupData({...signupData, gender: 'female'});
              setTouched((prev: any) => ({...prev, gender: true}));
              if(signupErrors.gender) setSignupErrors({...signupErrors, gender: ''});
            }}
            className={`flex-1 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${signupData.gender === 'female' ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-500 border-white/5'}`}
          >
            Feminino
          </button>
        </div>
        {renderError('gender')}
      </div>

      <div className="grid grid-cols-2 gap-2">
         <div className="space-y-1">
            <label className="text-[7px] text-zinc-600 font-black uppercase tracking-widest ml-4">Estado</label>
            <select 
              value={signupData.state} 
              onBlur={() => handleBlur('state')}
              onChange={e => {
                setSignupData({...signupData, state: e.target.value, city: ''});
                if(signupErrors.state) setSignupErrors({...signupErrors, state: ''});
              }} 
              className={getInputClass('state')}
            >
              <option value="">UF</option>
              {Object.entries(BR_STATES_CITIES).map(([uf, data]) => (
                <option key={uf} value={uf}>{uf} - {data.name}</option>
              ))}
            </select>
            {renderError('state')}
         </div>
         <div className="space-y-1">
            <label className="text-[7px] text-zinc-600 font-black uppercase tracking-widest ml-4">Cidade</label>
            <select 
              value={signupData.city} 
              onBlur={() => handleBlur('city')}
              disabled={!signupData.state} 
              onChange={e => {
                setSignupData({...signupData, city: e.target.value});
                if(signupErrors.city) setSignupErrors({...signupErrors, city: ''});
              }} 
              className={getInputClass('city')}
            >
              <option value="">Cidade</option>
              {signupData.state && BR_STATES_CITIES[signupData.state].cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            {renderError('city')}
         </div>
      </div>
      <button 
        onClick={() => setSignupStep(2)} 
        disabled={!isStep1Valid}
        className="w-full py-5 bg-white text-black font-black rounded-full uppercase text-[10px] tracking-widest active:scale-95 transition-all mt-4 disabled:opacity-30 disabled:pointer-events-none"
      >
        Próximo
      </button>
      <button 
        onClick={onBackToLanding} 
        className="w-full py-2 text-zinc-700 text-[8px] font-black uppercase tracking-widest"
      >
        Voltar
      </button>
    </div>
  );
};
