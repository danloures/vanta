import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';

export default defineConfig(({ mode }) => {
  // ✅ VANTA_SYNC: carregue apenas variáveis VITE_ (padrão do Vite)
  const env = loadEnv(mode, (process as any).cwd(), 'VITE_');

  return {
    plugins: [react()],
    base: './',
    server: {
      port: 3000,
    },
    // ✅ Não precisamos mais injetar process.env.API_KEY (browser não usa isso)
    // Se algum código ainda depender disso, ele deve usar import.meta.env (já fizemos no geminiService).
    define: {},
  };
});
