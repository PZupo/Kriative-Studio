import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL_PLACEHOLDER = 'URL_DO_SEU_PROJETO_SUPABASE_AQUI';
const SUPABASE_KEY_PLACEHOLDER = 'SUA_CHAVE_PUBLICA_ANON_AQUI';

// IMPORTANT: The user must replace these placeholder values.
const SUPABASE_URL: string = 'COLE_SUA_URL_AQUI';
const SUPABASE_ANON_KEY: string = 'COLE_SUA_CHAVE_ANON_AQUI';


export const missingConfig: ('URL' | 'KEY')[] = [];

if (!SUPABASE_URL || SUPABASE_URL === SUPABASE_URL_PLACEHOLDER) {
    missingConfig.push('URL');
}
if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === SUPABASE_KEY_PLACEHOLDER) {
    missingConfig.push('KEY');
}

export const isSupabaseConfigured = missingConfig.length === 0;

let supabase: any = null;

if (isSupabaseConfigured) {
    try {
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (error) {
        console.error("Supabase client initialization failed:", error);
        missingConfig.push('URL'); 
    }
}

export { supabase };
