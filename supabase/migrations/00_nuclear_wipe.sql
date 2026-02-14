-- ============================================================
-- VANTA STEP 1: NUCLEAR WIPE (SCHEMA PUBLIC ONLY)
-- ------------------------------------------------------------
-- CORREÇÃO: O Supabase bloqueia deleção direta de Storage via SQL.
-- Este script zera completamente o schema 'public' (Tabelas, Dados, Triggers).
-- Para limpar arquivos de Storage, utilize o Dashboard do Supabase.
-- ============================================================

BEGIN;

-- 1. DESTRUIÇÃO DO SCHEMA PUBLIC
-- O CASCADE remove todas as dependências (Tabelas, Views, Functions, etc).
DROP SCHEMA IF EXISTS public CASCADE;


COMMIT;

-- FIM DO WIPE.
-- O BANCO DE DADOS AGORA ESTÁ UMA FOLHA EM BRANCO.
-- (Os arquivos no Storage permanecerão até serem removidos via Dashboard)
