// FIX: Replaced placeholder content with a full implementation of the ApiService to resolve 'not a module' errors across the application.
import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { User, PlanKey } from '../types';
import { PLAN_CONFIGS } from '../constants';

class ApiService {

    // --- SESSION & AUTH ---

    async getSession() {
        if (isSupabaseConfigured) {
            const { data, error } = await supabase.auth.getSession();
            if (error) throw error;
            return data.session;
        } else {
            // Simulate session from localStorage
            const userJson = localStorage.getItem('simulated_user');
            if (userJson) {
                const user = JSON.parse(userJson);
                return { user: { id: user.uid, email: user.email } };
            }
            return null;
        }
    }

    async getUserProfile(uid: string): Promise<User> {
        if (isSupabaseConfigured) {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', uid)
                .single();
            if (error) throw new Error("Could not fetch user profile.");
            return data as User;
        } else {
            // Simulate profile from localStorage
            const userJson = localStorage.getItem('simulated_user');
            if (userJson) {
                const user = JSON.parse(userJson);
                if (user.uid === uid) return user;
            }
            throw new Error("Simulated user profile not found.");
        }
    }

    async login(email: string, password: string): Promise<User> {
        if (isSupabaseConfigured) {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            if (!data.user) throw new Error("Login failed, no user returned.");
            return this.getUserProfile(data.user.id);
        } else {
            // Simulate login
            console.log(`Simulating login for ${email}`);
             const userJson = localStorage.getItem('simulated_user');
             if (userJson) {
                 const storedUser = JSON.parse(userJson);
                 if (storedUser.email === email) {
                     return storedUser;
                 }
             }
            throw new Error("Simulated login failed: User not found or incorrect password.");
        }
    }

    async signup(name: string, email: string, password: string, plan: PlanKey): Promise<User> {
        if (isSupabaseConfigured) {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: name,
                        plan: plan,
                        credits: PLAN_CONFIGS[plan].credits,
                    },
                },
            });
            if (error) throw error;
            if (!data.user) throw new Error("Signup failed, no user returned.");
            // We can't fetch profile right away as it's created by a trigger, but for the app flow, we can return the shape
            return {
                uid: data.user.id,
                name,
                email,
                plan,
                credits: PLAN_CONFIGS[plan].credits,
                mangaGenerations: 0,
            };
        } else {
            // Simulate signup
            console.log(`Simulating signup for ${email} on plan ${plan}`);
            const newUser: User = {
                uid: `sim_${Date.now()}`,
                name,
                email,
                plan,
                credits: PLAN_CONFIGS[plan].credits,
                mangaGenerations: 0
            };
            localStorage.setItem('simulated_user', JSON.stringify(newUser));
            return newUser;
        }
    }

    async loginWithGoogle(): Promise<User | null> {
        if (isSupabaseConfigured) {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
            });
            if (error) throw error;
            // Supabase handles redirect, so we won't get a user back directly here.
            // The AuthProvider's useEffect will catch the session on redirect.
            return null;
        } else {
            // Simulate Google Login
            alert("Google Login is not available in simulation mode. Signing up with a default user.");
            return this.signup('Google User', 'google@example.com', 'password', 'pro');
        }
    }

    async logout(): Promise<void> {
        if (isSupabaseConfigured) {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        } else {
            // Simulate logout
            localStorage.removeItem('simulated_user');
        }
    }

    async updateUserProfile(uid: string, updates: Partial<User>): Promise<void> {
        if (isSupabaseConfigured) {
            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', uid);
            if (error) throw error;
        } else {
            // Simulate update
            const userJson = localStorage.getItem('simulated_user');
            if (userJson) {
                const user = JSON.parse(userJson);
                const updatedUser = { ...user, ...updates };
                localStorage.setItem('simulated_user', JSON.stringify(updatedUser));
            }
        }
    }

    // --- STRIPE / CHECKOUT ---

    async createCheckoutSession(planKey: PlanKey, userId: string): Promise<{ url: string }> {
         if (isSupabaseConfigured) {
            // This would typically call a Supabase Edge Function to create a Stripe Checkout session.
            // const { data, error } = await supabase.functions.invoke('stripe-checkout', {
            //     body: { planKey, userId },
            // });
            // if (error) throw error;
            // return data;
            console.warn("Stripe checkout is not implemented. Returning a placeholder URL.");
         }
         // In simulation mode or as a fallback
         return { url: `https://example.com/checkout?plan=${planKey}&user=${userId}` };
    }
}

export const apiService = new ApiService();
