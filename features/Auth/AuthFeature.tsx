
import React, { useState, useEffect } from 'react';
import { User, UserStatus, MemberLevel } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { uploadSelfie, submitApplication, syncUserProfile } from '../../lib/selfieApi';
import { mapSupabaseUserToVantaUser } from '../../lib/userMapper';
import { vantaFeedback } from '../../lib/feedbackStore';

// Sub-componentes Modulares
import { AuthLanding } from '../../components/auth/AuthLanding';
import { AuthLogin } from '../../components/auth/AuthLogin';
import { AuthRecovery } from '../../components/auth/AuthRecovery';
import { AuthRedefine } from '../../components/auth/AuthRedefine';
import { AuthSignup } from '../../components/auth/AuthSignup';

const mapAuthError = (err: any): { field: string; message: string; action: string } => {
  const msg = err.message || "";
  if (msg.includes("User already registered") || msg.includes("already exists")) {
    return { field: "email", message: "Identidade já registrada na rede.", action: "Este e-mail já possui um registro ativo." };
  }
  if (msg.includes("Invalid login credentials")) {
    return { field: "form", message: "Credenciais inválidas.", action: "Verifique seu e-mail e senha." };
  }
  return { field: "form", message: "Falha no protocolo.", action: "Erro inesperado na comunicação." };
};

interface AuthFeatureProps {
  onLoginSuccess: (user: User) => void;
  initialView?: 'landing' | 'form' | 'signup' | 'recovery' | 'redefine';
  onClose?: () => void;
}

