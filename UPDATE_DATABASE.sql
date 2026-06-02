-- SCRIPT DE ATUALIZAÇÃO DO BANCO DE DADOS
-- Execute este script no SQL Editor do Supabase para corrigir colunas faltantes.

-- 1. ADICIONAR avatar_url NA TABELA DE USUÁRIOS SE NÃO EXISTIR
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.users ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- 2. GARANTIR QUE A TABELA config TEM AS COLUNAS DE PIX
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'config' AND column_name = 'pix_key') THEN
        ALTER TABLE public.config ADD COLUMN pix_key TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'config' AND column_name = 'pix_name') THEN
        ALTER TABLE public.config ADD COLUMN pix_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'config' AND column_name = 'pix_bank') THEN
        ALTER TABLE public.config ADD COLUMN pix_bank TEXT;
    END IF;
END $$;

-- 3. GARANTIR QUE A LINHA 'global' EXISTE NA TABELA config
INSERT INTO public.config (id) VALUES ('global') ON CONFLICT (id) DO NOTHING;

-- 4. DESABILITAR RLS (RECOMENDADO PARA EVITAR ERROS DE PERMISSÃO EM DESENVOLVIMENTO)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.config DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS store_items DISABLE ROW LEVEL SECURITY;

-- 5. GARANTIR PERMISSÕES
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 6. CRIAR TABELA DE CONTRIBUIÇÕES DE TESOURARIA
CREATE TABLE IF NOT EXISTS public.treasury_contributions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    contributor_name TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending', -- 'pending' (pendente), 'approved' (aprovado), 'rejected' (rejeitado)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar acesso livre para desenvolvimento (RLS desligado se aplicável)
ALTER TABLE IF EXISTS public.treasury_contributions DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.treasury_contributions TO postgres, anon, authenticated, service_role;

-- 7. ADICIONAR COLUNAS PARA MULTI-GESTÃO (DIRETORIA, CIDADE, PAÍS)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS director_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pix_key TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pix_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pix_bank TEXT;

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS director_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.treasury_contributions ADD COLUMN IF NOT EXISTS director_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- 8. CRIAR COLUNA DE CERTIFICADOS PARA DIRETORES
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS certificates JSONB DEFAULT '[]'::jsonb;

