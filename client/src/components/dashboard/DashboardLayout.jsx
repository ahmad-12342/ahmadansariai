"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';
import { Loader2 } from 'lucide-react';

const DashboardLayout = ({ children }) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Wait for Firebase auth to initialize, then check login status
        if (!loading && !user) {
            router.replace('/signup');
        }
    }, [user, loading, router]);

    // Full screen spinner while Firebase checks auth
    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Loader2 className="w-7 h-7 text-primary animate-spin" />
                    </div>
                    <p className="text-gray-400 text-sm font-medium">Checking your session...</p>
                </div>
            </div>
        );
    }

    // Not logged in — show nothing while redirecting to /signup
    if (!user) {
        return null;
    }

    // Logged in — show dashboard
    return (
        <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-8 print:p-0 no-scrollbar">
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
