"use client";
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { motion } from 'framer-motion';

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-background text-white">
            <Navbar />

            <div className="container mx-auto px-6 pt-32 pb-20">
                <div className="max-w-4xl mx-auto space-y-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                    >
                        <h1 className="text-4xl md:text-6xl font-bold mb-8">About <span className="text-gradient">Promptova AI</span></h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                            Empowering creativity through the world's most accessible artificial intelligence tools.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="prose prose-invert max-w-none space-y-8 text-gray-300"
                    >
                        <section>
                            <h2 className="text-3xl font-bold text-white mb-6 underline decoration-primary decoration-4 underline-offset-8">Our Mission</h2>
                            <p>
                                At Promptova AI, we believe that advanced technology should be available to everyone. Our mission is to break down the barriers between human imagination and digital creation by providing powerful AI tools at zero cost.
                            </p>
                        </section>

                        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8">
                            <div className="space-y-4 p-8 glass rounded-3xl border border-white/5">
                                <h3 className="text-2xl font-bold text-white">Why Promptova?</h3>
                                <p>We are the first platform to offer high-end AI generation—ranging from professional images and emojis to career optimization tools—without subscription fees or credit limits.</p>
                            </div>
                            <div className="space-y-4 p-8 glass rounded-3xl border border-white/5 border-l-4 border-l-primary">
                                <h3 className="text-2xl font-bold text-white">Our Technology</h3>
                                <p>Utilizing state-of-the-art models from OpenAI, PicoApps, and custom-trained engines, we deliver professional-grade results in seconds.</p>
                            </div>
                        </section>

                        <section className="pt-8">
                            <h2 className="text-3xl font-bold text-white mb-6">Built for Success</h2>
                            <p>Whether you're an artist, a professional looking to optimize their career, or a creator looking for unique emojis, Promptova AI is designed to be your ultimate creative companion.</p>
                        </section>
                    </motion.div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
