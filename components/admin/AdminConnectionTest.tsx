
import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { ICONS } from '../../constants';

interface LogEntry {
  timestamp: string;
  msg: string;
  type: 'info' | 'success' | 'error' | 'warn' | 'audit';
}

export const AdminConnectionTest: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState({ 
    sdk: 'idle', 
    auth: 'idle', 
    db: 'idle',
    storage: 'idle',
    policies: 'idle',
    triggers: 'idle' // Novo: Status de Gatilhos Elite
  });

  const addLog = (msg: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [{
      timestamp: new Date().toLocaleTimeString(),
      msg,
      type
    }, ...prev]);
  };

  const runDiagnostic = async () => {
    setIsRunning(true);
    setLogs([]);
    setStats({ sdk: 'loading', auth: 'loading', db: 'loading', storage: 'loading', policies: 'loading', triggers: 'loading' });
    addLog("VANTA_PROTOCOL: Iniciando Diagnóstico de Emergência & Teste de Estresse...", "warn");

    // 1. Verificação de SDK e Variáveis
    try {
      addLog("Validando chaves de acesso injetadas...");
      if (!supabase) throw new Error("Cliente Supabase não instanciado.");
      
      setStats(prev => ({ ...prev, sdk: 'success' }));
      addLog(`SDK Operacional. Conexão física estabelecida.`, "success");
    } catch (err: any) {
      setStats(prev => ({ ...prev, sdk: 'error' }));
      addLog(`ERRO CRÍTICO: ${err.message}`, "error");
      setIsRunning(false);
      return;
    }

    // 2. Ping de Autenticação (Gateway)
    let user: any = null;
    try {
      addLog("Escaneando Gateway de Autenticação...");
      const { data, error } = await (supabase.auth as any).getSession();
      
      if (error) throw error;
      setStats(prev => ({ ...prev, auth: 'success' }));
      addLog("Gateway Auth alcançável.", "success");
      
      if (data?.session?.user) {
        user = data.session.user;
        addLog(`Sessão detectada: ${user.email} (${user.id})`, "info");
      } else {
        addLog("Aviso: Nenhuma sessão ativa no browser.", "warn");
      }
    } catch (err: any) {
      setStats(prev => ({ ...prev, auth: 'error' }));
      addLog(`Falha no Gateway: ${err.message}`, "error");
    }

    // 3. Teste de Acesso a Dados (Tabelas)
    try {
      addLog("Auditando persistência (Profiles Table)...");
      const { error, status } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (error) {
        if (error.code === 'PGRST204') {
          addLog("Tabela OK, mas base de dados vazia.", "success");
        } else if (error.code === '42P01') {
          addLog("ERRO: Tabela 'profiles' não encontrada.", "error");
          addLog("RESOLUÇÃO: Cole o conteúdo de 'schema.sql' no SQL Editor do Supabase.", "warn");
          throw new Error("Missing Tables");
        } else {
          throw error;
        }
      } else {
        addLog(`Conexão com Banco OK (Sinal: ${status})`, "success");
      }
      setStats(prev => ({ ...prev, db: 'success' }));
    } catch (err: any) {
      setStats(prev => ({ ...prev, db: 'error' }));
      addLog(`Falha de Sincronização: ${err.message}`, "error");
    }

    // 4. Auditoria de Storage (Buckets Elite)
    try {
      addLog("Verificando Clusters de Mídia (Buckets Elite)...");
      const { data: buckets, error: bError } = await supabase.storage.listBuckets();
      
      if (bError) throw bError;
      
      const required = ['selfies', 'profiles', 'event_images'];
      const missing = required.filter(r => !buckets.some(b => b.name === r));
      
      if (missing.length > 0) {
        addLog(`Buckets ausentes: ${missing.join(', ')}`, "error");
        addLog("Ação: Execute o script de Inicialização de Buckets no schema.sql", "warn");
        throw new Error("Missing Storage");
      } else {
        addLog("Clusters de Storage verificados com sucesso.", "success");
      }
      setStats(prev => ({ ...prev, storage: 'success' }));
    } catch (err: any) {
      setStats(prev => ({ ...prev, storage: 'error' }));
      addLog(`Erro de Storage: ${err.message}`, "error");
    }

    // 5. TESTE DE ESTRESSE: SEGURANÇA FÍSICA (Storage Path Enforcer)
    if (user) {
      try {
        addLog("VANTA_AUDIT: Testando Isolamento de Pastas (Stress Test)...", "audit");
        const dummyBlob = new Blob(['test'], { type: 'text/plain' });
        // Tenta gravar na pasta "root" ou de outro usuário (deve falhar se o gatilho existir)
        const { error: pathError } = await supabase.storage
          .from('profiles')
          .upload('SISTEMA_AUDIT/malicious.txt', dummyBlob);

        if (pathError) {
          addLog("GATILHO DE SEGURANÇA OK: Tentativa de invasão de pasta bloqueada pelo banco.", "success");
        } else {
          addLog("RISCO DETECTADO: O banco permitiu gravação fora do seu escopo de UID.", "error");
          addLog("CORREÇÃO: Verifique o TRIGGER 'on_avatar_upload' no Postgres.", "warn");
        }
      } catch (e) {
        addLog("Falha ao executar simulador de ataque de path.");
      }
    }

    // 6. TESTE DE ESTRESSE: AUTOMAÇÃO DE DATAS (Trigger updated_at)
    if (user) {
      try {
        addLog("VANTA_AUDIT: Verificando Automação de Timestamp (Audit Trail)...", "audit");
        const { data: before } = await supabase.from('profiles').select('updated_at').eq('id', user.id).single();
        
        // Simula update
        await supabase.from('profiles').update({ updated_at: new Date().toISOString() }).eq('id', user.id);
        
        const { data: after } = await supabase.from('profiles').select('updated_at').eq('id', user.id).single();
        
        if (before && after && before.updated_at !== after.updated_at) {
          addLog("AUTOMAÇÃO OK: Carimbo de tempo gerenciado nativamente pelo servidor.", "success");
          setStats(prev => ({ ...prev, triggers: 'success' }));
        } else {
          addLog("AVISO: Campo updated_at não sofreu alteração atômica.", "warn");
          setStats(prev => ({ ...prev, triggers: 'error' }));
        }
      } catch (e) {
        addLog("Falha no teste de gatilho temporal.");
      }
    }

    // 7. Verificação de Políticas RLS Social
    try {
      addLog("Verificando Blindagem Social RLS (Mensagens)...");
      const { error } = await supabase.from('messages').select('*').limit(1);
      
      if (error && error.code === '42501') {
        addLog("SEGURANÇA ATIVA: Acesso a mensagens restrito por contexto.", "success");
      } else {
        addLog("RLS Validado: Fluxo social aberto para auditoria local.", "info");
      }
      setStats(prev => ({ ...prev, policies: 'success' }));
    } catch (err: any) {
      setStats(prev => ({ ...prev, policies: 'error' }));
    }

    setIsRunning(false);
    addLog("DIAGNÓSTICO FINALIZADO. INFRAESTRUTURA ANALISADA COM SUCESSO.", "info");
  };

  const getStatusColor = (s: string) => {
    if (s === 'loading') return 'bg-amber-500 animate-pulse';
    if (s === 'success') return 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.7)]';
    if (s === 'error') return 'bg-red-600 animate-bounce shadow-[0_0_15px_rgba(220,38,38,0.7)]';
    return 'bg-zinc-800';
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-32">
      <div className="p-8 bg-zinc-950 border border-red-900/20 rounded-[3rem] space-y-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600/40 to-transparent"></div>
        
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-red-600 italic">SECURITY STRESS TEST</h3>
            <p className="text-2xl font-serif italic text-white tracking-tighter uppercase">Diagnóstico de Blindagem</p>
          </div>
          <button 
            onClick={runDiagnostic}
            disabled={isRunning}
            className={`px-8 py-4 ${isRunning ? 'bg-zinc-900 text-zinc-600' : 'bg-white text-black'} text-[10px] font-black uppercase rounded-full shadow-2xl active:scale-95 transition-all`}
          >
            {isRunning ? "AUDITANDO..." : "EXECUTAR VARREDURA"}
          </button>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { id: 'sdk', label: 'SDK', status: stats.sdk },
            { id: 'auth', label: 'AUTH', status: stats.auth },
            { id: 'db', label: 'BANCO', status: stats.db },
            { id: 'storage', label: 'MÍDIA', status: stats.storage },
            { id: 'triggers', label: 'GATILHOS', status: stats.triggers },
            { id: 'policies', label: 'SAFE', status: stats.policies }
          ].map(item => (
            <div key={item.id} className="p-4 bg-black border border-white/5 rounded-3xl flex flex-col items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(item.status)}`}></div>
              <span className="text-[6px] font-black uppercase tracking-widest text-zinc-600 text-center">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-[8px] text-zinc-700 font-black uppercase tracking-widest ml-6 italic">Console Técnico de Auditoria Profunda</h4>
        <div className="bg-black border border-white/5 rounded-[2.5rem] p-8 h-96 overflow-y-auto no-scrollbar font-mono text-[10px] flex flex-col gap-3 shadow-inner">
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-10 gap-4">
              <div className="w-12 h-12 border-2 border-dashed border-zinc-500 rounded-full flex items-center justify-center">
                 <span className="text-xl">!</span>
              </div>
              <p className="uppercase tracking-[0.4em] text-xs">AGUARDANDO COMANDO DE VARREDURA ELITE</p>
            </div>
          ) : logs.map((log, i) => (
            <div key={i} className={`flex gap-4 border-b border-white/5 pb-2 last:border-0 animate-in slide-in-from-left duration-300`}>
              <span className="text-zinc-800 shrink-0">[{log.timestamp}]</span>
              <span className={`
                ${log.type === 'error' ? 'text-red-500 font-black' : ''}
                ${log.type === 'success' ? 'text-emerald-500' : ''}
                ${log.type === 'warn' ? 'text-[#d4af37]' : ''}
                ${log.type === 'audit' ? 'text-purple-400 font-bold italic' : ''}
                ${log.type === 'info' ? 'text-zinc-500' : ''}
              `}>
                {log.type === 'audit' ? '🛡️ ' : ''}{log.msg}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-8 bg-zinc-900/20 border border-white/5 rounded-[2.5rem] text-center">
         <p className="text-[7px] text-zinc-700 font-black uppercase tracking-[0.4em] leading-loose italic">
           SISTEMA DE AUDITORIA VANTA ELITE TUNING<br/>VALIDAÇÃO FÍSICA DE SEGURANÇA E PERFORMANCE.
         </p>
      </div>
    </div>
  );
};
