import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
    try {
        const { plan, billingCycle, userId, userEmail } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Logic to determine Price ID based on Plan Name and Billing Cycle
        // TODO: Replace these with your real Stripe Price IDs after creating products in dashboard
        let priceId = '';

        if (plan.name === 'Pro') {
            priceId = billingCycle === 'monthly' ? 'price_pro_monthly_placeholder' : 'price_pro_yearly_placeholder';
        } else if (plan.name === 'Elite') {
            priceId = billingCycle === 'monthly' ? 'price_elite_monthly_placeholder' : 'price_elite_yearly_placeholder';
        } else if (plan.name === 'Starter') {
            return NextResponse.json({ error: 'Starter plan is free' }, { status: 400 });
        }

        // In a real scenario, you'd use the mapping from your Stripe Dashboard
        // For testing, if the user hasn't created the IDs yet, this will fail at Stripe level
        // But the code structure is now ready.

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `${plan.name} AI Plan (${billingCycle})`,
                            description: `AI Credits and Premium Features for ${plan.name} Plan`,
                        },
                        unit_amount: (billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice) * 100, // in cents
                        recurring: {
                            interval: billingCycle === 'monthly' ? 'month' : 'year',
                        },
                    },
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/#pricing`,
            metadata: {
                userId: userId,
                planName: plan.name.toLowerCase(),
                billingCycle: billingCycle,
            },
            customer_email: userEmail,
        });

        return NextResponse.json({ id: session.id, url: session.url });
    } catch (error) {
        console.error('Stripe Checkout Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
