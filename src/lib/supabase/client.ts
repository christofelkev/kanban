import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    !supabaseUrl.includes('your-project') &&
    supabaseAnonKey &&
    !supabaseAnonKey.includes('your-supabase-anon-key')
);

// Fallback safe placeholder during initial setup to prevent 500 crash
const safeUrl = isSupabaseConfigured ? supabaseUrl : 'https://setup-required.supabase.co';
const safeKey = isSupabaseConfigured
  ? supabaseAnonKey
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummy-token-for-initial-setup';

export const supabase = createBrowserClient<Database>(safeUrl, safeKey);
