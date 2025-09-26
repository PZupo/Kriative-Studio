import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import type { User, PlanKey } from '../types';
import { PLAN_CONFIGS } from '../constants';

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string, plan: PlanKey) => Promise<void>;
    logout: () => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    const fetchUserProfile = useCallback(async (userId: string, email?: string): Promise<User | null> => {
        if (!isSupabaseConfigured) return null;
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('uid', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            console.error('Error fetching profile:', error);
            return null;
        }
        if (data) {
            return data as User;
        }
        // If profile doesn't exist, it might be a new sign-up
        if (email) {
            return {
                uid: userId,
                email,
                name: email.split('@')[0], // Default name
                plan: 'pro', // Default plan
                credits: PLAN_CONFIGS.pro.credits,
                mangaGenerations: 0,
            };
        }
        return null;
    }, []);

    useEffect(() => {
        if (!isSupabaseConfigured) return;

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                const profile = await fetchUserProfile(session.user.id, session.user.email);
                setUser(profile);
            } else {
                setUser(null);
            }
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, [fetchUserProfile]);

    const login = async (email: string, password: string) => {
        if (!isSupabaseConfigured) throw new Error("Supabase not configured");
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    };
    
    const loginWithGoogle = async () => {
        if (!isSupabaseConfigured) throw new Error("Supabase not configured");
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
            },
        });
        if (error) throw error;
    };

    const signup = async (name: string, email: string, password: string, plan: PlanKey) => {
        if (!isSupabaseConfigured) throw new Error("Supabase not configured");
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: name,
                },
            },
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Signup successful but no user data returned.");
        
        const planConfig = PLAN_CONFIGS[plan];
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                uid: authData.user.id,
                name,
                email,
                plan,
                credits: planConfig.credits,
                mangaGenerations: 0,
            });

        if (profileError) {
             console.error("Error creating profile:", profileError);
             // Potentially delete the auth user if profile creation fails to allow retry
             throw new Error("Could not create user profile.");
        }
    };

    const logout = async () => {
        if (!isSupabaseConfigured) return;
        await supabase.auth.signOut();
        setUser(null);
    };

    const updateUser = (updates: Partial<User>) => {
        if (user) {
            const updatedUser = { ...user, ...updates };
            setUser(updatedUser);
            // Optionally, persist to Supabase here if needed
            // e.g., supabase.from('profiles').update(updates).eq('uid', user.uid)
        }
    };

    const value = { user, login, signup, logout, loginWithGoogle, updateUser };

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
