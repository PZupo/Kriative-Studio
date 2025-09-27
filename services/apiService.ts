// FIX: Replaced placeholder content with a mock implementation of ApiService to resolve compilation errors.
import { PlanKey } from '../types';
import { supabase } from './supabaseClient';

/**
 * API service to interact with Supabase Edge Functions.
 */
class ApiService {
  /**
   * Calls a Supabase Edge Function to create a Stripe checkout session.
   * @param plan - The key of the plan being purchased.
   * @returns A promise that resolves to an object with the checkout URL from Stripe.
   */
  async createCheckoutSession(plan: PlanKey): Promise<{ url: string }> {
    if (!supabase) {
      throw new Error("Supabase client not initialized.");
    }

    const { data, error } = await supabase.functions.invoke('stripe-checkout', {
      body: { planKey: plan },
    });

    if (error) {
      console.error("Error creating checkout session:", error.message);
      throw new Error(`Falha ao criar sessão de pagamento: ${error.message}`);
    }
    
    if (!data.url) {
      console.error("No URL returned from checkout function:", data);
       throw new Error("A função de checkout não retornou uma URL válida.");
    }
    
    return { url: data.url };
  }
}

export const apiService = new ApiService();
