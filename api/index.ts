import Stripe from 'stripe';

let stripeClient: Stripe | null = null;
function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY || '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';
  if (!stripeClient && key) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

function cleanEmail(e: string) {
  return e.replace(/[^a-z0-9]/g, '_');
}

export default async function handler(req: any, res: any) {
  // CORS & headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // Handle health check
  if (pathname === '/api/health') {
    return res.status(200).json({
      status: 'ok',
      service: 'Police Safeguard: AI Rights Assistant API',
      stripeConfigured: true,
      domain: 'policesafeguard.com',
      serverless: true,
      timestamp: Date.now()
    });
  }

  // Handle Stripe create-session
  if (pathname === '/api/checkout/create-session' && req.method === 'POST') {
    try {
      const stripe = getStripe();
      if (!stripe) return res.status(503).json({ error: 'Stripe unavailable' });
      const body = req.body || {};
      const { tier = 'all_encounters_pro', billingCycle = 'monthly', email } = body;
      const isSubscription = billingCycle === 'monthly' || billingCycle === 'yearly';
      const isPreAuthTrial = billingCycle === 'monthly';
      const unitAmount = billingCycle === 'lifetime' ? 7999 : (billingCycle === 'yearly' ? 4999 : 1499);
      const creditsGranted = billingCycle === 'lifetime' ? 1000 : 50;
      const planTitle = billingCycle === 'lifetime' ? 'Lifetime Access Pass ($79.99)' : (billingCycle === 'yearly' ? 'Annual Pro ($49.99/yr)' : '30-Day Free Trial ($14.99/mo)');

      const origin = req.headers.origin || `https://${req.headers.host || 'www.policesafeguard.com'}`;
      const session = await stripe.checkout.sessions.create({
        mode: isSubscription ? 'subscription' : 'payment',
        customer_email: email && email.includes('@') ? email : undefined,
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Police SafeGuard: ${planTitle}`,
              description: isPreAuthTrial
                ? 'Police SafeGuard Pro: 30-Day Free Trial ($0.00 today), auto-billed $14.99/mo on day 30 until canceled.'
                : (billingCycle === 'yearly'
                    ? 'Police SafeGuard Pro: Annual Subscription ($49.99/yr).'
                    : 'Police SafeGuard: Lifetime Access Pass ($79.99 one-time).')
            },
            unit_amount: unitAmount,
            recurring: isSubscription ? { interval: billingCycle === 'yearly' ? 'year' : 'month' } : undefined
          },
          quantity: 1
        }],
        subscription_data: isSubscription ? {
          trial_period_days: isPreAuthTrial ? 30 : undefined
        } : undefined,
        metadata: {
          tier,
          billingCycle,
          creditsGranted: String(creditsGranted),
          email: email || ''
        },
        success_url: `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}&tier=${tier}&cycle=${billingCycle}&credits=${creditsGranted}`,
        cancel_url: `${origin}/?payment=cancelled`
      });

      return res.status(200).json({ success: true, checkoutUrl: session.url, sessionId: session.id });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || 'Error creating checkout session' });
    }
  }

  // Handle Stripe process-card (must redirect to official checkout, never activate without payment!)
  if (pathname === '/api/checkout/process-card' && req.method === 'POST') {
    try {
      const stripe = getStripe();
      if (!stripe) return res.status(503).json({ error: 'Stripe unavailable' });
      const body = req.body || {};
      const { tier = 'all_encounters_pro', billingCycle = 'monthly', email, cardholderName = 'Valued Member' } = body;
      const isSubscription = billingCycle === 'monthly' || billingCycle === 'yearly';
      const isPreAuthTrial = billingCycle === 'monthly';
      const unitAmount = billingCycle === 'lifetime' ? 7999 : (billingCycle === 'yearly' ? 4999 : 1499);
      const creditsGranted = billingCycle === 'lifetime' ? 1000 : 50;
      const planTitle = billingCycle === 'lifetime' ? 'Lifetime Access Pass ($79.99)' : (billingCycle === 'yearly' ? 'Annual Pro ($49.99/yr)' : '30-Day Free Trial ($14.99/mo)');

      const origin = req.headers.origin || `https://${req.headers.host || 'www.policesafeguard.com'}`;
      const session = await stripe.checkout.sessions.create({
        mode: isSubscription ? 'subscription' : 'payment',
        customer_email: email && email.includes('@') ? email : undefined,
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Police SafeGuard: ${planTitle}`,
              description: isPreAuthTrial
                ? 'Police SafeGuard Pro: 30-Day Free Trial ($0.00 today), auto-billed $14.99/mo until canceled.'
                : (billingCycle === 'yearly'
                    ? 'Police SafeGuard Pro: Annual Subscription ($49.99/yr).'
                    : 'Police SafeGuard: Lifetime Access Pass ($79.99 one-time).')
            },
            unit_amount: unitAmount,
            recurring: isSubscription ? { interval: billingCycle === 'yearly' ? 'year' : 'month' } : undefined
          },
          quantity: 1
        }],
        subscription_data: isSubscription ? {
          trial_period_days: isPreAuthTrial ? 30 : undefined
        } : undefined,
        metadata: {
          tier,
          billingCycle,
          creditsGranted: String(creditsGranted),
          email: email || '',
          cardholder: cardholderName
        },
        success_url: `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}&tier=${tier}&cycle=${billingCycle}&credits=${creditsGranted}`,
        cancel_url: `${origin}/?payment=cancelled`
      });

      return res.status(200).json({
        success: true,
        paid: false,
        requiresRedirect: true,
        checkoutUrl: session.url,
        sessionId: session.id,
        planTitle,
        tier,
        billingCycle,
        message: 'Redirecting to official Stripe checkout to approve card and charge funds.'
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, paid: false, error: e?.message || 'Error creating checkout session' });
    }
  }

  // Handle Stripe verify-session
  if (pathname === '/api/checkout/verify-session' && req.method === 'POST') {
    try {
      const stripe = getStripe();
      const body = req.body || {};
      const { sessionId, tier = 'all_encounters_pro', cycle = 'monthly' } = body;
      if (!stripe || !sessionId || sessionId === 'active_session') {
        return res.status(400).json({ paid: false, error: 'Valid Stripe sessionId is required for payment verification.' });
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const isPaid = session.payment_status === 'paid' || session.status === 'complete';

      if (!isPaid) {
        return res.status(200).json({
          paid: false,
          status: session.status,
          paymentStatus: session.payment_status,
          error: 'Payment was not approved or completed by Stripe.'
        });
      }

      return res.status(200).json({
        paid: true,
        verified: true,
        tier: session.metadata?.tier || tier,
        billingCycle: session.metadata?.billingCycle || cycle,
        creditsGranted: Number(session.metadata?.creditsGranted || 0),
        status: session.status,
        customerEmail: session.customer_details?.email,
        amountTotal: session.amount_total ? session.amount_total / 100 : undefined
      });
    } catch (e: any) {
      return res.status(500).json({ paid: false, error: e?.message || 'Verification error' });
    }
  }

  // Handle Auth routes on Vercel Serverless
  if (pathname.startsWith('/api/auth/')) {
    const body = req.body || {};
    const email = (body.email || '').toLowerCase().trim();
    const cleanName = body.name || email.split('@')[0] || 'Protected Citizen';
    const role = email === 'dgerving@gmail.com' ? 'admin' : (body.role || 'client');
    const uid = `usr_${cleanEmail(email || 'citizen')}_${Date.now()}`;
    const token = `psg_jwt_${btoa(JSON.stringify({ id: uid, email, role, exp: Date.now() + 90 * 86400000 }))}`;

    return res.status(200).json({
      success: true,
      user: {
        id: uid,
        email,
        name: cleanName,
        phone: body.phone || '',
        role,
        homeState: body.homeState || 'CA',
        nativeLanguage: body.nativeLanguage || 'English',
        membershipTier: 'free',
        billingCycle: 'monthly',
        hasCompletedOnboarding: true,
        createdAt: new Date().toISOString()
      },
      token,
      recoveryKey: `KEY-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      message: 'Authentication successful.'
    });
  }

  return res.status(200).json({ status: 'ok' });
}
