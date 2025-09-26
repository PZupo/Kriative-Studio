import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { User } from '../types';
import type { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    updateUser: (updates: Partial<User>) => void;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isSupabaseConfigured) {
            setLoading(false);
            return;
        }

        const fetchUserProfile = async (supabaseUser: SupabaseUser | null) => {
            if (!supabaseUser) {
                setUser(null);
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', supabaseUser.id)
                    .single();
                
                if (error && error.code === 'PGRST116') { // "PGRST116" means no rows found
                     console.log('No profile found for user, creating one.');
                     const newUser: User = {
                         uid: supabaseUser.id,
                         email: supabaseUser.email || '',
                         name: supabaseUser.user_metadata?.name || 'Novo Usuário',
                         plan: 'pro',
                         credits: 100, // Starting credits for pro plan
                         mangaGenerations: 0,
                     };
                     const { error: insertError } = await supabase.from('profiles').insert({
                         id: newUser.uid,
                         email: newUser.email,
                         name: newUser.name,
                         plan: newUser.plan,
                         credits: newUser.credits,
                     });
                     if (insertError) throw insertError;
                     setUser(newUser);
                } else if (error) {
                    throw error;
                } else if (data) {
                    setUser({
                        uid: data.id,
                        name: data.name,
                        email: data.email,
                        plan: data.plan,
                        credits: data.credits,
                        mangaGenerations: data.manga_generations || 0,
                    });
                }
            } catch (error) {
                console.error('Error fetching or creating user profile:', error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            await fetchUserProfile(session?.user ?? null);
        };
        
        getSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event: AuthChangeEvent, session: Session | null) => {
                await fetchUserProfile(session?.user ?? null);
            }
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const updateUser = async (updates: Partial<User>) => {
        if (!user) return;
        
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    name: updatedUser.name,
                    plan: updatedUser.plan,
                    credits: updatedUser.credits,
                    manga_generations: updatedUser.mangaGenerations,
                 })
                .eq('id', user.uid);
            if (error) throw error;
        } catch (error) {
            console.error('Error updating profile:', error);
            // Optionally revert state
            setUser(user);
        }
    };

    const logout = async () => {
        if (!isSupabaseConfigured) return;
        await supabase.auth.signOut();
        setUser(null);
    };

    const value = {
        user,
        updateUser,
        logout,
    };

    // Prevent rendering children until auth state is determined
    if (loading) {
        return null;
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
