import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { User, PlanKey } from '../types';
import { PLAN_CONFIGS } from '../constants';
import { useNotification } from './NotificationContext';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ error: Error | null }>;
    signup: (name: string, email: string, password: string, plan: PlanKey) => Promise<{ error: Error | null }>;
    logout: () => Promise<void>;
    updateUser: (updates: Partial<User>) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to map Supabase user to our app's User type
const userFromSupabase = (supabaseUser: SupabaseUser | null): User | null => {
    if (!supabaseUser) return null;
    return {
        uid: supabaseUser.id,
        name: supabaseUser.user_metadata.full_name || 'Usuário',
        email: supabaseUser.email!,
        plan: supabaseUser.user_metadata.plan || 'pro',
        credits: supabaseUser.user_metadata.credits || 0,
        mangaGenerations: supabaseUser.user_metadata.manga_generations || 0,
    };
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const { showToast } = useNotification();
    
    useEffect(() => {
        // CRITICAL FIX: If Supabase is not configured, do not attempt to use it.
        // This prevents a crash on startup when env vars are missing.
        if (!isSupabaseConfigured) {
            setLoading(false);
            return;
        }

        const getSession = async () => {
            const { data: { session } } = await supabase!.auth.getSession();
            setSession(session);
            setUser(userFromSupabase(session?.user ?? null));
            setLoading(false);
        };
        getSession();

        const { data: authListener } = supabase!.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            setUser(userFromSupabase(session?.user ?? null));
        });

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, []);

    const login = async (email: string, password: string) => {
        if (!isSupabaseConfigured) return { error: new Error("Supabase não configurado.") };
        const { error } = await supabase!.auth.signInWithPassword({ email, password });
        return { error: error ? new Error(error.message) : null };
    };

    const signup = async (name: string, email: string, password: string, plan: PlanKey) => {
        if (!isSupabaseConfigured) return { error: new Error("Supabase não configurado.") };
        const { error } = await supabase!.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                    plan: plan,
                    credits: PLAN_CONFIGS[plan].credits,
                    manga_generations: 0,
                },
            },
        });
        return { error: error ? new Error(error.message) : null };
    };

    const logout = async () => {
        if (!isSupabaseConfigured) return;
        await supabase!.auth.signOut();
    };

    const loginWithGoogle = async () => {
        if (!isSupabaseConfigured) return;
        await supabase!.auth.signInWithOAuth({
            provider: 'google',
        });
    };

    const updateUser = async (updates: Partial<User>) => {
        if (!user || !isSupabaseConfigured) return;
    
        const previousUser = { ...user };
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser); // Optimistic update

        const { data, error } = await supabase!.auth.updateUser({
            data: {
                full_name: updatedUser.name,
                plan: updatedUser.plan,
                credits: updatedUser.credits,
                manga_generations: updatedUser.mangaGenerations,
            }
        });

        if (error) {
            showToast(`Erro ao atualizar perfil: ${error.message}`, 'error');
            setUser(previousUser); // Revert on failure
        } else if (data.user) {
            // The auth listener will eventually update state, but this ensures immediate consistency.
            setUser(userFromSupabase(data.user));
        }
    };
    
    const value = {
        session,
        user,
        loading,
        login,
        signup,
        logout,
        updateUser,
        loginWithGoogle,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};