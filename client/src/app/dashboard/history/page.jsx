"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageIcon, Video, FileText, Sparkles, Download, Trash2, Search, Filter, Clock, Zap, ExternalLink, X, History, MessageSquare, BookOpen } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';

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

const typeColor = {
    chat: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    image: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    resume: "text-pink-400 bg-pink-500/10 border-pink-500/20",
    story: "text-purple-400 bg-purple-500/10 border-purple-500/20",
};

export default function HistoryPage() {
    const { user } = useAuth();
    const [generations, setGenerations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user) return;
            try {
                const q = query(
                    collection(db, "generations"),
                    where("uid", "==", user.uid),
                    orderBy("createdAt", "desc")
                ); // No limit — all history is permanently stored until user deletes
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => {
                    const d = doc.data();
                    return {
                        id: doc.id,
                        ...d,
                        createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt
                    };
                });
                setGenerations(data);
            } catch (error) {
                console.error("Error fetching history:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [user]);

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this creation from your history?")) return;
        try {
            await deleteDoc(doc(db, "generations", id));
            setGenerations(generations.filter(g => g.id !== id));
            if (selectedItem?.id === id) setSelectedItem(null);
        } catch (error) {
            console.error("Delete failed:", error);
        }
    };

    const filteredGenerations = generations.filter(g => {
        const matchesFilter = filter === 'all' || g.type === filter;
        const matchesSearch = g.prompt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            g.textContent?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20">
            {/* Header */}
            <div>
                <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-4xl font-bold mb-4 text-white"
                >
                    Creation <span className="text-gradient">Vault</span>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-gray-400"
                >
                    Your entire history of AI generated masterpieces, stored securely.
                </motion.p>
            </div>

            {/* Controls */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col md:flex-row gap-4 justify-between items-center"
            >
                <div className="flex gap-2 p-1 glass rounded-2xl border border-white/5 overflow-x-auto w-full md:w-auto no-scrollbar">
                    {['all', 'chat', 'image', 'resume', 'story'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${filter === f ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'text-gray-500 hover:text-white'
                                }`}
                        >
                            {typeLabel[f] || 'All Creations'}
                        </button>
                    ))}
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search your prompts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-white focus:border-primary/50 transition-all outline-none"
                    />
                </div>
            </motion.div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="aspect-[4/5] glass rounded-3xl animate-pulse bg-white/5 border border-white/5" />
                    ))}
                </div>
            ) : filteredGenerations.length === 0 ? (
                <div className="glass p-20 rounded-[3rem] border border-white/5 text-center">
                    <History className="w-16 h-16 text-gray-700 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold mb-2">No creations found</h2>
                    <p className="text-gray-500">Try changing your filters or start generating new content!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    <AnimatePresence mode='popLayout'>
                        {filteredGenerations.map((item) => {
                            const Icon = typeIcon[item.type] || Zap;
                            return (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="group relative glass rounded-[2rem] border border-white/5 hover:border-primary/30 transition-all overflow-hidden cursor-pointer"
                                    onClick={() => setSelectedItem(item)}
                                >
                                    {/* Preview Container */}
                                    <div className="aspect-[4/5] relative">
                                        {item.type === 'image' && item.resultUrl ? (
                                            <img src={item.resultUrl} alt="Gen" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                        ) : item.type === 'video' ? (
                                            <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex flex-col items-center justify-center p-6 text-center">
                                                <Video className="w-12 h-12 text-purple-400 mb-4" />
                                                <p className="text-xs font-bold text-gray-300 line-clamp-3">{item.prompt}</p>
                                            </div>
                                        ) : (
                                            <div className="w-full h-full bg-white/5 flex flex-col items-center justify-center p-8 text-center">
                                                <Icon className="w-12 h-12 text-primary opacity-50 mb-4" />
                                                <p className="text-xs font-bold text-gray-400 line-clamp-4">{item.prompt || 'Document'}</p>
                                            </div>
                                        )}

                                        {/* Badge */}
                                        <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${typeColor[item.type]}`}>
                                            {item.type}
                                        </div>

                                        {/* Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 p-6 flex flex-col justify-end">
                                            <div className="flex justify-between items-center">
                                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Just now'}
                                                </p>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                                        className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Item Detail Modal */}
            <AnimatePresence>
                {selectedItem && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-10">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedItem(null)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-4xl bg-[#0a0a0b] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
                        >
                            {/* Media Section */}
                            <div className="flex-[1.5] bg-black flex items-center justify-center min-h-[300px] max-h-[60vh] md:max-h-full">
                                {selectedItem.type === 'image' ? (
                                    <img src={selectedItem.resultUrl} className="max-w-full max-h-full object-contain" alt="Gen" />
                                ) : selectedItem.type === 'video' ? (
                                    <video src={selectedItem.resultUrl} controls autoPlay loop className="w-full h-full object-contain" />
                                ) : (
                                    <div className="p-10 text-center space-y-4">
                                        <FileText className="w-20 h-20 text-primary opacity-20 mx-auto" />
                                        <p className="text-gray-500">Document/Text Content Details</p>
                                    </div>
                                )}
                            </div>

                            {/* Info Section */}
                            <div className="flex-1 p-8 md:p-12 overflow-y-auto">
                                <div className="flex justify-between items-start mb-8">
                                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border ${typeColor[selectedItem.type]}`}>
                                        {selectedItem.type}
                                    </div>
                                    <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-white/5 rounded-full text-gray-400">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Prompt / Topic</h3>
                                <p className="text-lg text-white mb-8 font-medium leading-relaxed italic">&quot;{selectedItem.prompt}&quot;</p>

                                {selectedItem.textContent && (
                                    <div className="mb-8">
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Content Output</h3>
                                        <div className="bg-white/5 p-6 rounded-2xl text-xs text-gray-400 leading-loose prose-invert whitespace-pre-wrap max-h-60 overflow-y-auto border border-white/5">
                                            {selectedItem.textContent}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 mb-10">
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Generated On</p>
                                        <p className="text-sm font-bold text-white">{selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleDateString() : '—'}</p>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Impact</p>
                                        <p className="text-sm font-bold text-green-400">+{selectedItem.timeSavedHrs || 1}h Saved</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {selectedItem.resultUrl && (
                                        <a
                                            href={selectedItem.resultUrl}
                                            target="_blank"
                                            className="w-full py-4 bg-primary text-white rounded-full font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
                                        >
                                            <Download className="w-5 h-5" />
                                            Download Result
                                        </a>
                                    )}
                                    <button
                                        onClick={() => handleDelete(selectedItem.id)}
                                        className="w-full py-4 bg-white/5 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-full font-bold transition-all flex items-center justify-center gap-2"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                        Clear from History
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
