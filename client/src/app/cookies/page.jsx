"use client";
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { motion } from 'framer-motion';

export default function CookiePolicy() {
    return (
        <main className="min-h-screen bg-background text-white">
            <Navbar />

            <div className="container mx-auto px-6 pt-32 pb-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto"
                >
                    <h1 className="text-4xl md:text-6xl font-bold mb-8">Cookie <span className="text-gradient">Policy</span></h1>

                    <div className="prose prose-invert max-w-none space-y-8 text-gray-300">
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">1. What are Cookies?</h2>
                            <p>Cookies are small text files stored on your device that help us provide a better experience on our platform.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">2. Essential Cookies</h2>
                            <p>We use essential cookies to manage user logins and handle session data during your time on the site.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">3. Performance Cookies</h2>
                            <p>These cookies help us understand how users interact with our site, identifying any site performance issues or areas for improvement.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">4. Persistent & Session Cookies</h2>
                            <p>We use both session-based and persistent cookies to ensure a consistent user experience across multiple visits.</p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">5. Managing Cookies</h2>
                            <p>You can manage or disable cookies through your browser settings, though some site functions may be affected.</p>
                        </section>

                        <p className="text-sm text-gray-500 mt-12">Last Updated: March 2026</p>
                    </div>
                </motion.div>
            </div>

            <Footer />
        </main>
    );
}
