import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import type { User } from '../types';
import { PLAN_CONFIGS } from '../constants';

type PlanKey = keyof typeof PLAN_CONFIGS;

interface AuthContextType {
    user: User | null;
    login: (name: string, email: string, plan: PlanKey) => void;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
    switchPlan: (newPlan: PlanKey) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    const login = (name: string, email: string, plan: PlanKey) => {
        const planConfig = PLAN_CONFIGS[plan];
        const newUser: User = {
            uid: `user_${Date.now()}`,
            name,
            email,
            plan: plan,
            credits: planConfig.credits,
            mangaGenerations: 999, // Manga is now paid with credits
        };
        setUser(newUser);
    };

    const logout = () => {
        setUser(null);
    };
    
    const updateUser = (updates: Partial<User>) => {
        if (user) {
            setUser(prevUser => ({ ...prevUser!, ...updates }));
        }
    };

    const switchPlan = (newPlan: PlanKey) => {
        if(user) {
            const planConfig = PLAN_CONFIGS[newPlan];
            // In a real app, this would involve a billing process.
            // Here, we just update the user's state.
            setUser(prevUser => ({
                ...prevUser!,
                plan: newPlan,
                credits: planConfig.credits, // Reset credits on plan change
            }));
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser, switchPlan }}>
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
