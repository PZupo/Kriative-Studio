import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { User, PlanKey } from '../types';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { PLAN_CONFIGS } from '../constants';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isConfigurationMissing: boolean;
    initializationError: string | null;
    signup: (name: string, email: string, password: string, plan: PlanKey) => Promise<{ error: any }>;
    login: (email: string, password: string) => Promise<{ error: any }>;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (updates: Partial<User>) => void;
    switchPlan: (planKey: PlanKey) => Promise<{error: any}>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isConfigurationMissing] = useState(!isSupabaseConfigured);
    const [initializationError, setInitializationError] = useState<string | null>(null);

    const getUserProfile = useCallback(async (supabaseUser: SupabaseUser): Promise<User | null> => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', supabaseUser.id)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);
            setInitializationError(`Falha ao buscar perfil de usuário: ${error.message}. Verifique a configuração da sua tabela 'profiles' e as políticas de RLS.`);
            return null;
        }
        
        if (data) {
             return {
                uid: data.id,
                name: data.name, // Corrected from full_name
                email: supabaseUser.email || '',
                plan: data.plan,
                credits: data.credits,
                mangaGenerations: data.manga_generations || 0,
            };
        }
        return null;
    }, []);

    useEffect(() => {
        if (isConfigurationMissing) {
            setIsLoading(false);
            return;
        }

        let isMounted = true;

        const checkSession = async () => {
             try {
                const { data: { session } } = await supabase.auth.getSession();
                if (isMounted && session?.user) {
                    const profile = await getUserProfile(session.user);
                    if(isMounted) setUser(profile);
                }
            } catch (error) {
                if (isMounted) {
                    console.error("Error in checkSession:", error);
                    setInitializationError(error instanceof Error ? error.message : "An unknown error occurred during session check.");
                }
            } finally {
                if(isMounted) setIsLoading(false);
            }
        };

        checkSession();
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: string, session: Session | null) => {
            if (isMounted && session?.user) {
                const profile = await getUserProfile(session.user);
                 if(isMounted) setUser(profile);
            } else if(isMounted) {
                setUser(null);
            }
        });

        return () => {
            isMounted = false;
            subscription?.unsubscribe();
        };
    }, [isConfigurationMissing, getUserProfile]);


    const signup = async (name: string, email: string, password: string, plan: PlanKey) => {
        const planConfig = PLAN_CONFIGS[plan];
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    plan,
                    credits: planConfig.credits
                },
                emailRedirectTo: window.location.origin
            }
        });
        return { error };
    };
    
    const login = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error };
    };

    const loginWithGoogle = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
            },
        });
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    const updateUser = (updates: Partial<User>) => {
        if (user) {
            const updatedUser = { ...user, ...updates };
            setUser(updatedUser);
            supabase.from('profiles').update(updates).eq('id', user.uid).then(({ error }: {error: any}) => {
                if (error) console.error("Failed to update user profile in DB", error);
            });
        }
    };

    const switchPlan = async (planKey: PlanKey) => {
        if (!user) return { error: { message: 'Usuário não autenticado' } };
        
        const newPlanConfig = PLAN_CONFIGS[planKey];
        const updates = {
            plan: planKey,
            credits: user.credits + newPlanConfig.credits // Example: add new credits
        };
        
        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.uid);
            
        if (!error) {
            updateUser(updates);
        }
        return { error };
    };

    const value = {
        user,
        isLoading,
        isConfigurationMissing,
        initializationError,
        signup,
        login,
        loginWithGoogle,
        logout,
        updateUser,
        switchPlan,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
