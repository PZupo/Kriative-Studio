import { PlanKey } from '../types';

/**
 * MOCK API service to simulate backend interactions.
 * In a real application, this would make HTTP requests to a backend server.
 */
class ApiService {
  /**
   * Simulates creating a Stripe checkout session for development and testing.
   * NOTE: This is a mock implementation and does not process real payments.
   * @param plan - The key of the plan being purchased.
   * @returns A promise that resolves to an object with a simulated checkout URL.
   */
  async createCheckoutSession(plan: PlanKey): Promise<{ url: string }> {
    console.log(`Simulating checkout session creation for plan ${plan}.`);
    // Simulate a network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // In a real app, this would be a URL from Stripe.
    // Here, we simulate a success redirect URL with params for testing purposes.
    const sessionId = `sim_${Date.now()}`;
    const redirectUrl = `/checkout/success?plan=${plan}&session_id=${sessionId}`;
    
    console.log(`Simulated redirect to checkout: ${redirectUrl}`);
    return { url: redirectUrl };
  }
}

export const apiService = new ApiService();