import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import type { User, PlanKey } from '../types';
import { apiService } from '../services/apiService';
import { useNotification } from './NotificationContext';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
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
    const { showToast } = useNotification();

    useEffect(() => {
        const checkSession = async () => {
            try {
                const session = await apiService.getSession();
                if (session?.user) {
                    const profile = await apiService.getUserProfile(session.user.id);
                    setUser(profile);
                }
            } catch (error) {
                console.error("Error checking initial session:", error);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        checkSession();
    }, []);

    const login = async (email: string, password: string) => {
        const loggedInUser = await apiService.login(email, password);
        setUser(loggedInUser);
    };

    const signup = async (name: string, email: string, password: string, plan: PlanKey) => {
        const newUser = await apiService.signup(name, email, password, plan);
        setUser(newUser);
    };
    
    const loginWithGoogle = async () => {
        const googleUser = await apiService.loginWithGoogle();
        setUser(googleUser);
    };

    const logout = async () => {
        try {
            await apiService.logout();
            setUser(null);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Erro ao fazer logout.";
            showToast(errorMessage, 'error');
        }
    };

    const updateUser = useCallback((updates: Partial<User>) => {
        if (user) {
            const updatedUser = { ...user, ...updates };
            setUser(updatedUser);
            apiService.updateUserProfile(user.uid, updates).catch(err => {
                 console.error("Failed to update user profile on backend", err);
                 showToast("Falha ao salvar as alterações no servidor.", "error");
            });
        }
    }, [user, showToast]);

    const value = {
        user,
        isLoading,
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