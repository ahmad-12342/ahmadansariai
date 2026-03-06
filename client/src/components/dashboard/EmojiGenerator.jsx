"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Download, Wand2, RefreshCw, Smile, Copy, Check, Share2, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { saveGeneration, checkDailyLimit } from '@/lib/firestoreService';

const EMOJI_PROMPTS = [
    "golden retriever with sunglasses",
    "astronaut cat",
    "cyberpunk robot",
    "lava monster",
    "magical unicorn",
    "pizza slice with a face",
    "floating island",
    "neon jellyfish"
];

const EmojiGenerator = () => {
    const { user, refreshStats } = useAuth();
    const [prompt, setPrompt] = useState('');
    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState(null);
    const [copied, setCopied] = useState(false);

    const handleRandom = () => {
        const random = EMOJI_PROMPTS[Math.floor(Math.random() * EMOJI_PROMPTS.length)];
        setPrompt(random);
    };

    const handleGenerate = async () => {
        if (!prompt.trim() || generating) return;

        if (!user) {
            alert('Bina login kare aap emoji generate nahi kar sakte. Please login ya signup karein!');
            window.location.href = '/login';
            return;
        }

        const limitCheck = await checkDailyLimit(user.uid, 'emoji');
        if (!limitCheck.allowed) {
            alert(limitCheck.message);
            return;
        }

        setGenerating(true);
        setResult(null);

        try {
            const response = await fetch('/api/generate-emoji', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt.trim() })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Generation failed');

            setResult(data.imageUrl);

            if (user) {
                await saveGeneration({
                    uid: user.uid,
                    type: 'emoji',
                    prompt: prompt.trim(),
                    resultUrl: data.imageUrl,
                    creditCost: 1,
                    storageMB: 0.5,
                    timeSavedHrs: 0.5,
                });
                refreshStats();
            }
        } catch (error) {
            console.error("Emoji generation failed:", error);
            alert("Oops! Emoji generation failed: " + error.message);
        } finally {
            setGenerating(false);
        }
    };

    const handleDownload = () => {
        if (!result) return;
        window.open(result, '_blank');
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-12 py-8 px-4">
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 text-yellow-400 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-yellow-500/20 shadow-lg shadow-yellow-500/10">
                    <Sparkles className="w-3 h-3" />
                    Custom Emoji Engine
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Generate Your Own <span className="text-gradient">Emoji</span></h1>
                <p className="text-gray-400 max-w-lg mx-auto">Turn any idea into a high-quality custom emoji with just a few words.</p>
            </motion.header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start text-left">
                {/* Left side: Input & Controls */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-8"
                >
                    <div className="glass p-8 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Smile className="w-32 h-32" />
                        </div>

                        <div className="space-y-4 relative z-10">
                            <label className="text-sm font-bold text-gray-400 uppercase tracking-widest pl-1">Emoji Description</label>
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                                placeholder="Describe your emoji (e.g. cyborg ninja)..."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-500/50 transition-all text-lg"
                            />
                        </div>

                        <div className="flex flex-wrap gap-3 relative z-10">
                            <button
                                onClick={handleRandom}
                                className="flex-1 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-gray-300 font-bold hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Random
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={generating || !prompt.trim()}
                                className="flex-[2] px-8 py-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-black uppercase tracking-widest hover:from-yellow-400 hover:to-orange-500 transition-all shadow-xl shadow-yellow-500/20 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-3"
                            >
                                {generating ? <Zap className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                                {generating ? "Creating..." : "Generate"}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {EMOJI_PROMPTS.slice(0, 3).map((p, i) => (
                            <button
                                key={i}
                                onClick={() => setPrompt(p)}
                                className="p-3 bg-white/5 border border-white/10 rounded-xl text-[10px] text-gray-500 hover:text-white hover:bg-white/10 transition-all text-center leading-tight font-medium"
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Right side: Result Display */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="relative flex justify-center"
                >
                    <div className="relative group w-full max-w-sm aspect-square bg-gradient-to-br from-white/[0.03] to-white/[0.01] rounded-[3rem] border border-white/10 p-8 flex flex-col items-center justify-center shadow-inner overflow-hidden">

                        <AnimatePresence mode="wait">
                            {result ? (
                                <motion.div
                                    key="result"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="w-full h-full flex flex-col items-center justify-center space-y-8"
                                >
                                    <div className="relative w-full aspect-square bg-white/5 rounded-[2.5rem] p-4 border border-white/10 shadow-2xl">
                                        <img src={result} alt="Emoji result" className="w-full h-full object-contain" />
                                    </div>
                                    <div className="flex gap-4 w-full">
                                        <button
                                            onClick={handleCopy}
                                            className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-xs font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                            {copied ? 'Copied' : 'Copy'}
                                        </button>
                                        <button
                                            onClick={handleDownload}
                                            className="flex-1 py-4 bg-yellow-500 text-black rounded-2xl text-xs font-bold hover:bg-yellow-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download
                                        </button>
                                    </div>
                                </motion.div>
                            ) : generating ? (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center space-y-6"
                                >
                                    <div className="relative w-24 h-24">
                                        <div className="absolute inset-0 border-4 border-yellow-500/20 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                            <Zap className="w-8 h-8 text-yellow-500 animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-white animate-pulse">Forging Your Emoji...</p>
                                        <p className="text-gray-500 text-xs mt-1">Merging pixels and creativity</p>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-center space-y-6 opacity-30 px-12"
                                >
                                    <div className="w-24 h-24 mx-auto bg-white/5 rounded-full flex items-center justify-center border border-white/10 mb-6">
                                        <Smile className="w-12 h-12 text-gray-400" />
                                    </div>
                                    <h3 className="text-xl font-medium text-white">No Emoji Yet</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">Enter a creative description on the left to start generating your custom emojis.</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Background glows */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-yellow-500/5 blur-[120px] rounded-full -z-10 pointer-events-none"></div>
                </motion.div>
            </div>

            {/* Gallery / Showoff grid */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-20 pt-20 border-t border-white/5"
            >
                <div className="text-center mb-12">
                    <h2 className="text-2xl font-bold text-white mb-2">Popular Styles</h2>
                    <p className="text-gray-500 text-sm italic">Inspired by the TOK Emoji model architecture</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { img: "https://pbxt.replicate.delivery/scVrE5ZDNNLcFR8CjkKeIhac0Wr9LezBQGj8rUAc8L1oqRiRA/out-0.png", label: "banana man" },
                        { img: "https://pbxt.replicate.delivery/dkxJjswDSP5KJtyNuIN8uj4O7f6CZeyaX5G2YHoapYEgZRiRA/out-0.png", label: "charles darwin" },
                        { img: "https://pbxt.replicate.delivery/idJeu3i7pMUtZ6IHYjai0TQSfbijeJxpdGFz3u4PCKesnGJGB/out-0.png", label: "hulk hogan" }
                    ].map((item, idx) => (
                        <div key={idx} className="bg-white/[0.03] p-5 rounded-[2rem] border border-white/10 flex flex-col items-center hover:bg-white/[0.05] transition-all group shadow-xl">
                            <div className="w-full aspect-square bg-black/20 rounded-2xl mb-4 overflow-hidden">
                                <img src={item.img} alt={item.label} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">{item.label}</span>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default EmojiGenerator;
