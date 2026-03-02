"use client";
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ImageIcon, X, Download, Bot, User, Sparkles, Plus, Zap, Copy, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { saveGeneration, checkDailyLimit } from '@/lib/firestoreService';

const LLM_API = 'https://backend.buildpicoapps.com/aero/run/llm-api?pk=v1-Z0FBQUFBQnBwV3BTQlJsVzhHQ0VqMFZjVWt1bWhRTER3eGtsLWJGSkJCLWR5cEl6aVBHRjdtei1PVEdVbUtSRHlMVldCQklJT2RfelVvVldCRXdQZGNTOGtvTlNzM2t0Y0E5PQ==';
const IMG_API = 'https://backend.buildpicoapps.com/aero/run/image-generation-api?pk=v1-Z0FBQUFBQnBwV3BTQlJsVzhHQ0VqMFZjVWt1bWhRTER3eGtsLWJGSkJCLWR5cEl6aVBHRjdtei1PVEdVbUtSRHlMVldCQklJT2RfelVvVldCRXdQZGNTOGtvTlNzM2t0Y0E5PQ==';
const PERSONA = "Follow instructions precisely! If the user asks to generate, create or make an image, photo, or picture by describing it, you will reply with '/image' + description. Otherwise respond normally. Be helpful, concise, and clear.";

const SUGGESTIONS = [
    { icon: '✍️', text: 'Write a professional email' },
    { icon: '🧠', text: 'Explain quantum computing' },
    { icon: '💡', text: 'Give me startup ideas' },
    { icon: '🎨', text: '/image futuristic city at night' },
];

