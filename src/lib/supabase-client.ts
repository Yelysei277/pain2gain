import { createClient } from '@supabase/supabase-js';
import type { Database } from './db-types';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let supabase: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  if (!supabase) {
    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
  }

  return supabase;
}

export function isSupabaseAvailable(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}