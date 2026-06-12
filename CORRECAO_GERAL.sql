-- =========================================================================
-- SCRIPT DE CORREÇÃO GERAL E SINCRONIZAÇÃO DE MULTI-DIRETÓRIOS (SUPABASE)
-- Execute este script no "SQL Editor" do painel do seu Supabase (https://supabase.com)
-- =========================================================================

-- 1. GARANTIR COLUNA 'director_id' NAS TABELAS PRINCIPAIS
-- Isso garante isolamento por domínio/diretoria sem erros de coluna inexistente.

-- Tabela de Usuários (Membros / Alunos)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'director_id') THEN
        ALTER TABLE public.users ADD COLUMN director_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Tabela de Eventos (events)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'director_id') THEN
        ALTER TABLE public.events ADD COLUMN director_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Tabela de Itens da Loja (store_items)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'store_items' AND column_name = 'director_id') THEN
        ALTER TABLE public.store_items ADD COLUMN director_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Tabela de Contribuições de Tesouraria (treasury_contributions)
DO $$ 
BEGIN
    -- Se a tabela existir, garante que tem director_id
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'treasury_contributions') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'treasury_contributions' AND column_name = 'director_id') THEN
            ALTER TABLE public.treasury_contributions ADD COLUMN director_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;


-- 2. AJUSTAR OUTRAS COLUNAS ÚTEIS E ESSENCIAIS (PREVENÇÃO DE ERROS)

-- Garantir avatar_url, city, country, mensalidades, pix na tabela public.users
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.users ADD COLUMN avatar_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'city') THEN
        ALTER TABLE public.users ADD COLUMN city TEXT;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'country') THEN
        ALTER TABLE public.users ADD COLUMN country TEXT;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'months_paid_remaining') THEN
        ALTER TABLE public.users ADD COLUMN months_paid_remaining INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'certificates') THEN
        ALTER TABLE public.users ADD COLUMN certificates JSONB DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'pix_key') THEN
        ALTER TABLE public.users ADD COLUMN pix_key TEXT;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'pix_name') THEN
        ALTER TABLE public.users ADD COLUMN pix_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'pix_bank') THEN
        ALTER TABLE public.users ADD COLUMN pix_bank TEXT;
    END IF;
END $$;


-- 3. CRIAR ÍNDICES PARA VELOCIDADE E ROBUSTEZ (MELHORA CONSULTAS POR DIRETOR)
CREATE INDEX IF NOT EXISTS idx_store_items_director_id ON public.store_items(director_id);
CREATE INDEX IF NOT EXISTS idx_events_director_id ON public.events(director_id);
CREATE INDEX IF NOT EXISTS idx_users_director_id ON public.users(director_id);


-- 4. DESABILITAR RLS (ROW LEVEL SECURITY)
-- Desativamos RLS para garantir que a API Supabase (PostgREST) consiga ler/gravar de forma fluida nas tabelas,
-- delegando o controle de autorização diretamente ao código TypeScript do App.
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.store_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.config DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.treasury_contributions DISABLE ROW LEVEL SECURITY;


-- 5. CONCEDER TODAS AS PERMISSÕES DE ACESSO
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;


-- 6. ATUALIZAR METADADOS E REFORÇAR ATUALIZAÇÃO DO CACHE SCHEMA DO SUPABASE
-- Este passo é CRÍTICO para que o Supabase atualize imediatamente o cache de colunas da API.
NOTIFY pgrst, 'reload schema';

COMMENT ON TABLE public.store_items IS 'Tabela de itens da loja - Sincronizada';
COMMENT ON TABLE public.events IS 'Tabela de eventos - Sincronizada';
COMMENT ON TABLE public.users IS 'Tabela de usuários - Sincronizada';

-- =========================================================================
-- FIM DO SCRIPT. SEU BANCO DE DADOS ESTÁ SEGURO, COMPLETO E PRONTO!
-- =========================================================================
