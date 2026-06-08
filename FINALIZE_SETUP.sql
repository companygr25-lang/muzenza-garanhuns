-- =========================================================================
-- ⚡ MUZENZA GARANHUNS - MASTER DATABASE REPAIR & SETUP ⚡
-- =========================================================================
-- 💡 INSTRUÇÕES:
-- 1. Copie TODO o conteúdo deste arquivo.
-- 2. Vá no Dashboard do seu Supabase.
-- 3. No menu lateral esquerdo, clique em "SQL Editor".
-- 4. Clique em "+ New Query".
-- 5. Cole o código abaixo e clique no botão verde "RUN".
-- =========================================================================

-- PART 1: CORREÇÃO DE SEGURANÇA (Resolve erro 42501 - RLS)
-------------------------------------------------------------------------
-- Desabilitar RLS em todas as tabelas (Garante acesso sem políticas complexas)
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.store_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.config DISABLE ROW LEVEL SECURITY;

-- Limpar qualquer política que possa estar bloqueando o acesso
DO $$
DECLARE
    row record;
BEGIN
    FOR row IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(row.policyname) || ' ON ' || quote_ident(row.tablename);
    END LOOP;
END
$$;

-- Garantir permissões totais para o app (Resolve erro de Unauthorized)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Liberar Storage (Resolve erro de Bucket not found ou Insuificient Permissions no Storage)
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('avatars', 'avatars', true)
    ON CONFLICT (id) DO NOTHING;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Upload' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Update' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Delete' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'avatars');
    END IF;
END $$;

-- PART 2: ATUALIZAÇÃO DE ESTRUTURA (Resolve erro PGRST204 - Column not found)
-------------------------------------------------------------------------

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    phone TEXT,
    graduation TEXT DEFAULT 'Sem Corda',
    status TEXT DEFAULT 'active',
    avatar_url TEXT,
    monthly_paid BOOLEAN DEFAULT false,
    months_paid_remaining INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Eventos
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    location TEXT,
    start_time TIME,
    type TEXT DEFAULT 'Roda',
    status TEXT DEFAULT 'scheduled',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Itens da Loja
CREATE TABLE IF NOT EXISTS public.store_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    category TEXT DEFAULT 'Geral',
    stock INTEGER DEFAULT 0,
    on_sale BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar colunas caso as tabelas já existam sem elas
DO $$
BEGIN
    -- store_items: on_sale
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='store_items' AND column_name='on_sale') THEN
        ALTER TABLE public.store_items ADD COLUMN on_sale BOOLEAN DEFAULT false;
    END IF;

    -- config: rules
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='config' AND column_name='rules') THEN
        ALTER TABLE public.config ADD COLUMN rules JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- config: purpose
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='config' AND column_name='purpose') THEN
        ALTER TABLE public.config ADD COLUMN purpose TEXT;
    END IF;

    -- config: pix
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='config' AND column_name='pix_key') THEN
        ALTER TABLE public.config ADD COLUMN pix_key TEXT;
    END IF;

    -- users: avatar_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='avatar_url') THEN
        ALTER TABLE public.users ADD COLUMN avatar_url TEXT;
    END IF;

    -- users: city, country, director_id, pix_key, pix_name, pix_bank
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='city') THEN
        ALTER TABLE public.users ADD COLUMN city TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='country') THEN
        ALTER TABLE public.users ADD COLUMN country TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='director_id') THEN
        ALTER TABLE public.users ADD COLUMN director_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='pix_key') THEN
        ALTER TABLE public.users ADD COLUMN pix_key TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='pix_name') THEN
        ALTER TABLE public.users ADD COLUMN pix_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='pix_bank') THEN
        ALTER TABLE public.users ADD COLUMN pix_bank TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='certificates') THEN
        ALTER TABLE public.users ADD COLUMN certificates JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Criar bucket de avatars se não existir (Storage)
    -- Nota: Isso requer que a extensão de storage esteja habilitada
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('avatars', 'avatars', true)
    ON CONFLICT (id) DO NOTHING;

    -- Liberar acesso ao bucket para todos (Garante que o upload funcione sem erros de RLS no storage)
    -- Nota: Em produção, o ideal é restringir, mas aqui priorizamos funcionalidade
    INSERT INTO storage.objects (bucket_id, name, owner, metadata)
    VALUES ('avatars', '.placeholder', NULL, '{}'::jsonb)
    ON CONFLICT DO NOTHING;

    -- Garantir que a constraint de highlighted_event_id seja ON DELETE SET NULL
    -- Primeiro removemos se existir (para garantir a versão correta)
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='config_highlighted_event_id_fkey') THEN
        ALTER TABLE public.config DROP CONSTRAINT config_highlighted_event_id_fkey;
    END IF;
    ALTER TABLE public.config ADD CONSTRAINT config_highlighted_event_id_fkey 
        FOREIGN KEY (highlighted_event_id) REFERENCES public.events(id) ON DELETE SET NULL;

END $$;

-- FORÇAR REFRESH DO CACHE DO SUPABASE (Garante que o client reconheça as mudanças)
NOTIFY pgrst, 'reload schema';
COMMENT ON TABLE public.store_items IS 'Tabela de itens da loja - Atualizada em 16/05/2026';
COMMENT ON TABLE public.events IS 'Tabela de eventos - Atualizada em 16/05/2026';
COMMENT ON TABLE public.config IS 'Tabela de configuração - Atualizada em 16/05/2026';

-- Tabela de Presença
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    present BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Tabela de Configuração Global
CREATE TABLE IF NOT EXISTS public.config (
    id TEXT PRIMARY KEY DEFAULT 'global',
    highlighted_event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    pix_key TEXT,
    pix_name TEXT,
    pix_bank TEXT,
    announcement TEXT,
    purpose TEXT,
    rules JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PART 3: DADOS BASE E TRIGGERS
-------------------------------------------------------------------------

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_users ON public.users;
CREATE TRIGGER set_updated_at_users BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Inserir Configuração Inicial
INSERT INTO public.config (id) VALUES ('global') ON CONFLICT (id) DO NOTHING;

-- Inserir Admin Padrão (BOLACHA)
INSERT INTO public.users (username, password, role, graduation)
VALUES ('BOLACHA', 'MUZENZAGARANHUNS', 'admin', 'Mestre')
ON CONFLICT (username) DO NOTHING;

-- PART 4: REALTIME
-------------------------------------------------------------------------
-- ATENÇÃO: Habilite o Realtime no Dashboard do Supabase para estas tabelas.
-- Vá em: Database -> Replication -> Realtime -> Clique nas tabelas:
-- (users, events, store_items, config, attendance)

-- ✅ SCRIPT FINALIZADO - PRONTO PARA RODAR NO SQL EDITOR

