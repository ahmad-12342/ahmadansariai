"use client";
import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ImageIcon, Sparkles, FileText, BookOpen, ChevronRight } from 'lucide-react';

const features = [
    {
        title: "Image Gen",
        description: "Create stunning AI images with our premium Neural Vision engine.",
        icon: ImageIcon,
        color: "bg-blue-500/10 text-blue-500",
        href: "/dashboard/chat"
    },
    {
        title: "Emoji Gen",
        description: "Turn any idea into a custom emoji for your apps and social media.",
        icon: Sparkles,
        color: "bg-yellow-500/10 text-yellow-500",
        href: "/dashboard/emoji"
    },
    {
        title: "Resume AI",
        description: "Analyze and optimize your CV with professional AI-driven insights.",
        icon: FileText,
        color: "bg-purple-500/10 text-purple-500",
        href: "/dashboard/resume"
    },
    {
        title: "Story Gen",
        description: "Generate magical children's stories with unique AI storytelling.",
        icon: BookOpen,
        color: "bg-pink-500/10 text-pink-500",
        href: "/dashboard/story"
    },
];

const Features = () => {
    return (
        <section id="features" className="py-24 bg-background relative overflow-hidden text-white">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">Your AI Creative Studio</h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Explore all the powerful AI creative tools available in your dashboard, now freely accessible for everyone.
                    </p>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    {features.map((feature, idx) => (
                        <Link key={idx} href={feature.href}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                whileHover={{
                                    y: -10,
                                    borderColor: "rgba(255,255,255,0.2)",
                                    transition: { duration: 0.3 }
                                }}
                                className="p-8 rounded-[2.5rem] glass border border-white/5 hover:bg-white/5 transition-all group h-full flex flex-col items-center text-center"
                            >
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${feature.color} group-hover:scale-110 transition-transform duration-500`}>
                                    <feature.icon className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">{feature.title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed mb-6 flex-1">{feature.description}</p>
                                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                    Launch Tool <ChevronRight className="w-4 h-4" />
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default Features;
