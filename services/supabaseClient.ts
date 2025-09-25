// @ts-nocheck
// This file uses the global `supabase` object from the CDN script in index.html

// Placeholders for the check
const SUPABASE_URL_PLACEHOLDER = 'URL_DO_SEU_PROJETO_SUPABASE_AQUI';
const SUPABASE_KEY_PLACEHOLDER = 'SUA_CHAVE_PUBLICA_ANON_AQUI';

// --- AÇÃO NECESSÁRIA ---
// Cole suas chaves do Supabase aqui!
const SUPABASE_URL = 'https://jianwjozpgpmezhewcff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppYW53am96cGdwbWV6aGV3Y2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MzIzOTYsImV4cCI6MjA3NDQwODM5Nn0.cA9zY_ecPe_OOY97a2we97uFobzV7Zjv3lyw65fUOyI';
// --- Fim da Ação Necessária ---


// Check which parts of the configuration are missing
export const missingConfig: ('URL' | 'KEY')[] = [];
if (!SUPABASE_URL || SUPABASE_URL === SUPABASE_URL_PLACEHOLDER) {
    missingConfig.push('URL');
}
if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === SUPABASE_KEY_PLACEHOLDER) {
    missingConfig.push('KEY');
}

export const isSupabaseConfigured = missingConfig.length === 0;

let supabase = null;

// Initialize the client only if both keys are provided
if (isSupabaseConfigured) {
    try {
        // We use window.supabase which comes from the CDN script
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (error) {
        console.error("Supabase client initialization failed:", error);
    }
}

// Export the client and the configuration status
export { supabase };
