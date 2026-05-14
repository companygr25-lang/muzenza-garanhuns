-- Muzenza Database Setup (Complete & Fresh)
-- Run this in the Supabase SQL Editor

-- 1. DROP EVERYTHING (Optional - remove if you want to keep existing data)
-- DROP TABLE IF EXISTS public.attendance CASCADE;
-- DROP TABLE IF EXISTS public.config CASCADE;
-- DROP TABLE IF EXISTS public.store_items CASCADE;
-- DROP TABLE IF EXISTS public.events CASCADE;
-- DROP TABLE IF EXISTS public.users CASCADE;

-- 2. Tables Definition

-- Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    phone TEXT,
    graduation TEXT DEFAULT 'Sem Corda',
    monthly_paid BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events Table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Config Table
CREATE TABLE IF NOT EXISTS public.config (
    id TEXT PRIMARY KEY,
    highlighted_event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    pix_key TEXT,
    pix_name TEXT,
    pix_bank TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store Items Table
CREATE TABLE IF NOT EXISTS public.store_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    category TEXT,
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    present BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- 3. Security Configuration (Disable RLS for ease of use)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.config DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance DISABLE ROW LEVEL SECURITY;

-- 4. GRANT PERMISSIONS (Just in case the service role isn't being used)
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- 5. Initial Seed Data
INSERT INTO public.users (username, password, role, graduation)
VALUES ('BOLACHA', '123456', 'admin', 'Marrom - MESTRE')
ON CONFLICT (username) DO NOTHING;

INSERT INTO public.config (id) VALUES ('global') ON CONFLICT (id) DO NOTHING;

-- 6. IMPORTANT: ENABLE REALTIME (Automatic Sync)
-- Para que a sincronização automática funcione, você deve habilitar o Realtime no Dashboard do Supabase:
-- 1. Vá em 'Database' -> 'Replication'
-- 2. Clique no card 'supabase_realtime' (ou crie uma nova publicação)
-- 3. Marque as tabelas: 'users', 'attendance', 'events', 'store_items', 'config'
-- 4. Clique em 'Save' ou 'Update'
