-- ============================================================
-- VANTA MIGRATION: FRIENDSHIP RLS POLICIES
-- Corrige o bloqueio silencioso ao tentar adicionar amigos
-- ============================================================

BEGIN;

-- 1. Garante que RLS está ativo
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- 2. Limpa políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Friendship Read" ON public.friendships;
DROP POLICY IF EXISTS "Friendship Insert" ON public.friendships;
DROP POLICY IF EXISTS "Friendship Update" ON public.friendships;
DROP POLICY IF EXISTS "Friendship Delete" ON public.friendships;

-- 3. Policy: Leitura (Ver conexões onde sou user_id ou friend_id)
CREATE POLICY "Friendship Read" ON public.friendships
FOR SELECT USING (
  auth.uid() = user_id OR auth.uid() = friend_id
);

-- 4. Policy: Inserção (Criar pedido onde sou o remetente)
CREATE POLICY "Friendship Insert" ON public.friendships
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

-- 5. Policy: Atualização (Aceitar pedido onde sou parte da relação)
CREATE POLICY "Friendship Update" ON public.friendships
FOR UPDATE USING (
  auth.uid() = user_id OR auth.uid() = friend_id
);

-- 6. Policy: Deleção (Remover amigos ou cancelar pedidos)
CREATE POLICY "Friendship Delete" ON public.friendships
FOR DELETE USING (
  auth.uid() = user_id OR auth.uid() = friend_id
);

COMMIT;