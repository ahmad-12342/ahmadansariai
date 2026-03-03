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
    BookOpen,
    Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
    { icon: MessageSquare, label: 'Image Gen', href: '/dashboard/chat' },
    { icon: Sparkles, label: 'Emoji Gen', href: '/dashboard/emoji' },
    { icon: FileText, label: 'Resume Analyzer', href: '/dashboard/resume' },
    { icon: BookOpen, label: 'Story Generator', href: '/dashboard/story' },
];

const secondaryItems = [
    { icon: User, label: 'Profile', href: '/dashboard/profile' },
];

const Sidebar = () => {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    return (
        <aside className="w-64 h-screen glass border-r border-white/10 flex flex-col p-6 print:hidden">
            <Link href="/" className="flex items-center gap-3 mb-10 pl-2">
                <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg shadow-lg" />
                <span className="text-xl font-bold">Promptova AI</span>
            </Link>

            <div className="flex-1 flex flex-col gap-8 overflow-y-auto pr-2 custom-scrollbar">
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

                {user?.uid === 'O65GfNGOoFO0JfS8UCvW4wbyPmn2' && (
                    <div>
                        <p className="text-xs font-bold text-red-500/80 uppercase tracking-widest mb-4 pl-2">Restricted</p>
                        <Link
                            href="/admin"
                            className={cn(
                                "flex items-center gap-3 p-3 rounded-xl transition-all border border-red-500/10 hover:bg-red-500/10 hover:text-red-400 text-red-500/80",
                                pathname === '/admin' && "bg-red-500/20 text-red-400 border-red-500/30"
                            )}
                        >
                            <Shield className="w-5 h-5" />
                            <span className="font-medium">Admin Panel</span>
                        </Link>
                    </div>
                )}
            </div>

            <button
                onClick={logout}
                className="flex items-center gap-3 p-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all mt-auto mb-4"
            >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
            </button>
        </aside>
    );
};

export default Sidebar;
