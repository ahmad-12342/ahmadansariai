"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, User as UserIcon, Briefcase, GraduationCap, Code, Plus, Trash2, Edit3, Eye } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { saveGeneration, checkDailyLimit } from '@/lib/firestoreService';

const CVGenerator = () => {
    const { user, refreshStats } = useAuth();
    const [activeTab, setActiveTab] = useState('summary');
    const [isPreview, setIsPreview] = useState(false);
    const [data, setData] = useState({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1 234 567 890',
        summary: 'Experienced full-stack developer with a passion for AI...',
        experience: [{ company: 'Tech Corp', role: 'Senior Lead', duration: '2020 - Present' }],
        skills: ['React', 'Node.js', 'Python', 'AI Integration'],
        education: [{ school: 'University of AI', degree: 'MS in Computer Science' }]
    });

    const handleExportPDF = async () => {
        // ✅ Check Daily Limits for Free Plan
        if (user) {
            const limitCheck = await checkDailyLimit(user.uid, 'cv');
            if (!limitCheck.allowed) {
                alert(limitCheck.message);
                return;
            }
        }

        window.print();

        // ✅ Save to Firestore + refresh dashboard stats
        if (user) {
            await saveGeneration({
                uid: user.uid,
                type: 'cv',
                prompt: `Resume for ${data.name}`,
                metadata: { template: 'pro' },
                creditCost: 3,
                storageMB: 1,
                timeSavedHrs: 3,
            });
            refreshStats(); // Update dashboard stats live
        }
    };

    return (
        <div className="space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                        <FileText className="text-pink-500" />
                        Pro CV Builder
                    </h1>
                    <p className="text-gray-400">Build an ATS-optimized professional resume in minutes.</p>
                </div>
                <div className="flex gap-4 print:hidden">
                    <button
                        onClick={() => setIsPreview(!isPreview)}
                        className="px-6 py-2 rounded-xl glass border border-white/10 hover:bg-white/5 transition-all flex items-center gap-2"
                    >
                        {isPreview ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {isPreview ? 'Edit Mode' : 'Preview Result'}
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="px-6 py-2 rounded-xl bg-primary hover:bg-primary/80 text-white transition-all flex items-center gap-2 shadow-lg"
                    >
                        <Download className="w-4 h-4" />
                        Export PDF
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Editor Sections */}
                {!isPreview ? (
                    <>
                        <div className="lg:col-span-3 space-y-2">
                            {[
                                { id: 'summary', icon: UserIcon, label: 'Summary' },
                                { id: 'experience', icon: Briefcase, label: 'Experience' },
                                { id: 'education', icon: GraduationCap, label: 'Education' },
                                { id: 'skills', icon: Code, label: 'Skills' },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full p-4 rounded-xl flex items-center gap-3 transition-all ${activeTab === item.id
                                        ? 'bg-primary text-white shadow-lg'
                                        : 'glass text-gray-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="font-medium">{item.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="lg:col-span-9">
                            <div className="glass p-8 rounded-[2rem] border border-white/5 min-h-[500px]">
                                {activeTab === 'summary' && (
                                    <div className="space-y-6">
                                        <h3 className="text-xl font-bold">Personal Summary</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs text-gray-400 uppercase">Full Name</label>
                                                <input value={data.name} className="w-full bg-white/5 border border-white/10 rounded-xl p-3" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs text-gray-400 uppercase">Contact Email</label>
                                                <input value={data.email} className="w-full bg-white/5 border border-white/10 rounded-xl p-3" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs text-gray-400 uppercase">Professional Summary</label>
                                            <textarea
                                                value={data.summary}
                                                rows={8}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 resize-none"
                                            />
                                        </div>
                                    </div>
                                )}
                                {/* Other tabs follow same pattern */}
                                {activeTab !== 'summary' && (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                        <p>Editing {activeTab} section...</p>
                                        <button className="mt-4 flex items-center gap-2 text-primary hover:underline">
                                            <Plus className="w-4 h-4" /> Add Entry
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="lg:col-span-12">
                        {/* Live Template Preview */}
                        <div className="max-w-4xl mx-auto bg-white text-black p-12 shadow-2xl rounded-sm min-h-[800px] flex flex-col gap-8">
                            <header className="border-b-4 border-black pb-4">
                                <h1 className="text-5xl font-black uppercase tracking-tighter">{data.name}</h1>
                                <div className="flex gap-4 text-sm font-bold opacity-60 mt-2">
                                    <span>{data.email}</span>
                                    <span>|</span>
                                    <span>{data.phone}</span>
                                </div>
                            </header>

                            <section>
                                <h2 className="text-xl font-black border-b border-black/10 pb-1 mb-3 uppercase tracking-widest">Professional Summary</h2>
                                <p className="text-sm leading-relaxed text-gray-700">{data.summary}</p>
                            </section>

                            <section>
                                <h2 className="text-xl font-black border-b border-black/10 pb-1 mb-3 uppercase tracking-widest">Core Expertise</h2>
                                <div className="flex flex-wrap gap-2">
                                    {data.skills.map(s => <span key={s} className="bg-black text-white px-3 py-1 text-xs font-bold">{s}</span>)}
                                </div>
                            </section>

                            <section>
                                <h2 className="text-xl font-black border-b border-black/10 pb-1 mb-3 uppercase tracking-widest">Experience</h2>
                                {data.experience.map((exp, i) => (
                                    <div key={i} className="mb-4">
                                        <div className="flex justify-between font-bold italic">
                                            <span>{exp.role} @ {exp.company}</span>
                                            <span>{exp.duration}</span>
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1 italic">Spearheaded AI initiatives and developed core platform features using React and Node.js.</p>
                                    </div>
                                ))}
                            </section>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CVGenerator;
