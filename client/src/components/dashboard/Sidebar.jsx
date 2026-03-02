"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ImageIcon,
    Video,
    FileText,
    Sparkles,
    User,
    CreditCard,
    LogOut,
    ChevronRight,
    MessageSquare,
    BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
    { icon: MessageSquare, label: 'AI Chat', href: '/dashboard/chat' },
    { icon: ImageIcon, label: 'Image Gen', href: '/dashboard/images' },
    { icon: FileText, label: 'Resume Analyzer', href: '/dashboard/resume' },
    { icon: BookOpen, label: 'Story Generator', href: '/dashboard/story' },
];

const secondaryItems = [
    { icon: CreditCard, label: 'Pricing', href: '/#pricing' },
    { icon: User, label: 'Profile', href: '/dashboard/profile' },
];

const Sidebar = () => {
    const pathname = usePathname();

    return (
        <aside className="w-64 h-screen glass border-r border-white/10 flex flex-col p-6 print:hidden">
            <Link href="/" className="flex items-center gap-2 mb-10 pl-2">
                <Sparkles className="text-primary w-6 h-6" />
                <span className="text-xl font-bold">Promptova</span>
            </Link>

            <div className="flex-1 flex flex-col gap-8">
                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 pl-2">Main Menu</p>
                    <div className="flex flex-col gap-1">
                        {menuItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-xl transition-all group",
                                    pathname === item.href
                                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon className="w-5 h-5" />
                                    <span className="font-medium">{item.label}</span>
                                </div>
                                <ChevronRight className={cn("w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity", pathname === item.href && "opacity-100")} />
                            </Link>
                        ))}
                    </div>
                </div>

                <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 pl-2">Account</p>
                    <div className="flex flex-col gap-1">
                        {secondaryItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl transition-all",
                                    pathname === item.href
                                        ? "bg-white/10 text-white"
                                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            <button className="flex items-center gap-3 p-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all mt-auto mb-4">
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
            </button>

            {/* Credit Status */}
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-4 rounded-2xl border border-white/5">
                <p className="text-xs text-gray-400 mb-1">Available Credits</p>
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-lg font-bold">10 / 100</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                    <div className="w-[10%] h-full bg-primary rounded-full"></div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
