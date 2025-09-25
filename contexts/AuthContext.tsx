import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import type { User, PlanKey } from '../types';
import { apiService } from '../services/apiService';

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

    useEffect(() => {
        const checkSession = async () => {
            try {
                const session = await apiService.getSession();
                if (session?.user) {
                    const profile = await apiService.getUserProfile(session.user.id);
                    setUser(profile);
                }
            } catch (error) {
                console.error("Error checking session:", error);
                // If the session is invalid, ensure user is logged out
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        checkSession();
    }, []);

    const login = async (email: string, password: string) => {
        const profile = await apiService.login(email, password);
        setUser(profile);
    };

    const signup = async (name: string, email: string, password: string, plan: PlanKey) => {
        const profile = await apiService.signup(name, email, password, plan);
        setUser(profile);
    };
    
    const loginWithGoogle = async () => {
        await apiService.loginWithGoogle();
        // Supabase redirects, session is caught by useEffect on return
    };

    const logout = async () => {
        await apiService.logout();
        setUser(null);
    };

    const updateUser = (updates: Partial<User>) => {
        if (user) {
            const updatedUser = { ...user, ...updates };
            setUser(updatedUser);
            // Persist changes to backend asynchronously
            apiService.updateUserProfile(user.uid, updates).catch(error => {
                 console.error("Failed to update user profile on backend:", error);
                 // Optionally revert state or show an error notification to the user
            });
        }
    };

    const value = {
        user,
        isLoading,
        login,
        signup,
        loginWithGoogle,
        logout,
        updateUser,
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-[#f5f5dc] flex items-center justify-center">
                <i className="fa-solid fa-spinner fa-spin text-4xl text-[#008080]"></i>
            </div>
        );
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
