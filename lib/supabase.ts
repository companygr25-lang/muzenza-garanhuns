import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Inicializa o cliente apenas se as credenciais estiverem presentes para evitar erros fatais no boot.
// Caso contrário, retorna um Proxy que lança um erro explicativo ao ser acessado.
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : new Proxy({} as any, {
      get: () => {
        throw new Error('As credenciais do Supabase (URL e Anon Key) estão ausentes. Por favor, configure-as no painel de Segredos (Secrets).');
      }
    });
