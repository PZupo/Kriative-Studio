// supabase/functions/stripe-checkout/index.ts
// FIX: The previous Deno types reference from unpkg was failing. Switched to esm.sh which is a more stable CDN for Deno types and resolves the "Cannot find name 'Deno'" errors.
/// <reference types="https://esm.sh/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.20.0';
import { corsHeaders } from '../_shared/cors.ts';

// WARNING: Avoid hardcoding plan details. In a production environment,
// these should be stored in your database or a secure config file.
const PLAN_PRICE_IDS = {
  pro: 'price_YOUR_PRO_PLAN_PRICE_ID', // Replace with your actual Price ID from Stripe
  studio: 'price_YOUR_STUDIO_PLAN_PRICE_ID', // Replace with your actual Price ID from Stripe
  associado: 'price_YOUR_ASSOCIADO_PLAN_PRICE_ID', // Replace with your actual Price ID from Stripe
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { planKey } = await req.json();

    if (!planKey || !(planKey in PLAN_PRICE_IDS)) {
      throw new Error('Plano inválido fornecido.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser();

    if (userError || !user) {
      throw new Error('Usuário não autenticado.');
    }

    const priceId = PLAN_PRICE_IDS[planKey as keyof typeof PLAN_PRICE_IDS];
    const appUrl = Deno.env.get('VITE_APP_URL') || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${appUrl}/checkout/success`,
      cancel_url: `${appUrl}/`,
      customer_email: user.email,
      metadata: {
        planKey: planKey,
        userId: user.id,
      },
    });

    return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});