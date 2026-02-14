
import React from 'react';
import { SignupStepBasic } from './steps/SignupStepBasic';
import { SignupStepContact } from './steps/SignupStepContact';
import { SignupStepBiometry } from './steps/SignupStepBiometry';

interface AuthSignupProps {
  signupStep: number;
  setSignupStep: (step: number) => void;
  signupData: any;
  setSignupData: (data: any) => void;
  signupErrors: Record<string, string>;
  setSignupErrors: (errors: any) => void;
  touched: Record<string, boolean>;
  setTouched: (touched: any) => void;
  isProcessing: boolean;
  onSignupFinalize: (blob: Blob) => void;
  onBackToLanding: () => void;
  renderError: (field: string) => React.ReactNode;
  getInputClass: (field: string) => string;
  isStep1Valid: boolean;
  isStep2Valid: boolean;
  handleBlur: (field: string) => void;
}

export const AuthSignup: React.FC<AuthSignupProps> = ({
  signupStep, setSignupStep, signupData, setSignupData, signupErrors, setSignupErrors, touched, setTouched,
  isProcessing, onSignupFinalize, onBackToLanding, renderError, getInputClass, isStep1Valid, isStep2Valid, handleBlur
}) => {
  return (
    <div className="w-full max-w-md py-10">
       <div className="text-center mb-8">
         <h2 className="text-3xl font-serif italic text-white uppercase tracking-tighter">Membro VANTA</h2>
         <p className="text-[8px] text-zinc-500 font-black uppercase tracking-[0.4em] mt-2">Protocolo Etapa {signupStep} de 3</p>
       </div>
       
       <div className="bg-zinc-950/40 border border-white/10 rounded-[3rem] p-8 relative overflow-hidden">
         {signupStep === 1 && (
           <SignupStepBasic 
             signupData={signupData}
             setSignupData={setSignupData}
             signupErrors={signupErrors}
             setSignupErrors={setSignupErrors}
             touched={touched}
             setTouched={setTouched}
             handleBlur={handleBlur}
             getInputClass={getInputClass}
             renderError={renderError}
             setSignupStep={setSignupStep}
             onBackToLanding={onBackToLanding}
             isStep1Valid={isStep1Valid}
           />
         )}

         {signupStep === 2 && (
           <SignupStepContact 
             signupData={signupData}
             setSignupData={setSignupData}
             signupErrors={signupErrors}
             setSignupErrors={setSignupErrors}
             handleBlur={handleBlur}
             getInputClass={getInputClass}
             renderError={renderError}
             setSignupStep={setSignupStep}
             isStep2Valid={isStep2Valid}
           />
         )}

         {signupStep === 3 && (
           <SignupStepBiometry 
             signupErrors={signupErrors}
             setSignupErrors={setSignupErrors}
             setSignupStep={setSignupStep}
             isProcessing={isProcessing}
             onSignupFinalize={onSignupFinalize}
             onBackToLanding={onBackToLanding}
           />
         )}
       </div>
    </div>
  );
};
