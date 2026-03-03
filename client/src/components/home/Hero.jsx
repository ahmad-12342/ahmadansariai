"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Image as ImageIcon, Video, FileText } from 'lucide-react';
import Link from 'next/link';

const Hero = () => {
    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-mesh">
            {/* Animated background elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <motion.div
                    animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl will-change-transform opacity-60"
                />
                <motion.div
                    animate={{ x: [0, -40, 0], y: [0, 60, 0] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl will-change-transform opacity-60"
                />
            </div>

            <div className="container mx-auto px-6 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                        duration: 1.2,
                        ease: [0.22, 1, 0.36, 1]
                    }}
                >
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/20 text-sm font-medium mb-6">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-gradient">The Future of AI Content Generation</span>
                    </span>

                    <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-tight tracking-tight">
                        Create <span className="text-gradient">Anything</span> <br />
                        with Promptova AI
                    </h1>

                    <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Generate stunning images, professional CVs, and magical stories with our
                        completely <span className="text-primary font-bold">Free & Unlimited</span> AI Studio.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Link href="/dashboard">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.98 }}
                                className="px-8 py-4 rounded-full font-bold bg-white text-black hover:bg-gray-200 transition-colors flex items-center gap-2 group shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                            >
                                Get Started Free
                                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                            </motion.button>
                        </Link>
                        <Link href="/#features">
                            <motion.button
                                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }}
                                whileTap={{ scale: 0.98 }}
                                className="px-8 py-4 rounded-full font-bold glass text-white transition-all"
                            >
                                Explore Tools
                            </motion.button>
                        </Link>
                    </div>
                </motion.div>

                {/* Feature Cards Floating */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.5, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20"
                >
                    {[
                        { icon: ImageIcon, label: "Image Gen", color: "text-blue-400", href: "/dashboard/chat" },
                        { icon: Sparkles, label: "Emoji Gen", color: "text-yellow-400", href: "/dashboard/emoji" },
                        { icon: FileText, label: "Resume AI", color: "text-purple-400", href: "/dashboard/resume" },
                        { icon: BookOpen, label: "Story Gen", color: "text-pink-400", href: "/dashboard/story" },
                    ].map((item, idx) => (
                        <Link key={idx} href={item.href}>
                            <motion.div
                                whileHover={{ y: -12, scale: 1.05, borderColor: "rgba(255,255,255,0.2)" }}
                                animate={{ y: [0, -5, 0] }}
                                transition={{
                                    y: { duration: 4 + idx, repeat: Infinity, ease: "easeInOut", delay: idx * 0.2 }
                                }}
                                className="glass p-6 rounded-2xl border border-white/5 cursor-pointer group transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]"
                            >
                                <item.icon className={`w-10 h-10 ${item.color} mb-4 group-hover:scale-110 transition-transform duration-500`} />
                                <p className="font-semibold text-lg text-white">{item.label}</p>
                            </motion.div>
                        </Link>
                    ))}
                </motion.div>
            </div>

        </div>
    );
};

export default Hero;
