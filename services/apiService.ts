import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { User, PlanKey } from '../types';
import { PLAN_CONFIGS } from '../constants';

// No Supabase, o UID do usuário vem de `data.user.id`.
// Nós vamos criar uma tabela 'profiles' para armazenar dados adicionais (plano, créditos, etc).

class ApiService {
    
    // --- AUTH FUNCTIONS ---

    async login(email: string, password: string): Promise<any> {
        if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data.user;
    }

    async signup(name: string, email: string, password: string, plan: PlanKey): Promise<any> {
        if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
        // Primeiro, registra o usuário no sistema de autenticação do Supabase
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                // 'data' é usado para armazenar metadados que não são de perfil, como o nome.
                data: {
                    name: name
                }
            }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("O registro não retornou um usuário.");

        // Depois, cria um perfil para esse usuário na nossa tabela 'profiles'
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: authData.user.id, // Vincula o perfil ao usuário autenticado
                name: name,
                email: email,
                plan: plan,
                credits: PLAN_CONFIGS[plan].credits,
            });

        if (profileError) {
            // Se a criação do perfil falhar, idealmente deveríamos deletar o usuário criado.
            // Por simplicidade, vamos apenas lançar o erro.
            console.error("Erro ao criar perfil:", profileError);
            throw profileError;
        }

        return authData.user;
    }

    async loginWithGoogle() {
        if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
        });
        if(error) throw error;
        return data;
    }

    async logout(): Promise<void> {
        if (!isSupabaseConfigured) return;
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    }

    async getSession() {
        if (!isSupabaseConfigured) return null;
        const { data, error } = await supabase.auth.getSession();
        if(error) throw error;
        return data.session;
    }
    
    // --- PROFILE/USER DATA FUNCTIONS ---

    async getUserProfile(userId: string): Promise<User | null> {
        if (!isSupabaseConfigured) return null;
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single(); // .single() pega um único registro ou retorna null, e lança erro se houver mais de um.

        if (error && error.code !== 'PGRST116') { // PGRST116 = "The result contains 0 rows"
            console.error("Erro ao buscar perfil:", error);
            throw error;
        }
        
        if (!data) return null;

        // Mapeia o resultado do DB para nosso tipo 'User'
        return {
            uid: data.id,
            name: data.name,
            email: data.email,
            plan: data.plan,
            credits: data.credits,
            mangaGenerations: data.manga_generations || 0,
        };
    }
    
    async updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
         if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
         const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            console.error("Erro ao atualizar perfil:", error);
            throw error;
        }

        return {
             uid: data.id,
             name: data.name,
             email: data.email,
             plan: data.plan,
             credits: data.credits,
             mangaGenerations: data.manga_generations || 0,
        };
    }

    // --- STRIPE/PAYMENT FUNCTIONS (FUTURE) ---

    async createCheckoutSession(planId: string, userId: string): Promise<{ url: string }> {
        // NO FUTURO: Aqui você chamaria uma Edge Function do Supabase.
        // const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        //     body: { planId, userId },
        // });
        // if(error) throw error;
        // return data;

        console.log(`Simulando checkout para o plano ${planId} e usuário ${userId}`);
        alert("O fluxo de pagamento real seria iniciado aqui, redirecionando para o Stripe.");
        return { url: window.location.href };
    }
}

export const apiService = new ApiService();