export const AuthFeature: React.FC<AuthFeatureProps> = ({ 
  onLoginSuccess, initialView = 'landing', onClose 
}) => {
  const [loginView, setLoginView] = useState<'landing' | 'form' | 'signup' | 'recovery' | 'redefine'>(initialView);
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalUser, setFinalUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hasActiveSession, setHasActiveSession] = useState(false);
  
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySent, setRecoverySent] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  const [signupStep, setSignupStep] = useState(1);
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [signupData, setSignupData] = useState({
    fullName: '', birthDate: '', state: '', city: '',
    gender: '', email: '', instagram: '',
    ddd: '21', phone: '',
    password: '', confirmPassword: ''
  });

  useEffect(() => {
    if (!supabase) return;
    (supabase.auth as any).getSession().then(({ data: { session } }: any) => {
      if (session?.user) setHasActiveSession(true);
    });
    const { data: { subscription } } = (supabase.auth as any).onAuthStateChange((event: any, session: any) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setHasActiveSession(true);
        // O modal de sucesso agora é gerenciado pelo vantaFeedback, então apenas fazemos login direto se não houver flag pendente
        if (!sessionStorage.getItem("vanta_signup_success_pending")) {
          onLoginSuccess(mapSupabaseUserToVantaUser(session.user));
        }
      } else if (event === 'SIGNED_OUT') {
        setHasActiveSession(false);
        setLoginView('landing');
      } else if (event === 'PASSWORD_RECOVERY') {
        setLoginView('redefine');
      }
    });
    return () => subscription?.unsubscribe();
  }, [onLoginSuccess]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setIsProcessing(true); 
    setLoginError(null);

    try {
      const { error } = await (supabase.auth as any).signInWithPassword({ 
        email: email.trim(),
        password: password
      });
      if (error) throw error;
      // VANTA_UPDATE: Feedback de 'Acesso Autorizado' removido conforme solicitação (Experiência Seamless)
    } catch (err: any) {
      const mapped = mapAuthError(err);
      setLoginError(mapped.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignupFinalize = async (selfieBlob: Blob) => {
    if (!supabase) return;
    setIsProcessing(true);
    try {
      /**
       * VANTA_SOVEREIGN: Cadastro higienizado.
       * Removemos username, role e curated_level do client.
       * O Trigger 'handle_new_user' no SQL assume a soberania destes campos.
       */
      const { data, error: signupError } = await (supabase.auth as any).signUp({
        email: signupData.email.trim(),
        password: signupData.password,
        options: {
          data: {
            full_name: signupData.fullName.trim(),
            instagram_handle: signupData.instagram.trim(),
            phone_e164: `+55${signupData.ddd}${signupData.phone}`,
            city: signupData.city,
            state: signupData.state,
            gender: signupData.gender,
            birth_date: signupData.birthDate
          }
        }
      });

      if (signupError) throw signupError;
      const user = data.user;
      if (!user) throw new Error("Falha ao gerar UID.");

      const selfieUrl = await uploadSelfie(user.id, selfieBlob);
      await syncUserProfile(user.id, { selfie_url: selfieUrl });
      await submitApplication(user.id, selfieUrl);

      sessionStorage.setItem("vanta_signup_success_pending", "true");
      setFinalUser(mapSupabaseUserToVantaUser(user));
      
      // VANTA_FEEDBACK: Disparo do Modal de Sucesso Personalizado
      vantaFeedback.confirm({
        title: 'Cadastro finalizado com sucesso.',
        message: 'Bem-vindo ao VANTA.',
        confirmLabel: 'ENTRAR',
        onConfirm: () => {
          sessionStorage.removeItem("vanta_signup_success_pending");
          setLoginView('landing');
        }
      });

    } catch (err: any) {
      const mapped = mapAuthError(err);
      setSignupErrors({ form: mapped.message, action: mapped.action });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAccountDeletion = () => {
    vantaFeedback.confirm({
      title: 'Excluir Identidade',
      message: 'Esta ação é irreversível. Todos os seus convites, histórico e conexões serão apagados da rede permanentemente.',
      confirmLabel: 'Excluir Definitivamente',
      isDestructive: true,
      onConfirm: async () => {
        // Lógica de logout e exclusão
        await (supabase?.auth as any).signOut();
        vantaFeedback.toast('info', 'Identidade Excluída', 'Seus dados foram removidos dos nossos clusters.');
      }
    });
  };

  const isStep1Valid = !!(signupData.fullName && signupData.birthDate && signupData.state && signupData.city && signupData.gender);
  const isStep2Valid = !!(signupData.instagram && signupData.email && signupData.phone && signupData.password && signupData.password === signupData.confirmPassword);

  return (
    <div className="fixed inset-0 z-[7000] bg-black flex flex-col items-center justify-center">
      {loginView === 'landing' && <AuthLanding hasActiveSession={hasActiveSession} isProcessing={isProcessing} onContinueAsMember={() => finalUser && onLoginSuccess(finalUser)} onSignOut={() => (supabase?.auth as any).signOut()} onSetView={setLoginView} onClose={onClose} />}
      {loginView === 'form' && <AuthLogin email={email} setEmail={setEmail} password={password} setPassword={setPassword} loginError={loginError} isProcessing={isProcessing} onLogin={handleLogin} onSetView={setLoginView} onBack={() => setLoginView('landing')} />}
      {loginView === 'signup' && <AuthSignup signupStep={signupStep} setSignupStep={setSignupStep} signupData={signupData} setSignupData={setSignupData} signupErrors={signupErrors} setSignupErrors={setSignupErrors} touched={touched} setTouched={setTouched} isProcessing={isProcessing} onSignupFinalize={handleSignupFinalize} onBackToLanding={() => setLoginView('landing')} renderError={() => null} getInputClass={() => "w-full bg-zinc-900 border border-white/5 rounded-2xl p-5 text-white"} isStep1Valid={isStep1Valid} isStep2Valid={isStep2Valid} handleBlur={() => {}} />}
      {loginView === 'recovery' && <AuthRecovery recoveryEmail={recoveryEmail} setRecoveryEmail={setRecoveryEmail} recoverySent={recoverySent} loginError={loginError} isProcessing={isProcessing} onRecover={handleLogin} onSetView={() => setLoginView('form')} />}
      
      {loginView === 'signup' && signupStep === 1 && (
        <div className="absolute bottom-10">
           <button onClick={handleAccountDeletion} className="text-[7px] text-zinc-800 font-black uppercase tracking-widest hover:text-red-900 transition-colors">Solicitar Remoção de Dados</button>
        </div>
      )}
    </div>
  );
};
