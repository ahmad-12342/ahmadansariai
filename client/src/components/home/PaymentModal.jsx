"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, ShieldCheck, Zap, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const PaymentModal = ({ isOpen, onClose, plan, billingCycle }) => {
    const { user, refreshStats } = useAuth();
    const [step, setStep] = useState('details');
    const [loading, setLoading] = useState(false);

    if (!plan) return null;

    const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
    const total = billingCycle === 'monthly' ? price : parseInt(price) * 12;

    const handlePayment = async (e) => {
        e.preventDefault();
        setLoading(true);

        // If it's a free plan, handle it immediately
        if (total === 0) {
            try {
                if (user) {
                    const userRef = doc(db, "users", user.uid);
                    await updateDoc(userRef, {
                        plan: plan.name.toLowerCase(),
                        credits: 10,
                    });
                    await refreshStats();
                }
                setStep('success');
            } catch (err) {
                console.error("Free Plan activation failed:", err);
                alert("Plan activation failed. Please try again.");
            } finally {
                setLoading(false);
            }
            return;
        }

        // --- Real Stripe Checkout ---
        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan,
                    billingCycle,
                    userId: user?.uid,
                    userEmail: user?.email
                }),
            });

            const session = await response.json();

            if (session.url) {
                // Redirect user to Stripe Checkout
                window.location.href = session.url;
            } else {
                throw new Error(session.error || 'Failed to create checkout session');
            }
        } catch (err) {
            console.error("Checkout failed:", err);
            alert("Checkout Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-[#0a0a0b] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
                    >
                        {step === 'details' ? (
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                                            <CreditCard className="w-5 h-5 text-primary" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-white">Secure Checkout</h2>
                                    </div>
                                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                        <X className="w-5 h-5 text-gray-400" />
                                    </button>
                                </div>

                                {/* Order Summary */}
                                <div className="bg-white/5 border border-white/5 rounded-2xl p-6 mb-8">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Plan</p>
                                            <h3 className="text-xl font-bold flex items-center gap-2">
                                                {plan.name} <Sparkles className="w-4 h-4 text-primary" />
                                            </h3>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total</p>
                                            <p className="text-2xl font-black text-white">${total}</p>
                                            <p className="text-[10px] text-gray-500">{billingCycle === 'monthly' ? 'Billed monthly' : `Billed yearly ($${price}/mo)`}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {total > 0 ? (
                                        <div className="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-4">
                                            <div className="flex items-center gap-3 text-sm text-gray-400">
                                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                Unlimited AI Generations
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-gray-400">
                                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                Priority Support & High Speed
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-[10px] text-gray-500">
                                                <ShieldCheck className="w-4 h-4 text-green-500" />
                                                <span>Securely encrypted payment via Stripe</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-6 bg-white/5 border border-white/5 rounded-2xl text-center space-y-3">
                                            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                                                <CheckCircle2 className="w-6 h-6 text-green-500" />
                                            </div>
                                            <p className="text-sm text-gray-400">No payment required for this plan. Just click below to activate your starter pack!</p>
                                        </div>
                                    )}

                                    <button
                                        onClick={handlePayment}
                                        disabled={loading}
                                        className="w-full py-5 rounded-full bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/25 flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                {total > 0 ? 'Redirecting to Stripe...' : 'Activating...'}
                                            </>
                                        ) : (
                                            <>
                                                {total > 0 ? <Zap className="w-5 h-5 fill-current" /> : <Sparkles className="w-5 h-5" />}
                                                {total > 0 ? `Checkout $${total}` : 'Activate Free Plan'}
                                            </>
                                        )}
                                    </button>

                                    {total > 0 && (
                                        <p className="text-center text-[10px] text-gray-600 uppercase tracking-widest font-bold">
                                            Powered by Stripe • Worldwide Secured
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="p-12 text-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8"
                                >
                                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                                </motion.div>
                                <h2 className="text-3xl font-bold mb-4">Payment Confirmed!</h2>
                                <p className="text-gray-400 mb-8 leading-relaxed">
                                    {user
                                        ? `Welcome to the ${plan.name} plan. Your account has been updated with new credits and features.`
                                        : `Your payment for ${plan.name} was successful! Now, please create an account to activate your plan.`
                                    }
                                </p>
                                <button
                                    onClick={() => {
                                        if (user) {
                                            onClose();
                                        } else {
                                            window.location.href = "/signup";
                                        }
                                    }}
                                    className="w-full py-4 rounded-full bg-white text-black font-bold hover:bg-gray-200 transition-all shadow-lg"
                                >
                                    {user ? 'Start Creating' : 'Sign Up to Claim'}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default PaymentModal;
