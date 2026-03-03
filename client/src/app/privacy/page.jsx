"use client";
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { motion } from 'framer-motion';

export default function PrivacyPolicy() {
    return (
        <main className="min-h-screen bg-background text-white">
            <Navbar />

            <div className="container mx-auto px-6 pt-32 pb-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto"
                >
                    <h1 className="text-4xl md:text-6xl font-bold mb-8">Privacy <span className="text-gradient">Policy</span></h1>

                    <div className="prose prose-invert max-w-none space-y-8 text-gray-300">
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">1. Data Collection</h2>
                            <p>We collect basic information such as your email address for account creation and login purposes. We use Firebase for secure authentication.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">2. Usage of Data</h2>
                            <p>Promptova AI uses your data to provide our AI-driven services, track your usage history for your convenience, and improve our AI models.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">3. Data Sharing</h2>
                            <p>We do not sell or share your personal data with third parties for marketing purposes. Data shared with AI providers (like OpenAI) is limited to the prompts you provide.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">4. Cookies</h2>
                            <p>We use essential cookies to maintain your login session and improve site performance. For more information, please see our Cookie Policy.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">5. Security</h2>
                            <p>We take information security seriously and use industry-standard measures to protect your data from unauthorized access.</p>
                        </section>

                        <p className="text-sm text-gray-500 mt-12">Last Updated: March 2026</p>
                    </div>
                </motion.div>
            </div>

            <Footer />
        </main>
    );
}
