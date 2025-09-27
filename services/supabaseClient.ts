import { createClient, SupabaseClient } from '@supabase/supabase-js';

// @ts-ignore
const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL;
// @ts-ignore
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

let supabase: SupabaseClient | null = null;

if (isSupabaseConfigured) {
    try {
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (error) {
        console.error("Falha na inicialização do cliente Supabase:", error);
    }
}

export { supabase };