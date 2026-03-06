import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
    if (!process.env.STRIPE_SECRET_KEY) {
        return NextResponse.json({ error: 'Webhook not configured.' }, { status: 503 });
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');

    let event;

    try {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
        console.error(`Webhook Signature verification failed: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Handle the event
    try {
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                const { userId, planName, billingCycle } = session.metadata;

                if (userId) {
                    const userRef = doc(db, "users", userId);

                    // Determine credits based on plan
                    let creditAmount = 0;
                    if (planName === 'pro') creditAmount = 500;
                    if (planName === 'elite') creditAmount = 1000;

                    // Update user in Firestore
                    await updateDoc(userRef, {
                        plan: planName,
                        credits: increment(creditAmount), // Add credits to existing ones
                        lastPaymentDate: new Date().toISOString(),
                        subscriptionStatus: 'active'
                    });

                    console.log(`Successfully updated plan for user ${userId} to ${planName}`);
                }
                break;

            case 'customer.subscription.deleted':
                const subscription = event.data.object;
                // You might want to handle subscription cancellation here
                // Find user by stripe customer id and set plan to 'free'
                break;

            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook processing error:', error);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }
}

// Note: rawBody is handled via req.text() above — no deprecated config needed