export default function ChatAssistant() {
    const { user, refreshStats } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [lightbox, setLightbox] = useState(null);
    const [copied, setCopied] = useState(null);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
        }
    }, [input]);

    const addMsg = (msg) => setMessages(prev => [...prev, { id: Date.now() + Math.random(), ...msg }]);
    const removeLoading = () => setMessages(prev => prev.filter(m => !m.isLoading));

    const copyText = (id, text) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const downloadImage = (url) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = `promptova-ai-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const callApi = async (url, prompt) => {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt }),
        });
        return res.json();
    };

    const handleSend = async (msgOverride) => {
        const message = (msgOverride || input).trim();
        if (!message || loading) return;
        setInput('');
        setLoading(true);
        addMsg({ type: 'user', text: message });

        try {
            // Local detection for common image triggers
            const imageTriggers = ['generate image', 'create image', 'make a photo', 'make an image', 'draw ', 'paint ', 'picture of'];
            const forcedImage = message.toLowerCase().startsWith('/image');
            const looksLikeImagePrompt = imageTriggers.some(t => message.toLowerCase().includes(t));
            const isIntentImage = forcedImage || (looksLikeImagePrompt && message.length < 100);

            // ✅ Check Daily Limits for Free Plan
            if (user) {
                const limitCheck = await checkDailyLimit(user.uid, isIntentImage ? 'image' : 'chat');
                if (!limitCheck.allowed) {
                    addMsg({ type: 'bot', text: `⚠️ ${limitCheck.message}` });
                    setLoading(false);
                    return;
                }
            }

            if (isIntentImage) {
                let desc = forcedImage ? message.slice(6).trim() : message;
                // clean up the prompt a bit if it has trigger words
                if (!forcedImage) {
                    imageTriggers.forEach(t => { desc = desc.replace(new RegExp(t, 'gi'), '').trim(); });
                }

                addMsg({ type: 'bot', text: `Generating image for "${desc}"…`, isLoading: true });
                const data = await callApi(IMG_API, desc);
                removeLoading();
                if (data.status === 'success') {
                    addMsg({ type: 'image', imageUrl: data.imageUrl, prompt: desc });
                    if (user) {
                        await saveGeneration({
                            uid: user.uid,
                            type: 'image',
                            prompt: desc,
                            resultUrl: data.imageUrl,
                            creditCost: 5,
                            storageMB: 1,
                            timeSavedHrs: 0.5
                        });
                        refreshStats();
                    }
                } else addMsg({ type: 'bot', text: '⚠️ Image generation failed. Please try again.' });
            } else {
                addMsg({ type: 'bot', text: '', isLoading: true });
                const data = await callApi(LLM_API, PERSONA + message);
                removeLoading();
                if (data.status === 'success') {
                    // Detection from LLM response (command mode)
                    if (data.text?.toLowerCase().includes('/image')) {
                        const regex = /\/image\s+(.*)/i;
                        const match = data.text.match(regex);
                        const desc = match ? match[1].trim() : data.text.replace('/image', '').trim();

                        addMsg({ type: 'bot', text: `Generating requested image…`, isLoading: true });
                        const imgData = await callApi(IMG_API, desc);
                        removeLoading();
                        if (imgData.status === 'success') {
                            addMsg({ type: 'image', imageUrl: imgData.imageUrl, prompt: desc });
                            if (user) {
                                await saveGeneration({
                                    uid: user.uid,
                                    type: 'image',
                                    prompt: desc,
                                    resultUrl: imgData.imageUrl,
                                    creditCost: 5,
                                    storageMB: 1,
                                    timeSavedHrs: 0.5
                                });
                                refreshStats();
                            }
                        }
                    } else {
                        addMsg({ type: 'bot', text: data.text });
                        if (user) {
                            await saveGeneration({
                                uid: user.uid,
                                type: 'chat',
                                prompt: message,
                                textContent: data.text,
                                creditCost: 1,
                                storageMB: 0.01,
                                timeSavedHrs: 0.2
                            });
                            refreshStats();
                        }
                    }
                } else {
                    addMsg({ type: 'bot', text: '⚠️ Something went wrong. Please try again.' });
                }
            }
        } catch (e) {
            console.error(e);
            removeLoading();
            addMsg({ type: 'bot', text: '⚠️ Network error. Please check your connection.' });
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const isEmpty = messages.length === 0;

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto">

            {/* ── TOP BAR ── */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white leading-none">Promptova AI</h1>
                        <p className="text-[11px] text-gray-500 mt-0.5">Neural Chat · Image Gen</p>
                    </div>
                </div>
                <button
                    onClick={() => setMessages([])}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 border border-white/5 transition-all"
                >
                    <Plus className="w-3.5 h-3.5" />
                    New Chat
                </button>
            </div>

            {/* ── CHAT FEED ── */}
            <div className="flex-1 overflow-y-auto space-y-1 pb-4 no-scrollbar">
                <AnimatePresence initial={false}>

                    {/* Empty state */}
                    {isEmpty && (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center h-full py-24 text-center"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center mb-6">
                                <Sparkles className="w-7 h-7 text-violet-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">How can I help you today?</h2>
                            <p className="text-gray-500 text-sm mb-10">Ask me anything, or use <code className="text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded text-xs">/image</code> to generate art</p>

                            <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                                {SUGGESTIONS.map((s, i) => (
                                    <motion.button
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.05 * i }}
                                        onClick={() => handleSend(s.text)}
                                        className="text-left p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.07] hover:border-white/20 transition-all group"
                                    >
                                        <span className="text-xl mr-2">{s.icon}</span>
                                        <span className="text-sm text-gray-400 group-hover:text-white transition-colors">{s.text}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Messages */}
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`group flex gap-4 px-2 py-3 rounded-2xl transition-colors ${msg.type === 'user' ? 'flex-row-reverse' : ''} ${msg.type !== 'user' && !msg.isLoading ? 'hover:bg-white/[0.02]' : ''}`}
                        >
                            {/* Avatar */}
                            {msg.type !== 'image' && (
                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5 ${msg.type === 'user'
                                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                                    : 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white'
                                    }`}>
                                    {msg.type === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                                </div>
                            )}

                            {/* Content */}
                            <div className={`flex-1 min-w-0 ${msg.type === 'user' ? 'flex justify-end' : ''}`}>
                                {msg.type === 'user' && (
                                    <div className="inline-block max-w-[80%] px-4 py-3 rounded-2xl rounded-tr-sm bg-[#2f2f2f] text-white text-sm leading-relaxed">
                                        {msg.text}
                                    </div>
                                )}

                                {msg.type === 'bot' && (
                                    <div className="max-w-[90%]">
                                        <p className="text-[11px] font-bold text-violet-400 mb-1.5 uppercase tracking-widest">Promptova AI</p>
                                        {msg.isLoading ? (
                                            <div className="flex items-center gap-1.5 py-2">
                                                <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <p className="text-gray-200 text-sm leading-7 whitespace-pre-wrap">{msg.text}</p>
                                                <button
                                                    onClick={() => copyText(msg.id, msg.text)}
                                                    className="absolute -bottom-7 right-0 flex items-center gap-1 text-[10px] text-gray-600 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    {copied === msg.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                                    {copied === msg.id ? 'Copied' : 'Copy'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {msg.type === 'image' && (
                                    <div className="flex flex-col items-center gap-3 py-2 w-full">
                                        {msg.prompt && (
                                            <p className="text-xs text-gray-500 italic self-start">
                                                <Sparkles className="inline w-3 h-3 mr-1 text-violet-400" />
                                                Generated: "{msg.prompt}"
                                            </p>
                                        )}
                                        <div
                                            className="relative group/img cursor-pointer rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
                                            style={{ maxWidth: 380 }}
                                            onClick={() => setLightbox(msg.imageUrl)}
                                        >
                                            <img
                                                src={msg.imageUrl}
                                                alt="Generated"
                                                className="w-full object-cover group-hover/img:scale-[1.02] transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-all flex items-center justify-center gap-3">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setLightbox(msg.imageUrl); }}
                                                    className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl text-white text-xs font-bold border border-white/20 hover:bg-white/20 transition-all"
                                                >
                                                    View Full
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); downloadImage(msg.imageUrl); }}
                                                    className="px-4 py-2 bg-violet-600/80 backdrop-blur-sm rounded-xl text-white text-xs font-bold border border-violet-400/30 hover:bg-violet-500 transition-all flex items-center gap-1.5"
                                                >
                                                    <Download className="w-3.5 h-3.5" /> Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <div ref={bottomRef} />
            </div>

            {/* ── INPUT ── */}
            <div className="flex-shrink-0 pt-2">
                <div className={`relative rounded-2xl border transition-all duration-200 bg-[#1a1a1a] ${loading ? 'border-violet-500/30' : 'border-white/10 focus-within:border-white/20'}`}>
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKey}
                        placeholder="Message Promptova AI… (Shift+Enter for new line)"
                        rows={1}
                        disabled={loading}
                        className="w-full bg-transparent resize-none outline-none text-white text-sm px-5 pt-4 pb-12 placeholder:text-gray-600 leading-relaxed"
                        style={{ maxHeight: 160 }}
                    />
                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => { setInput('/image '); inputRef.current?.focus(); textareaRef.current?.focus(); }}
                            title="Generate image"
                            className="p-2 rounded-xl text-gray-500 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
                        >
                            <ImageIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || loading}
                            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-white text-black hover:bg-gray-200 disabled:bg-white/10 disabled:text-gray-600"
                        >
                            <Send className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
                <p className="text-center text-[10px] text-gray-600 mt-2">
                    Promptova AI can make mistakes. Verify important info.
                </p>
            </div>

            {/* ── LIGHTBOX ── */}
            <AnimatePresence>
                {lightbox && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setLightbox(null)}
                        className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex items-center justify-center p-8"
                    >
                        <motion.div
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25 }}
                            onClick={e => e.stopPropagation()}
                            className="relative max-w-3xl w-full"
                        >
                            <img src={lightbox} alt="Full size" className="w-full rounded-3xl shadow-2xl" />
                            <div className="absolute -top-12 right-0 flex gap-2">
                                <button
                                    onClick={() => downloadImage(lightbox)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl text-white text-xs font-bold border border-white/10 hover:bg-white/20 transition-all"
                                >
                                    <Download className="w-4 h-4" /> Download
                                </button>
                                <button
                                    onClick={() => setLightbox(null)}
                                    className="p-2 bg-white/10 backdrop-blur-sm rounded-xl text-gray-400 hover:text-white hover:bg-white/20 transition-all border border-white/10"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
