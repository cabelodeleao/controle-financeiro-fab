import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured =
  !!supabaseUrl &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('SEU-PROJETO') &&
  !!supabaseAnonKey &&
  supabaseAnonKey.length > 20;

// When not configured, use a valid-looking placeholder so createClient doesn't throw.
// The placeholder client is never actually called because all callers check
// isSupabaseConfigured before invoking any Supabase methods.
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl! : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey! : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder',
);
