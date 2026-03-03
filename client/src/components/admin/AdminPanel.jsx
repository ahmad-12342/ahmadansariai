"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import {
    collection, getDocs, doc, updateDoc, deleteDoc,
    orderBy, query, limit, getDoc, increment
} from 'firebase/firestore';
import {
    Users, Sparkles, TrendingUp, CreditCard, Shield,
    Search, RefreshCw, Trash2, ChevronDown, ChevronUp,
    Loader2, AlertTriangle, Check, X, Plus, Minus,
    BarChart2, Clock, ImageIcon, Video, FileText, Zap,
    LogOut, Home, MessageSquare, BookOpen
} from 'lucide-react';
import Link from 'next/link';

const ADMIN_UID = 'O65GfNGOoFO0JfS8UCvW4wbyPmn2';

// ── Small stat card ──
function StatCard({ icon: Icon, label, value, color, sub }) {
    return (
        <div className="glass rounded-2xl border border-white/10 p-6">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">{label}</p>
            {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
        </div>
    );
}

// ── Credits editor ──
function CreditEditor({ uid, current, onDone }) {
    const [val, setVal] = useState(0);
    const [saving, setSaving] = useState(false);

    const apply = async (delta) => {
        setSaving(true);
        await updateDoc(doc(db, 'users', uid), { credits: increment(delta) });
        setSaving(false);
        onDone();
    };

    return (
        <div className="flex items-center gap-2 mt-2">
            <button onClick={() => apply(-Math.abs(val || 1))} disabled={saving} className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold hover:bg-red-500/30 transition-all flex items-center gap-1 disabled:opacity-40">
                <Minus className="w-3 h-3" /> Remove
            </button>
            <input
                type="number" min="1" max="9999" value={val}
                onChange={e => setVal(parseInt(e.target.value) || 0)}
                className="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs text-center focus:outline-none focus:border-white/30"
            />
            <button onClick={() => apply(Math.abs(val || 1))} disabled={saving} className="px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg text-xs font-bold hover:bg-green-500/30 transition-all flex items-center gap-1 disabled:opacity-40">
                <Plus className="w-3 h-3" /> Add
            </button>
            {saving && <Loader2 className="w-4 h-4 animate-spin text-gray-500" />}
        </div>
    );
}

export default function AdminPanel() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();

    const [tab, setTab] = useState('overview');
    const [users, setUsers] = useState([]);
    const [generations, setGens] = useState([]);
    const [stats, setStats] = useState(null);
    const [loadingData, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [editCredits, setEditCredits] = useState(null);

    // ── Auth guard ──
    useEffect(() => {
        if (!loading && (!user || user.uid !== ADMIN_UID)) {
            router.replace('/dashboard');
        }
    }, [user, loading, router]);

    // ── Fetch all data ──
    const fetchData = useCallback(async () => {
        if (!user || user.uid !== ADMIN_UID) return;
        setLoading(true);
        try {
            // Users
            const usersSnap = await getDocs(collection(db, 'users'));
            const allUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setUsers(allUsers);

            // Recent generations
            const genQ = query(collection(db, 'generations'), orderBy('createdAt', 'desc'), limit(50));
            const genSnap = await getDocs(genQ);
            setGens(genSnap.docs.map(d => ({ id: d.id, ...d.data() })));

            // Compute stats
            const totalCredits = allUsers.reduce((s, u) => s + (u.credits || 0), 0);
            const totalGens = allUsers.reduce((s, u) => s + (u.totalGenerations || 0), 0);
            setStats({ totalUsers: allUsers.length, totalGens, totalCredits });
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [user]);

    useEffect(() => { fetchData(); }, [fetchData]);


    // ── Delete user ──
    const deleteUser = async (uid) => {
        await deleteDoc(doc(db, 'users', uid));
        setUsers(prev => prev.filter(u => u.uid !== uid));
        setDeleteConfirm(null);
        setExpanded(null);
    };

    if (loading || !user || user.uid !== ADMIN_UID) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    const filteredUsers = users.filter(u =>
        (u.email?.toLowerCase().includes(search.toLowerCase())) ||
        (u.displayName?.toLowerCase().includes(search.toLowerCase()))
    );

    const TABS = [
        { id: 'overview', label: 'Overview', icon: BarChart2 },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'generations', label: 'Generations', icon: Sparkles },
    ];

    const typeColor = {
        image: 'text-blue-400   bg-blue-500/10',
        chat: 'text-indigo-400 bg-indigo-500/10',
        resume: 'text-purple-400 bg-purple-500/10',
        story: 'text-pink-400   bg-pink-500/10',
        video: 'text-gray-400 bg-white/10',
        cv: 'text-gray-400 bg-white/10',
    };

    return (
        <div className="min-h-screen bg-background text-white">
            {/* ── TOP BAR ── */}
            <div className="border-b border-white/10 bg-black/30 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                            <Shield className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <span className="font-black text-white text-sm">Admin Panel</span>
                            <span className="ml-2 text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-full px-2 py-0.5 uppercase tracking-widest">Restricted</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                            <Home className="w-4 h-4" /> Dashboard
                        </Link>
                        <button onClick={logout} className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                            <LogOut className="w-4 h-4" /> Logout
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

                {/* ── TABS ── */}
                <div className="flex gap-2 p-1 glass rounded-2xl border border-white/5 w-fit">
                    {TABS.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === t.id ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'text-gray-500 hover:text-white'}`}>
                            <t.icon className="w-4 h-4" />{t.label}
                        </button>
                    ))}
                    <button onClick={fetchData} className="px-3 py-2.5 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all" title="Refresh">
                        <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {loadingData ? (
                    <div className="flex items-center justify-center py-32">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        {/* ── OVERVIEW ── */}
                        {tab === 'overview' && (
                            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <StatCard icon={Users} label="Total Users" value={stats?.totalUsers} color="bg-blue-600" />
                                    <StatCard icon={Sparkles} label="Total Generations" value={stats?.totalGens} color="bg-purple-600" />
                                    <StatCard icon={CreditCard} label="Total Credits (all)" value={stats?.totalCredits} color="bg-green-600" />
                                </div>


                                {/* Recent signups */}
                                <div className="glass rounded-[2rem] border border-white/10 p-8">
                                    <h2 className="text-lg font-bold mb-6 flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Recent Users</h2>
                                    <div className="space-y-3">
                                        {users.slice(0, 5).map(u => (
                                            <div key={u.uid} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                                        {(u.displayName || u.email || 'U')[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white">{u.displayName || 'No name'}</p>
                                                        <p className="text-xs text-gray-500">{u.email}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ── USERS ── */}
                        {tab === 'users' && (
                            <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                                {/* Search */}
                                <div className="relative max-w-sm">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        placeholder="Search by email or name…"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                                    />
                                </div>

                                <p className="text-xs text-gray-500 font-bold">{filteredUsers.length} users found</p>

                                {/* User list */}
                                <div className="space-y-3">
                                    {filteredUsers.map(u => (
                                        <div key={u.uid} className="glass rounded-2xl border border-white/10 overflow-hidden">
                                            {/* Header row */}
                                            <div
                                                className="flex items-center justify-between p-5 cursor-pointer hover:bg-white/[0.02] transition-all"
                                                onClick={() => setExpanded(expanded === u.uid ? null : u.uid)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-sm font-black text-primary">
                                                        {(u.displayName || u.email || 'U')[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white text-sm">{u.displayName || 'No name'}</p>
                                                        <p className="text-xs text-gray-500">{u.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-gray-500">{u.credits ?? 0} cr</span>
                                                    {expanded === u.uid ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                                                </div>
                                            </div>

                                            {/* Expanded details */}
                                            <AnimatePresence>
                                                {expanded === u.uid && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
                                                            {/* Stats grid */}
                                                            <div className="grid grid-cols-3 gap-3">
                                                                {[
                                                                    { l: 'Credits', v: u.credits ?? 0 },
                                                                    { l: 'Generations', v: u.totalGenerations ?? 0 },
                                                                    { l: 'Storage (MB)', v: (u.storageUsed || 0).toFixed(1) },
                                                                ].map(s => (
                                                                    <div key={s.l} className="p-3 bg-white/5 rounded-xl text-center border border-white/5">
                                                                        <p className="text-lg font-bold text-white">{s.v}</p>
                                                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">{s.l}</p>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {/* UID */}
                                                            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                                                <p className="text-[10px] text-gray-500 uppercase mb-1">Firebase UID</p>
                                                                <p className="text-xs font-mono text-gray-300 break-all">{u.uid}</p>
                                                            </div>


                                                            {/* Credits editor */}
                                                            <div>
                                                                <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">
                                                                    Adjust Credits <span className="text-white">(current: {u.credits ?? 0})</span>
                                                                </p>
                                                                {editCredits === u.uid ? (
                                                                    <CreditEditor uid={u.uid} current={u.credits} onDone={() => { setEditCredits(null); fetchData(); }} />
                                                                ) : (
                                                                    <button onClick={() => setEditCredits(u.uid)} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-gray-300 hover:bg-white/10 transition-all flex items-center gap-2">
                                                                        <CreditCard className="w-3.5 h-3.5" /> Edit Credits
                                                                    </button>
                                                                )}
                                                            </div>

                                                            {/* Delete */}
                                                            {u.uid !== ADMIN_UID && (
                                                                <div>
                                                                    {deleteConfirm === u.uid ? (
                                                                        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                                                            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                                                            <span className="text-xs text-red-400 flex-1">Delete this user permanently?</span>
                                                                            <button onClick={() => deleteUser(u.uid)} className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-all">Yes, Delete</button>
                                                                            <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 bg-white/10 text-gray-300 text-xs font-bold rounded-lg hover:bg-white/20 transition-all">Cancel</button>
                                                                        </div>
                                                                    ) : (
                                                                        <button onClick={() => setDeleteConfirm(u.uid)} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl hover:bg-red-500/20 transition-all">
                                                                            <Trash2 className="w-3.5 h-3.5" /> Delete User
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* ── GENERATIONS ── */}
                        {tab === 'generations' && (
                            <motion.div key="gens" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                                <p className="text-xs text-gray-500 font-bold">Last 50 generations across all users</p>
                                <div className="space-y-3">
                                    {generations.map(g => (
                                        <div key={g.id} className="glass rounded-2xl border border-white/10 p-5 flex gap-4 items-start">
                                            {g.resultUrl && g.type === 'image' && (
                                                <img src={g.resultUrl} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-white/10" />
                                            )}
                                            {g.type !== 'image' && (
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${typeColor[g.type] || 'bg-white/10 text-gray-400'}`}>
                                                    {g.type === 'chat' ? <MessageSquare className="w-5 h-5" /> :
                                                        g.type === 'resume' ? <FileText className="w-5 h-5" /> :
                                                            g.type === 'story' ? <BookOpen className="w-5 h-5" /> :
                                                                g.type === 'video' ? <Video className="w-5 h-5" /> :
                                                                    <Sparkles className="w-5 h-5" />}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${typeColor[g.type]}`}>{g.type}</span>
                                                    <span className="text-[10px] text-gray-600 font-mono">{g.uid?.slice(0, 10)}…</span>
                                                </div>
                                                <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed">{g.prompt}</p>
                                                <p className="text-[10px] text-gray-600 mt-1">
                                                    {g.createdAt?.seconds ? new Date(g.createdAt.seconds * 1000).toLocaleString() : 'Unknown date'}
                                                </p>
                                            </div>
                                            {g.resultUrl && (
                                                <a href={g.resultUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-gray-300 hover:text-white hover:bg-white/10 transition-all flex-shrink-0">View</a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
