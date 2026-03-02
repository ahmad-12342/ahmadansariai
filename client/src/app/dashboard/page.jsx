"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, ImageIcon, LayoutDashboard, FileText, BookOpen, Sparkles, TrendingUp, CreditCard, Clock, History, Zap, Loader2, Shield } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const tools = [
    { name: "AI Chat", desc: "General Assistant", icon: MessageSquare, color: "bg-blue-500/10 text-blue-500", href: "/dashboard/chat" },
    { name: "Image Gen", desc: "Dedicated DALL-E 3", icon: ImageIcon, color: "bg-indigo-500/10 text-indigo-500", href: "/dashboard/images" },
    { name: "Resume Analyzer", desc: "AI Review & Insights", icon: FileText, color: "bg-purple-500/10 text-purple-500", href: "/dashboard/resume" },
    { name: "Story Generator", desc: "Children's Book Engine", icon: BookOpen, color: "bg-pink-500/10 text-pink-500", href: "/dashboard/story" },
];

const typeIcon = {
    chat: MessageSquare,
    image: ImageIcon,
    resume: FileText,
    story: BookOpen,
};

const typeLabel = {
    chat: 'AI Chat',
    image: 'Image Gen',
    resume: 'Resume AI',
    story: 'Story Gen',
};

function timeAgo(dateStr) {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export default function DashboardPage() {
    const { user, userStats, recentActivity, loading, statsLoading } = useAuth();

    const stats = [
        {
            label: "Generations",
            value: userStats ? userStats.totalGenerations.toString() : '—',
            icon: Sparkles,
            color: "text-purple-400",
        },
        {
            label: "Credits Left",
            value: userStats ? userStats.credits.toString() : '—',
            icon: CreditCard,
            color: "text-blue-400",
        },
        {
            label: "Storage Used",
            value: userStats ? `${userStats.storageUsed >= 1024 ? (userStats.storageUsed / 1024).toFixed(1) + ' GB' : userStats.storageUsed.toFixed(1) + ' MB'}` : '—',
            icon: TrendingUp,
            color: "text-green-400",
        },
        {
            label: "Time Saved",
            value: userStats ? `${userStats.timeSaved.toFixed(1)}h` : '—',
            icon: Clock,
            color: "text-orange-400",
        },
    ];

    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-3xl font-bold mb-2 text-gradient">
                    Welcome back, {user?.displayName?.split(' ')[0] || 'Creator'}!
                </h1>
                <p className="text-gray-400">Ready to create something amazing today?</p>
            </div>

            {/* AI Tools */}
            <div>
                <h2 className="text-xl font-bold mb-6">Explore Tools</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {tools.map((tool, idx) => (
                        <Link key={idx} href={tool.href}>
                            <motion.div
                                whileHover={{ y: -5, scale: 1.02 }}
                                className="glass p-8 rounded-3xl border border-white/5 hover:border-primary/20 transition-all group cursor-pointer"
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${tool.color} group-hover:scale-110 transition-transform`}>
                                    <tool.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{tool.name}</h3>
                                <p className="text-sm text-gray-400">{tool.desc}</p>
                            </motion.div>
                        </Link>
                    ))}

                    {/* Conditional Admin Card */}
                    {user?.uid === 'O65GfNGOoFO0JfS8UCvW4wbyPmn2' && (
                        <Link href="/admin">
                            <motion.div
                                whileHover={{ y: -5, scale: 1.02 }}
                                className="glass p-8 rounded-3xl border border-red-500/10 hover:border-red-500/30 transition-all group cursor-pointer bg-red-500/5"
                            >
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-red-500/20 text-red-500 group-hover:scale-110 transition-transform">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-2 group-hover:text-red-400 transition-colors">Admin Panel</h3>
                                <p className="text-sm text-gray-400">Platform Management & Stats</p>
                            </motion.div>
                        </Link>
                    )}
                </div>
            </div>

            {/* Live Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <div key={idx} className="glass p-6 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-4 mb-4">
                            <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            <span className="text-sm font-medium text-gray-400">{stat.label}</span>
                        </div>
                        {statsLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                        ) : (
                            <p className="text-2xl font-bold">{stat.value}</p>
                        )}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Visual Creation Gallery (Item 2) */}
                <div>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            <History className="text-primary w-6 h-6" />
                            Generation Gallery
                        </h2>
                        <Link href="/dashboard/history" className="text-primary text-sm font-bold hover:underline">
                            View All Creations
                        </Link>
                    </div>

                    {statsLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="aspect-square glass rounded-2xl animate-pulse bg-white/5 border border-white/5" />
                            ))}
                        </div>
                    ) : recentActivity.length === 0 ? (
                        <div className="glass p-12 rounded-[2.5rem] border border-white/5 text-center">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ImageIcon className="text-gray-600 w-8 h-8" />
                            </div>
                            <p className="text-gray-500 font-medium italic">Your gallery is empty. Start creating to see your work here!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {recentActivity.map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="group relative aspect-square rounded-2xl overflow-hidden glass border border-white/10 hover:border-primary/50 transition-all shadow-xl"
                                >
                                    {item.type === 'image' || item.type === 'video' ? (
                                        <div className="w-full h-full">
                                            {item.type === 'image' ? (
                                                <img src={item.resultUrl} alt="Gen" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                            ) : (
                                                <div className="w-full h-full bg-purple-500/20 flex flex-col items-center justify-center font-bold text-[10px] text-purple-400">
                                                    <Video className="w-6 h-6 mb-1" />
                                                    VIDEO GEN
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all p-4 flex flex-col justify-end">
                                                <p className="text-white text-[10px] font-bold line-clamp-2 mb-1">{item.prompt}</p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">{timeAgo(item.createdAt)}</span>
                                                    <a href={item.resultUrl} target="_blank" className="p-1.5 bg-primary rounded-lg">
                                                        <Zap className="w-3 h-3 text-white fill-current" />
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-white/5 to-transparent">
                                            <div className={`w-8 h-8 rounded-lg mb-2 flex items-center justify-center ${item.type === 'cv' ? 'bg-pink-500/20 text-pink-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                                {item.type === 'cv' ? <FileText className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                                            </div>
                                            <p className="text-[10px] font-bold text-center group-hover:text-primary transition-colors">{item.type.toUpperCase()}</p>
                                            <p className="text-[8px] text-gray-500 mt-2">{timeAgo(item.createdAt)}</p>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Pro Tip */}
                    <div className="glass p-8 rounded-[2.5rem] bg-gradient-to-br from-primary/10 to-transparent border border-white/5 relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 shadow-xl">
                                <Zap className="text-black w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold mb-4">Pro Creator Insight</h2>
                            <p className="text-gray-300 mb-6 leading-relaxed text-sm">
                                Use the 🪄 <strong>Refine Prompt</strong> tool in the generator to automatically turn your ideas into high-quality AI masterpieces.
                                Detailed prompts get 10x better results!
                            </p>
                            <div className="flex items-center gap-3">
                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${userStats?.plan === 'pro' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                    {userStats?.plan === 'pro' ? '⭐ PRO' : 'FREE PLAN'}
                                </div>
                                <span className="text-xs text-gray-500">{userStats?.credits ?? '—'} credits remaining</span>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
                            <Sparkles className="w-32 h-32" />
                        </div>
                    </div>

                    {/* Dashboard Stats (Item 3) */}
                    <div className="glass p-8 rounded-[2.5rem] border border-white/5">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" /> Performance Analytics
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            {stats.map((stat, idx) => (
                                <div key={idx} className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
                                    <div className="flex items-center justify-between">
                                        <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                                        <stat.icon className={`w-4 h-4 opacity-50 ${stat.color}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
