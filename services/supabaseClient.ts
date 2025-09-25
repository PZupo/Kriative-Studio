// @ts-nocheck
// This file uses the global `supabase` object from the CDN script in index.html

// 1. Crie um projeto em supabase.com
// 2. Vá para "Project Settings" > "API"
// 3. Cole a URL do seu projeto e a chave 'public anon' abaixo.

const SUPABASE_URL = 'URL_DO_SEU_PROJETO_SUPABASE_AQUI'; // Ex: https://xyz.supabase.co
const SUPABASE_ANON_KEY = 'SUA_CHAVE_PUBLICA_ANON_AQUI'; // Ex: eyJhbGciOiJIUzI1NiIsIn...

let supabase = null;
let isSupabaseConfigured = false;

// Apenas inicializa o cliente se as variáveis foram alteradas
if (SUPABASE_URL !== 'URL_DO_SEU_PROJETO_SUPABASE_AQUI' && SUPABASE_ANON_KEY !== 'SUA_CHAVE_PUBLICA_ANON_AQUI') {
    try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        isSupabaseConfigured = true;
    } catch (error) {
        console.error("Erro ao inicializar o cliente Supabase:", error);
        isSupabaseConfigured = false;
    }
}

// Exporta o cliente (que pode ser null) e a flag de configuração
export { supabase, isSupabaseConfigured };
