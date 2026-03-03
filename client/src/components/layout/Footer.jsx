"use client";
import React from 'react';
import Link from 'next/link';
import { Twitter, Github, Linkedin, Instagram } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="py-20 bg-background border-t border-white/5">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/" className="flex items-center gap-3 mb-6">
                            <img src="/logo.png" alt="Promptova AI Logo" className="w-10 h-10 rounded-lg shadow-lg" />
                            <span className="text-xl font-bold">Promptova AI</span>
                        </Link>
                        <p className="text-gray-400 mb-6">
                            The world&apos;s most advanced AI content platform for professional creators.
                        </p>
                        <div className="flex gap-4">
                            <Twitter className="w-6 h-6 text-gray-500 hover:text-white cursor-pointer transition-colors" />
                            <Github className="w-6 h-6 text-gray-500 hover:text-white cursor-pointer transition-colors" />
                            <Linkedin className="w-6 h-6 text-gray-500 hover:text-white cursor-pointer transition-colors" />
                            <Instagram className="w-6 h-6 text-gray-500 hover:text-white cursor-pointer transition-colors" />
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold mb-6">Tools</h4>
                        <ul className="space-y-4 text-gray-400">
                            <li><Link href="/dashboard/chat" className="hover:text-white transition-colors">AI Image Generator</Link></li>
                            <li><Link href="/dashboard/emoji" className="hover:text-white transition-colors">AI Emoji Gen</Link></li>
                            <li><Link href="/dashboard/resume" className="hover:text-white transition-colors">Resume AI</Link></li>
                            <li><Link href="/dashboard/story" className="hover:text-white transition-colors">Story Generator</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold mb-6 text-white uppercase tracking-widest text-xs">Company</h4>
                        <ul className="space-y-4 text-gray-400 text-sm">
                            <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                            <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                            <li className="pt-2 border-t border-white/5">
                                <p className="text-[10px] text-gray-500 uppercase mb-1">Email</p>
                                <a href="mailto:muhammadansariahmad323@gmail.com" className="text-white hover:text-primary transition-colors block truncate">muhammadansariahmad323@gmail.com</a>
                            </li>
                            <li>
                                <p className="text-[10px] text-gray-500 uppercase mb-1">Phone</p>
                                <a href="tel:03252207294" className="text-white hover:text-primary transition-colors block">03252207294</a>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold mb-6">Legal</h4>
                        <ul className="space-y-4 text-gray-400">
                            <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                            <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5 text-center text-gray-500 text-sm">
                    © 2026 Promptova AI. All rights reserved. Precision in Every Prompt.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
