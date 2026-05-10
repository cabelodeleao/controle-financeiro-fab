import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || supabaseUrl.includes('SEU-PROJETO')) {
  console.warn('Supabase não configurado. Preencha o arquivo .env.local com suas credenciais.');
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '');
