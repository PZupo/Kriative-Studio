import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import type { User, PlanKey } from '../types';
import { apiService } from '../services/apiService';
import { useNotification } from './NotificationContext';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isConfigurationMissing: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string, plan: PlanKey) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isConfigurationMissing] = useState(!isSupabaseConfigured);
    const { showToast } = useNotification();

    const fetchUserProfile = useCallback(async (userId: string) => {
        try {
            const profile = await apiService.getUserProfile(userId);
            setUser(profile);
            return profile;
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
            setUser(null);
            return null;
        }
    }, []);

    useEffect(() => {
        if (isConfigurationMissing) {
            setIsLoading(false);
            return; // Impede a execução se o Supabase não estiver configurado
        }

        const checkSession = async () => {
            try {
                const session = await apiService.getSession();
                if (session?.user) {
                    await fetchUserProfile(session.user.id);
                }
            } catch (error) {
                console.error("Error checking initial session:", error);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        
        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                setIsLoading(true);
                try {
                    if (session?.user) {
                        await fetchUserProfile(session.user.id);
                    } else {
                        setUser(null);
                    }
                } catch (error) {
                    console.error("Error on auth state change:", error);
                    setUser(null);
                } finally {
                    setIsLoading(false);
                }
            }
        );

        return () => {
            subscription?.unsubscribe();
        };
    }, [fetchUserProfile, isConfigurationMissing]);

    const login = async (email: string, password: string) => {
        if (isConfigurationMissing) throw new Error("Backend not configured.");
        await apiService.login(email, password);
    };

    const signup = async (name: string, email: string, password: string, plan: PlanKey) => {
        if (isConfigurationMissing) throw new Error("Backend not configured.");
        await apiService.signup(name, email, password, plan);
    };
    
    const loginWithGoogle = async () => {
        if (isConfigurationMissing) throw new Error("Backend not configured.");
        await apiService.loginWithGoogle();
    };

    const logout = async () => {
        if (isConfigurationMissing) return;
        try {
            await apiService.logout();
            setUser(null);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Erro ao fazer logout.";
            showToast(errorMessage, 'error');
        }
    };

    const updateUser = useCallback((updates: Partial<User>) => {
        if (user && !isConfigurationMissing) {
            const updatedUser = { ...user, ...updates };
            setUser(updatedUser);
            apiService.updateUserProfile(user.uid, updates).catch(err => {
                 console.error("Failed to update user profile on backend", err);
                 showToast("Falha ao salvar as alterações no servidor.", "error");
            });
        }
    }, [user, showToast, isConfigurationMissing]);

    const value = {
        user,
        isLoading,
        isConfigurationMissing,
        login,
        signup,
        loginWithGoogle,
        logout,
        updateUser,
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
