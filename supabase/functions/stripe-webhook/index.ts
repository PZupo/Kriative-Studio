// supabase/functions/stripe-webhook/index.ts
// FIX: The previous Deno types reference from unpkg was failing. Switched to esm.sh which is a more stable CDN for Deno types and resolves the "Cannot find name 'Deno'" errors.
/// <reference types="https://esm.sh/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.20.0';

// WARNING: In a production app, fetch this from your database
// or a secure config. For simplicity here, we redefine it.
const PLAN_CREDITS = {
  pro: 100,
  studio: 250,
  associado: 600,
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature');
  const body = await req.text();
  
  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
      undefined,
      Stripe.createSubtleCryptoProvider()
    );
  } catch (err) {
    return new Response(err.message, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, planKey } = session.metadata!;
    
    if (!userId || !planKey) {
        console.error("Webhook received without required metadata");
        return new Response('Metadata missing', { status: 400 });
    }
    
    const creditsToAdd = PLAN_CREDITS[planKey as keyof typeof PLAN_CREDITS] || 0;

    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users') // Assuming you have a public users table or are using auth.users
      .select('id, user_metadata')
      .eq('id', userId)
      .single();

    if(fetchError || !user) {
        console.error(`User not found for ID: ${userId}`);
        return new Response('User not found', { status: 404 });
    }
    
    const currentCredits = user.user_metadata?.credits || 0;

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { 
            ...user.user_metadata,
            plan: planKey,
            credits: currentCredits + creditsToAdd 
        },
    });

    if (error) {
        console.error('Failed to update user plan:', error);
        return new Response(error.message, { status: 500 });
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});