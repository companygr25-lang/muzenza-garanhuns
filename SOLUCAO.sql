-- EXECUTE ESTE SCRIPT NO "SQL EDITOR" DO SEU PAINEL SUPABASE
-- Link para o painel: https://supabase.com
--
-- Isso adicionará a coluna 'months_paid_remaining' na tabela 'users' de forma segura.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS months_paid_remaining INTEGER DEFAULT 0;

-- Certifique-se também de desabilitar RLS ou garantir que as permissões estejam corretas:
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.users TO postgres, anon, authenticated, service_role;
