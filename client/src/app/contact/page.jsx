"use client";
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

export default function ContactPage() {
    return (
        <main className="min-h-screen bg-background text-white">
            <Navbar />

            <div className="container mx-auto px-6 pt-32 pb-20">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16"
                    >
                        <h1 className="text-4xl md:text-6xl font-bold mb-6">Get in <span className="text-gradient">Touch</span></h1>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Have questions or want to collaborate? Reach out to us anytime.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Contact Info */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-8"
                        >
                            <div className="glass p-8 rounded-3xl border border-white/5 space-y-6">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                                        <Mail className="w-7 h-7 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400 mb-1">Email Us</p>
                                        <a href="mailto:muhammadansariahmad323@gmail.com" className="text-xl font-bold hover:text-blue-400 transition-colors">
                                            muhammadansariahmad323@gmail.com
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center">
                                        <Phone className="w-7 h-7 text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400 mb-1">Call Us</p>
                                        <a href="tel:03252207294" className="text-xl font-bold hover:text-purple-400 transition-colors">
                                            03252207294
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-pink-500/10 rounded-2xl flex items-center justify-center">
                                        <MapPin className="w-7 h-7 text-pink-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400 mb-1">Location</p>
                                        <p className="text-xl font-bold">Karachi, Pakistan</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/5">
                                <h3 className="text-2xl font-bold mb-4">Support 24/7</h3>
                                <p className="text-gray-400 italic font-medium leading-relaxed">
                                    "We're here to help you unlock the power of AI. Our dedicated support team responds to all inquiries within 24 hours."
                                </p>
                            </div>
                        </motion.div>

                        {/* Contact Form */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="glass p-10 rounded-[2.5rem] border border-white/10"
                        >
                            <form className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300 ml-1">Full Name</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:border-primary/50 outline-none transition-all"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300 ml-1">Email Address</label>
                                        <input
                                            type="email"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:border-primary/50 outline-none transition-all"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300 ml-1">Subject</label>
                                    <input
                                        type="text"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:border-primary/50 outline-none transition-all"
                                        placeholder="How can we help?"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300 ml-1">Message</label>
                                    <textarea
                                        rows="4"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:border-primary/50 outline-none transition-all resize-none"
                                        placeholder="Your message here..."
                                    ></textarea>
                                </div>
                                <button className="w-full bg-white text-black font-bold py-5 rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-3 shadow-xl">
                                    Send Message
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
