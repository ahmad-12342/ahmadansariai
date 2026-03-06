"use client";
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ImageIcon, X, Download, Bot, User, Sparkles, Plus, Zap, Copy, Check, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { saveGeneration, checkDailyLimit } from '@/lib/firestoreService';

const PERSONA = "CRITICAL INSTRUCTION: If user asks for an image, logo, art, photo or picture, you MUST ALWAYS respond with ONLY '/image ' + description. No apologies. No talk. Just '/image ...'. For other topics, be a helpful assistant.";

const SUGGESTIONS = [
    { icon: '✍️', text: 'Write a professional email' },
    { icon: '🧠', text: 'Explain quantum computing' },
    { icon: '🎨', text: 'Logo for a tech startup' },
    { icon: '✨', text: 'A futuristic floating city' },
];

export default function ChatAssistant() {
    const { user, refreshStats } = useAuth();
    const [messages, setMessages] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('promptovaai_chat_history');
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) {
                    console.error("Failed to parse chat history", e);
                }
            }
        }
        return [];
    });
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedImagePreview, setSelectedImagePreview] = useState(null);
    const [lightbox, setLightbox] = useState(null);
    const [copied, setCopied] = useState(null);
    const [showTooltip, setShowTooltip] = useState(false);
    const bottomRef = useRef(null);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('promptovaai_chat_history', JSON.stringify(messages));
        }
    }, [messages]);

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
        a.download = `promptovaai-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const clearSelectedImage = () => {
        setSelectedImage(null);
        setSelectedImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const callApi = async (type, prompt) => {
        const endpoint = type === 'image' ? '/api/generate-image' : '/api/generate-chat';
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: type === 'chat' ? (PERSONA + prompt) : prompt,
                    firebaseId: user?.uid
                }),
            });
            const data = await res.json();

            if (res.ok) {
                return {
                    status: 'success',
                    imageUrl: data.imageUrl || data.url,
                    text: data.text
                };
            }
            return { status: 'error', message: data.error || 'Request failed' };
        } catch (err) {
            return { status: 'error', message: err.message };
        }
    };

    const handleSend = async (msgOverride) => {
        const message = (msgOverride || input).trim();
        if ((!message && !selectedImage) || loading) return;

        setInput('');
        const currentImage = selectedImagePreview;
        clearSelectedImage();
        setLoading(true);
        addMsg({ type: 'user', text: message, userImage: currentImage });

        try {
            // ✅ Improved Local Intent Detection
            const imageTriggers = ['generate', 'create', 'make', 'draw', 'paint', 'photo', 'logo', 'picture', 'art', 'sketch', 'wallpaper'];
            const forcedImage = message.toLowerCase().startsWith('/image');
            const containsTrigger = imageTriggers.some(t => message.toLowerCase().includes(t));
            const isIntentImage = forcedImage || (containsTrigger && message.length < 150);

            if (!user) {
                addMsg({ type: 'bot', text: `⚠️ Bina login kare aap AI Assistant use nahi kar sakte. \n\nPlease [Login ya Signup](/login) karein.` });
                setLoading(false);
                return;
            }

            const limitCheck = await checkDailyLimit(user.uid, isIntentImage ? 'image' : 'chat');
            if (!limitCheck.allowed) {
                addMsg({ type: 'bot', text: `⚠️ ${limitCheck.message}` });
                setLoading(false);
                return;
            }

            if (isIntentImage) {
                let desc = forcedImage ? message.slice(6).trim() : message;
                // Clean description of common triggers for better API prompt
                const cleanTriggers = ['generate', 'create', 'make', 'draw', 'a ', 'an ', 'the '];
                if (!forcedImage) {
                    cleanTriggers.forEach(t => { desc = desc.replace(new RegExp(`\\b${t}\\b`, 'gi'), '').trim(); });
                }

                addMsg({ type: 'bot', text: `Designing your creation: "${desc}"…`, isLoading: true });
                const data = await callApi('image', desc);
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
                } else {
                    addMsg({ type: 'bot', text: `⚠️ Image generation failed: ${data.message || 'Unknown error'}` });
                }
            } else {
                addMsg({ type: 'bot', text: '', isLoading: true });
                const data = await callApi('chat', message);
                removeLoading();
                if (data.status === 'success') {
                    if (data.text?.toLowerCase().includes('/image')) {
                        const regex = /\/image\s+(.*)/i;
                        const match = data.text.match(regex);
                        const desc = match ? match[1].trim() : data.text.replace('/image', '').trim();

                        addMsg({ type: 'bot', text: `Generating requested image…`, isLoading: true });
                        const imgData = await callApi('image', desc);
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
                        } else {
                            addMsg({ type: 'bot', text: `⚠️ Image generation failed: ${imgData.message || 'Unknown error'}` });
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
                    addMsg({ type: 'bot', text: `⚠️ AI Chat failed: ${data.message || 'Something went wrong'}` });
                }
            }
        } catch (e) {
            console.error(e);
            removeLoading();
            addMsg({ type: 'bot', text: '⚠️ Network error. Please try again.' });
        } finally {
            setLoading(false);
            textareaRef.current?.focus();
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
        <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto px-4 md:px-0">
            {/* TOP BAR */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white leading-none">Image Gen AI</h1>
                        <p className="text-xs text-gray-500 mt-1">Unified Creation Assistant</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        if (confirm('Are you sure you want to start a new session? This will clear your current chat.')) {
                            setMessages([]);
                            localStorage.removeItem('promptovaai_chat_history');
                        }
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 border border-white/5 transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    New Session
                </button>
            </div>

            {/* CHAT FEED */}
            <div className="flex-1 overflow-y-auto space-y-4 pb-4 no-scrollbar scroll-smooth">
                <AnimatePresence initial={false}>
                    {isEmpty && (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center h-full py-12 text-center"
                        >
                            <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center mb-8 shadow-2xl shadow-violet-500/10">
                                <Bot className="w-10 h-10 text-violet-400" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-3">How can I assist you today?</h2>
                            <p className="text-gray-400 text-sm mb-12 max-w-sm mx-auto leading-relaxed">
                                I can answer questions, write code, or generate stunning images using <code className="text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded">/image</code>
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl">
                                {SUGGESTIONS.map((s, i) => (
                                    <motion.button
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.05 * i }}
                                        onClick={() => handleSend(s.text)}
                                        className="text-left p-5 rounded-[2rem] bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/10 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl p-3 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform">{s.icon}</span>
                                            <span className="text-sm text-gray-400 group-hover:text-white transition-colors font-medium">{s.text}</span>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-4 group ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                            <div className={`w-9 h-9 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg ${msg.type === 'user'
                                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                                : 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white'
                                }`}>
                                {msg.type === 'user' ? <User className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                            </div>

                            <div className={`flex-1 min-w-0 flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                                {msg.type === 'user' && (
                                    <div className="flex flex-col items-end gap-2 max-w-[80%]">
                                        {msg.userImage && (
                                            <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-white/10 mb-1">
                                                <img src={msg.userImage} alt="User upload" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        {msg.text && (
                                            <div className="px-5 py-3.5 rounded-[2rem] rounded-tr-sm bg-[#2f2f2f] text-white text-sm leading-relaxed shadow-lg">
                                                {msg.text}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {msg.type === 'bot' && (
                                    <div className="max-w-[85%] w-full">
                                        {msg.isLoading ? (
                                            <div className="flex items-center gap-2 py-3 px-5 bg-white/[0.03] rounded-3xl w-fit">
                                                <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" />
                                            </div>
                                        ) : (
                                            <div className="relative group/bot">
                                                <div className="p-5 rounded-[2rem] rounded-tl-sm bg-white/[0.03] border border-white/[0.05] text-gray-200 text-[15px] leading-relaxed whitespace-pre-wrap">
                                                    {msg.text}
                                                </div>
                                                <button
                                                    onClick={() => copyText(msg.id, msg.text)}
                                                    className="mt-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-white transition-colors"
                                                >
                                                    {copied === msg.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                                    {copied === msg.id ? 'Copied' : 'Copy Response'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {msg.type === 'image' && (
                                    <div className="flex flex-col gap-3 w-full max-w-sm">
                                        <div
                                            className="relative aspect-square rounded-[2rem] overflow-hidden border-4 border-white/5 shadow-2xl group/img cursor-zoom-in"
                                            onClick={() => setLightbox(msg.imageUrl)}
                                        >
                                            <img
                                                src={msg.imageUrl}
                                                alt="AI Generation"
                                                className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700"
                                            />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-all flex items-center justify-center gap-4">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); downloadImage(msg.imageUrl); }}
                                                    className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center hover:bg-violet-500 transition-colors shadow-lg"
                                                >
                                                    <Download className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setLightbox(msg.imageUrl); }}
                                                    className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 transition-colors border border-white/20"
                                                >
                                                    <Sparkles className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                        {msg.prompt && (
                                            <div className="px-4 text-[11px] text-gray-500 font-medium italic line-clamp-2">
                                                Generated: {msg.prompt}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <div ref={bottomRef} className="h-4" />
            </div>

            {/* INPUT AREA */}
            <div className="flex-shrink-0 pt-4 pb-6">
                <AnimatePresence>
                    {selectedImagePreview && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="mb-3 relative w-20 h-20 group"
                        >
                            <img src={selectedImagePreview} alt="Selected" className="w-full h-full object-cover rounded-2xl border-2 border-violet-500/50 shadow-lg shadow-violet-500/20" />
                            <button
                                onClick={clearSelectedImage}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg active:scale-90"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className={`relative rounded-[2.5rem] border transition-all duration-300 bg-[#161616] p-2 ${loading ? 'border-violet-500/30' : 'border-white/10 focus-within:border-white/20 shadow-2xl shadow-black/40'}`}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageSelect}
                        accept="image/*"
                        className="hidden"
                    />
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKey}
                        placeholder="Ask me anything or use /image..."
                        rows={1}
                        disabled={loading}
                        className="w-full bg-transparent resize-none outline-none text-white text-[15px] px-6 py-4 pr-40 placeholder:text-gray-600 leading-relaxed scrollbar-hide"
                        style={{ maxHeight: 160 }}
                    />

                    <div className="absolute right-4 bottom-4 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            title="Upload image"
                            className="p-3 rounded-full text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all active:scale-95"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                        <div className="relative">
                            <button
                                type="button"
                                onMouseEnter={() => setShowTooltip(true)}
                                onMouseLeave={() => setShowTooltip(false)}
                                onClick={() => { setInput('/image '); textareaRef.current?.focus(); }}
                                className="p-3 rounded-full text-gray-500 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
                            >
                                <ImageIcon className="w-5 h-5" />
                            </button>
                            <AnimatePresence>
                                {showTooltip && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute bottom-full right-0 mb-3 w-56 p-3 bg-gray-800 border border-white/10 rounded-2xl shadow-2xl text-[11px] text-gray-300 z-50 pointer-events-none"
                                    >
                                        Simply ask for an image or type <strong>/image</strong> followed by the description to generate art.
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || loading}
                            className="h-11 px-6 rounded-full flex items-center justify-center gap-2 transition-all font-bold text-xs uppercase tracking-widest disabled:opacity-30 bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-600/20 active:scale-95"
                        >
                            {loading ? <Zap className="w-4 h-4 animate-pulse" /> : <Send className="w-4 h-4" />}
                            <span>{loading ? 'Processing' : 'Send'}</span>
                        </button>
                    </div>
                </div>
                <p className="text-center text-[10px] text-gray-600 mt-3 font-medium uppercase tracking-[0.2em]">
                    PromptovaAI Assistant • Versatile Insight & Creation
                </p>
            </div>

            {/* LIGHTBOX */}
            <AnimatePresence>
                {lightbox && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setLightbox(null)}
                        className="fixed inset-0 z-[500] bg-black/98 backdrop-blur-2xl flex items-center justify-center p-6 md:p-12"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25 }}
                            onClick={e => e.stopPropagation()}
                            className="relative max-w-4xl w-full"
                        >
                            <img src={lightbox} alt="Full Resolution" className="w-full rounded-[2.5rem] shadow-2xl border border-white/10" />
                            <div className="absolute -top-16 left-0 right-0 flex justify-between items-center px-2">
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => downloadImage(lightbox)}
                                        className="flex items-center gap-2 px-6 py-3 bg-violet-600 rounded-2xl text-white text-xs font-bold hover:bg-violet-500 transition-all shadow-xl"
                                    >
                                        <Download className="w-4 h-4" /> Download
                                    </button>
                                </div>
                                <button
                                    onClick={() => setLightbox(null)}
                                    className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
