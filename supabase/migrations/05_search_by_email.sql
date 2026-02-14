
-- ============================================================
-- VANTA MIGRATION: ENABLE EMAIL SEARCH
-- Atualiza a função de busca para incluir varredura por e-mail
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.search_public_profiles(search_query TEXT DEFAULT '')
RETURNS TABLE (
    id UUID, username TEXT, full_name TEXT, instagram_handle TEXT, avatar_url TEXT, 
    bio TEXT, city TEXT, state TEXT, gender TEXT, role TEXT, curated_level TEXT[], 
    followers_count INTEGER, is_globally_restricted BOOLEAN, approved_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, p.username, p.full_name, p.instagram_handle, p.avatar_url, 
        p.bio, p.city, p.state, p.gender, p.role, p.curated_level, 
        p.followers_count, p.is_globally_restricted, p.approved_at
    FROM public.profiles p
    WHERE (
        search_query = '' 
        OR p.full_name ILIKE '%' || search_query || '%' 
        OR p.instagram_handle ILIKE '%' || search_query || '%'
        OR p.email ILIKE '%' || search_query || '%'
    )
    AND p.approved_at IS NOT NULL LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMIT;
