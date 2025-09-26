import { PlanKey } from '../types';

class ApiService {
  /**
   * Simulates creating a Stripe checkout session.
   * In a real application, this would make a request to a secure backend endpoint.
   * The backend would then use the Stripe SDK to create a session and return the URL.
   */
  async createCheckoutSession(planKey: PlanKey, userId: string): Promise<{ url: string }> {
    console.log(`Simulating checkout session creation for plan "${planKey}" and user "${userId}".`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // In a real app, you would not expose plan details on the client.
    // This would be handled by your backend.
    const mockCheckoutUrls: Record<PlanKey, string> = {
      pro: 'https://buy.stripe.com/test_mock_pro_session',
      studio: 'https://buy.stripe.com/test_mock_studio_session',
      associado: 'https://buy.stripe.com/test_mock_associado_session'
    };
    
    return {
      url: mockCheckoutUrls[planKey] || 'https://buy.stripe.com/test_mock_default_session'
    };
  }
}

export const apiService = new ApiService();
