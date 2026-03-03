"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Menu, X, Sun, Moon, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenu, setMobileMenu] = useState(false);
    const { user, logout } = useAuth();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? 'py-4 glass border-b border-white/10' : 'py-6 bg-transparent'
            }`}>
            <div className="container mx-auto px-6 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
                        <Sparkles className="text-white w-6 h-6" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight">Promptova<span className="text-primary italic">AI</span></span>
                </Link>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-8 mt-1">
                    {['Features', 'FAQ'].map((link) => (
                        <Link key={link} href={`/#${link.toLowerCase()}`} className="text-gray-400 hover:text-white transition-colors font-medium">
                            {link}
                        </Link>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full border-2 border-primary object-cover" />
                            <button onClick={logout} className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full font-bold bg-white/10 hover:bg-white/20 text-white transition-all text-sm">
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    ) : (
                        <>
                            <Link href="/login" className="hidden md:block font-medium text-gray-400 hover:text-white">
                                Login
                            </Link>
                            <Link href="/signup">
                                <button className="px-6 py-2 rounded-full font-bold bg-primary hover:bg-primary/80 text-white shadow-lg transition-all">
                                    Sign Up
                                </button>
                            </Link>
                        </>
                    )}

                    <button
                        className="md:hidden text-white"
                        onClick={() => setMobileMenu(!mobileMenu)}
                    >
                        {mobileMenu ? <X /> : <Menu />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenu && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-0 w-full glass border-b border-white/10 p-6 flex flex-col gap-4 md:hidden"
                >
                    {['Features', 'FAQ'].map((link) => (
                        <Link key={link} href={`/#${link.toLowerCase()}`} onClick={() => setMobileMenu(false)} className="text-lg font-medium">
                            {link}
                        </Link>
                    ))}
                    {user ? (
                        <>
                            <button onClick={() => { logout(); setMobileMenu(false); }} className="text-lg font-medium text-left flex items-center gap-2 text-red-400">
                                <LogOut className="w-5 h-5" /> Logout
                            </button>
                        </>
                    ) : (
                        <Link href="/login" onClick={() => setMobileMenu(false)} className="text-lg font-medium">Login</Link>
                    )}
                </motion.div>
            )}
        </nav>
    );
};

export default Navbar;
