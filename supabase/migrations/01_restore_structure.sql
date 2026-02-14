
-- ============================================================
-- VANTA ECOSISTEMA: MASTER STRUCTURE V10.0 (HARDENED SOVEREIGN)
-- ============================================================

BEGIN;

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. PROFILES & CORE
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    username TEXT UNIQUE,
    instagram_handle TEXT,
    email TEXT NOT NULL,
    avatar_url TEXT,
    gender TEXT,
    birth_date DATE,
    phone_e164 TEXT,
    level TEXT DEFAULT 'Vanta Classic',
    curated_level TEXT[] DEFAULT ARRAY['vanta classic'],
    role TEXT DEFAULT 'user',
    bio TEXT,
    city TEXT,
    state TEXT,
    selfie_url TEXT,
    gallery JSONB DEFAULT '[]'::jsonb,
    privacy JSONB DEFAULT '{"profileInfo": "todos", "confirmedEvents": "amigos", "messages": "amigos"}'::jsonb,
    permissions JSONB DEFAULT '{}'::jsonb,
    followers_count INTEGER DEFAULT 0,
    is_globally_restricted BOOLEAN DEFAULT false,
    restriction_notes TEXT,
    approved_by_name TEXT,
    approved_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. SECURITY DEFINER RPCs (search_path forced)
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
    WHERE (search_query = '' OR p.full_name ILIKE '%' || search_query || '%' OR p.instagram_handle ILIKE '%' || search_query || '%')
      AND p.approved_at IS NOT NULL LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_public_profile(target_id UUID)
RETURNS TABLE (
    id UUID,
    username TEXT,
    full_name TEXT,
    instagram_handle TEXT,
    avatar_url TEXT,
    bio TEXT,
    city TEXT,
    state TEXT,
    gender TEXT,
    role TEXT,
    curated_level TEXT[],
    followers_count INTEGER,
    is_globally_restricted BOOLEAN,
    approved_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id, p.username, p.full_name, p.instagram_handle, p.avatar_url,
        p.bio, p.city, p.state, p.gender, p.role, p.curated_level,
        p.followers_count, p.is_globally_restricted, p.approved_at
    FROM public.profiles p
    WHERE p.id = target_id
      AND p.approved_at IS NOT NULL
    LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_member_role(target_id UUID, new_role TEXT, new_perms JSONB)
RETURNS BOOLEAN AS $$
DECLARE
    is_master BOOLEAN;
BEGIN
    -- Verifica se o executor é MASTER
    SELECT (role IN ('admin', 'master', 'vanta_master')) INTO is_master 
    FROM public.profiles WHERE id = auth.uid();
    
    IF NOT is_master THEN RETURN FALSE; END IF;

    UPDATE public.profiles 
    SET role = new_role, permissions = new_perms, updated_at = now()
    WHERE id = target_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. TRIGGER (Auto-Approve Hardened V10)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    instagram_handle, 
    username, 
    phone_e164, 
    city, 
    state, 
    gender, 
    birth_date, 
    role, 
    curated_level, 
    approved_at
  )
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'Membro VANTA'),
    NULLIF(new.raw_user_meta_data->>'instagram_handle', ''),
    LOWER(COALESCE(new.raw_user_meta_data->>'instagram_handle', 'vanta_' || substr(new.id::text, 1, 8))),
    new.raw_user_meta_data->>'phone_e164',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'state',
    new.raw_user_meta_data->>'gender',
    (new.raw_user_meta_data->>'birth_date')::date,
    'user', 
    ARRAY['vanta classic'], 
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Helper function for Master check
CREATE OR REPLACE FUNCTION public.is_master_executor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
      AND role IN ('admin', 'master', 'vanta_master')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Invariant Protections
CREATE OR REPLACE FUNCTION public.enforce_event_invariants()
RETURNS trigger AS $$
BEGIN
  IF NOT public.is_master_executor() THEN
    IF NEW.community_id IS DISTINCT FROM OLD.community_id THEN 
      RAISE EXCEPTION 'V10: Jurisdição bloqueada. Não pode alterar community_id.';
    END IF;
    IF NEW.creator_id IS DISTINCT FROM OLD.creator_id THEN 
      RAISE EXCEPTION 'V10: Jurisdição bloqueada. Não pode alterar creator_id.';
    END IF;
  END IF;
  NEW.updated_at := timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.enforce_community_invariants()
RETURNS trigger AS $$
BEGIN
  IF NOT public.is_master_executor() THEN
    IF NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN 
      RAISE EXCEPTION 'V10: Jurisdição bloqueada. Não pode alterar owner_id.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. TABLES (Subsidaries)
CREATE TABLE public.communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id),
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    logo_url TEXT,
    type TEXT NOT NULL DEFAULT 'BOATE', 
    address TEXT, city TEXT, state TEXT,
    latitude DOUBLE PRECISION, longitude DOUBLE PRECISION,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.community_co_owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(community_id, user_id)
);

CREATE TABLE public.vanta_staff_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
    name TEXT NOT NULL, description TEXT,
    dos JSONB DEFAULT '[]'::jsonb, donts JSONB DEFAULT '[]'::jsonb,
    is_global BOOLEAN DEFAULT false, permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.community_staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    template_id UUID REFERENCES public.vanta_staff_templates(id) ON DELETE SET NULL,
    role_name TEXT NOT NULL, permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(community_id, user_id)
);

CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES public.profiles(id),
    title TEXT NOT NULL, description TEXT, image_url TEXT,
    start_at TIMESTAMP WITH TIME ZONE NOT NULL, end_at TIMESTAMP WITH TIME ZONE,
    venue TEXT, address TEXT, city TEXT, state TEXT,
    latitude DOUBLE PRECISION, longitude DOUBLE PRECISION,
    capacity INTEGER DEFAULT 200, is_vip_only BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true, is_featured BOOLEAN DEFAULT false,
    is_transfer_enabled BOOLEAN DEFAULT true,
    staff JSONB DEFAULT '[]'::jsonb, batches JSONB DEFAULT '[]'::jsonb, 
    guest_list_rules JSONB DEFAULT '[]'::jsonb, vibe_tags TEXT[] DEFAULT '{}'::TEXT[],
    lineup TEXT, dress_code TEXT, entry_tips TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.vanta_global_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE, color TEXT DEFAULT '#d4af37', priority INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    receiver_id UUID NOT NULL REFERENCES auth.users(id),
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'friends')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, friend_id)
);

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    from_user_id UUID REFERENCES auth.users(id),
    type TEXT NOT NULL, text TEXT NOT NULL,
    member_id UUID, event_id UUID, read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.vanta_indica (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT CHECK (type IN ('EVENT', 'LINK')),
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    url TEXT, title TEXT NOT NULL, image_url TEXT NOT NULL, tag TEXT, city TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.event_guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    rule_id TEXT NOT NULL, name TEXT NOT NULL, user_id UUID REFERENCES public.profiles(id),
    added_by_email TEXT NOT NULL, checked_in BOOLEAN DEFAULT false,
    checked_in_at TIMESTAMP WITH TIME ZONE, checked_in_by_email TEXT,
    notify_on_arrival BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.user_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    variation_id TEXT, hash TEXT UNIQUE NOT NULL, status TEXT DEFAULT 'active',
    source TEXT DEFAULT 'purchase', used_at TIMESTAMP WITH TIME ZONE,
    guest_name TEXT, guest_cpf TEXT, promoter_id UUID REFERENCES public.profiles(id),
    notify_on_arrival BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. RLS HARDENING V10 (Split Verbs)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tickets ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Profiles Select Self" ON public.profiles;
DROP POLICY IF EXISTS "Profiles Update Self" ON public.profiles;
CREATE POLICY "Profiles Select Self" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Profiles Update Self" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Profiles Insert Self" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Communities Policies
DROP POLICY IF EXISTS "Public Read Communities" ON public.communities;
DROP POLICY IF EXISTS "Community Owner Manage" ON public.communities;
CREATE POLICY "Public Read Communities" ON public.communities FOR SELECT USING (true);
CREATE POLICY "Community Master Create" ON public.communities FOR INSERT
WITH CHECK (public.is_master_executor());
CREATE POLICY "Community Sovereign Update" ON public.communities FOR UPDATE
USING (
  owner_id = auth.uid()
  OR id IN (SELECT community_id FROM public.community_co_owners WHERE user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.community_staff cs
    WHERE cs.community_id = id
      AND cs.user_id = auth.uid()
      AND COALESCE((cs.permissions->>'unit_edit')::boolean, false) = true
  )
);

-- Events Policies
DROP POLICY IF EXISTS "Public Read Events" ON public.events;
DROP POLICY IF EXISTS "Event Sovereign Manage" ON public.events;
CREATE POLICY "Public Read Events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Event Sovereign Create" ON public.events FOR INSERT
WITH CHECK (
  creator_id = auth.uid()
  AND (
    community_id IN (SELECT id FROM public.communities WHERE owner_id = auth.uid())
    OR community_id IN (SELECT community_id FROM public.community_co_owners WHERE user_id = auth.uid())
  )
);
CREATE POLICY "Event Sovereign Update" ON public.events FOR UPDATE
USING (
  creator_id = auth.uid()
  OR community_id IN (SELECT id FROM public.communities WHERE owner_id = auth.uid())
  OR community_id IN (SELECT community_id FROM public.community_co_owners WHERE user_id = auth.uid())
  OR community_id IN (
    SELECT cs.community_id
    FROM public.community_staff cs
    WHERE cs.user_id = auth.uid()
      AND COALESCE((cs.permissions->>'event_edit')::boolean, false) = true
  )
);

-- Other Policies
CREATE POLICY "Chat Privacy" ON public.messages FOR ALL USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Ticket Privacy" ON public.user_tickets FOR SELECT USING (auth.uid() = user_id);

-- Apply Invariant Triggers
DROP TRIGGER IF EXISTS trg_enforce_event_invariants ON public.events;
CREATE TRIGGER trg_enforce_event_invariants BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.enforce_event_invariants();

DROP TRIGGER IF EXISTS trg_enforce_community_invariants ON public.communities;
CREATE TRIGGER trg_enforce_community_invariants BEFORE UPDATE ON public.communities FOR EACH ROW EXECUTE FUNCTION public.enforce_community_invariants();

-- 6. GRANTS
GRANT EXECUTE ON FUNCTION public.search_public_profiles(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_profile(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_member_role(UUID, TEXT, JSONB) TO authenticated;

GRANT SELECT ON public.communities, public.events, public.vanta_indica TO anon, authenticated;
GRANT SELECT, UPDATE, INSERT ON public.profiles, public.user_tickets TO authenticated;
GRANT ALL ON public.messages, public.friendships, public.event_guests TO authenticated;

-- 7. STORAGE IDEMPOTENT
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public Select Storage" ON storage.objects;
    DROP POLICY IF EXISTS "Auth Insert Storage" ON storage.objects;
EXCEPTION WHEN others THEN NULL;
END $$;

CREATE POLICY "Public Select Storage" ON storage.objects FOR SELECT USING (bucket_id IN ('selfies', 'profiles', 'event_images', 'communities'));
CREATE POLICY "Auth Insert Storage" ON storage.objects FOR INSERT WITH CHECK (auth.role() = 'authenticated');

COMMIT;
