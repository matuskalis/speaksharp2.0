import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tier, userId, userEmail } = body;

    if (!tier || !userId || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
    if (!STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY);

    // Define price IDs for each tier (these would be created in Stripe Dashboard)
    // For MVP, we'll create prices on the fly or use test price IDs
    const prices: { [key: string]: { amount: number; name: string } } = {
      'Learner': { amount: 1999, name: 'Phonetix Learner' }, // $19.99
      'Professional': { amount: 4999, name: 'Phonetix Professional' } // $49.99
    };

    if (!prices[tier]) {
      return NextResponse.json(
        { error: 'Invalid tier' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: prices[tier].name,
              description: `${tier} tier subscription for Phonetix pronunciation training`,
            },
            unit_amount: prices[tier].amount,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      customer_email: userEmail,
      metadata: {
        userId,
        tier,
      },
      success_url: `${request.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
