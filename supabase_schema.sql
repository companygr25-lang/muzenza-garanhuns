-- ==========================================================
-- LIMPEZA TOTAL E RECRIÇÃO DA ESTRUTURA - MUZENZA
-- ==========================================================

-- 1. Remover tudo para evitar conflitos
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.config CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. Tabela de Usuários (Membros)
CREATE TABLE public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'user', -- 'admin' ou 'user'
  status TEXT DEFAULT 'active',
  graduation TEXT DEFAULT 'Sem Corda',
  monthly_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Eventos
CREATE TABLE public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_time TIME,
  location TEXT,
  type TEXT DEFAULT 'Roda',
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Produtos (Loja)
CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INTEGER DEFAULT 0,
  category TEXT DEFAULT 'Geral',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Presença (Chamada)
CREATE TABLE public.attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  present BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 6. Configuração Global (Pix, Avisos)
CREATE TABLE public.config (
  id TEXT PRIMARY KEY DEFAULT 'global',
  highlighted_event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  pix_key TEXT,
  pix_name TEXT,
  pix_bank TEXT,
  announcement TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Inserir Dados Iniciais
INSERT INTO public.config (id) VALUES ('global') ON CONFLICT (id) DO NOTHING;

-- INSERIR SEU ACESSO MASTER ADM
INSERT INTO public.users (username, password, role, graduation)
VALUES ('BOLACHA', 'MUZENZAGARANHUNS', 'admin', 'Mestre')
ON CONFLICT (username) DO NOTHING;

-- 8. DESABILITAR RLS COMPLETAMENTE (SOLICITAÇÃO DO USUÁRIO)
-- Isso resolve os erros de "violates row-level security policy"
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.config DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance DISABLE ROW LEVEL SECURITY;

-- Garantir acesso ao role anon e authenticated (Supabase internals)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
