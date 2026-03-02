"use client";
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, Sparkles, Plus, Minus, User, RefreshCw,
    Copy, RotateCcw, Loader2, Image as ImageIcon, CheckCircle, ChevronDown
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { saveGeneration, checkDailyLimit } from '@/lib/firestoreService';

const IMG_API = 'https://backend.buildpicoapps.com/aero/run/image-generation-api?pk=v1-Z0FBQUFBQnBwVzZBa1Z3ZEpWQWhmc1FCWkxCT2x2WGxuRUhLWDl1SUZPbTR5M1ZRS3p3dXpSa2lxNF9SdU5nbWlBbkVZVV9XM3l3ekVULWV3RmxobU1na2U0b3M0Mkp0SlE9PQ==';
const WS_APP_ID = 'matter-they';

const CATEGORIES = ['fairy_tales', 'animals', 'fantasy', 'science_fiction', 'mystery', 'adventure', 'sports', 'school'];
const TOPICS = ['friendship', 'family', 'magic', 'space', 'nature', 'history', 'heroes', 'holidays', 'travel'];
const LENGTHS = [{ v: 'short', l: 'Short (250 words)' }, { v: 'medium', l: 'Medium (600 words)' }, { v: 'long', l: 'Long (1000 words)' }];
const SPP = ['1', '2', '3', '4', '5'];
const SL = ['short', 'medium', 'long'];
const HAIR = ['brown', 'blonde', 'black', 'red', 'gray'];
const EYES = ['blue', 'brown', 'green', 'hazel', 'gray'];
const SKIN = ['light', 'fair', 'medium', 'olive', 'brown', 'dark'];
const ORDINALS = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'];

const emptyChild = () => ({ name: '', age: '', gender: 'male', hair: 'brown', eye: 'blue', skin: 'light' });

const cap = s => s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ');

async function generateImage(prompt) {
    const res = await fetch(IMG_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
    });
    const data = await res.json();
    if (data.status === 'success') return data.imageUrl;
    throw new Error('Image generation failed');
}

function Select({ label, value, onChange, options }) {
    return (
        <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</label>
            <div className="relative">
                <select
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-medium appearance-none focus:outline-none focus:border-purple-500/50 transition-all cursor-pointer pr-10"
                >
                    {options.map(o => (
                        <option key={typeof o === 'string' ? o : o.v} value={typeof o === 'string' ? o : o.v} className="bg-gray-900">
                            {typeof o === 'string' ? cap(o) : o.l}
                        </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
        </div>
    );
}

export default function StoryGenerator() {
    const { user, refreshStats } = useAuth();
    const [category, setCategory] = useState('fairy_tales');
    const [topic, setTopic] = useState('friendship');
    const [length, setLength] = useState('medium');
    const [spp, setSpp] = useState('3');
    const [sl, setSl] = useState('medium');
    const [children, setChildren] = useState([emptyChild(), emptyChild()]);
    const [generating, setGenerating] = useState(false);
    const [titleHtml, setTitleHtml] = useState('');
    const [paragraphs, setParagraphs] = useState([]);  // [{text, imageUrl, imgLoading}]
    const [titleImg, setTitleImg] = useState('');
    const [titleImgLoading, setTitleImgLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const rawHtmlRef = useRef('');

    // ── child helpers ──
    const addChild = () => setChildren(c => c.length < 10 ? [...c, emptyChild()] : c);
    const removeChild = () => setChildren(c => c.length > 1 ? c.slice(0, -1) : c);
    const updateChild = (i, key, val) => setChildren(c => c.map((ch, idx) => idx === i ? { ...ch, [key]: val } : ch));

    const childDataString = children.map(ch =>
        `${ch.name || 'Child'} (${ch.age || '?'} yrs, ${ch.gender}, Hair: ${ch.hair}, Eyes: ${ch.eye}, Skin: ${ch.skin})`
    ).join(', ');

    // ── parse streamed HTML into title + paragraphs ──
    const parseHtml = (html) => {
        const div = document.createElement('div');
        div.innerHTML = html;
        const h1 = div.querySelector('h1');
        const title = h1 ? h1.outerHTML : '';
        const paras = Array.from(div.querySelectorAll('p')).map(p => ({ text: p.innerText || p.textContent, imageUrl: '', imgLoading: false }));
        return { title, paras };
    };

    // ── generate title cover image ──
    const genTitleImage = async (titleText) => {
        setTitleImgLoading(true);
        try {
            const url = await generateImage(`Cute heartwarming illustration for a story titled: "${titleText}". Characters: ${childDataString}`);
            setTitleImg(url);
        } catch { /* silent */ }
        finally { setTitleImgLoading(false); }
    };

    // ── generate image for a single paragraph ──
    const genParaImage = async (idx) => {
        setParagraphs(prev => prev.map((p, i) => i === idx ? { ...p, imgLoading: true } : p));
        try {
            const url = await generateImage(`Cute heartwarming illustration for: "${paragraphs[idx].text}". Characters: ${childDataString}`);
            setParagraphs(prev => prev.map((p, i) => i === idx ? { ...p, imageUrl: url, imgLoading: false } : p));
        } catch {
            setParagraphs(prev => prev.map((p, i) => i === idx ? { ...p, imgLoading: false } : p));
        }
    };

    // ── submit ──
    const handleGenerate = async (e) => {
        e.preventDefault();

        if (user) {
            const limitCheck = await checkDailyLimit(user.uid, 'story');
            if (!limitCheck.allowed) {
                alert(limitCheck.message);
                return;
            }
        }

        setGenerating(true);
        setTitleHtml('');
        setParagraphs([]);
        setTitleImg('');
        rawHtmlRef.current = '';

        const prompt = `Create a ${length} personalised ${category} story about ${topic}, including the following children: ${childDataString}. Story must have ${spp} sentences per paragraph and make the sentences ${sl}. Only show me the Title of the story and the Story. Respond in HTML using <p> for paragraphs.`;

        const ws = new WebSocket(`wss://backend.buildpicoapps.com/ask_ai_streaming?app_id=${WS_APP_ID}&prompt=${encodeURIComponent(prompt)}`);

        ws.addEventListener('message', (ev) => {
            rawHtmlRef.current += ev.data;
            // live update title + paragraphs
            const { title, paras } = parseHtml(rawHtmlRef.current);
            setTitleHtml(title);
            setParagraphs(paras.map(p => ({ text: p.text, imageUrl: '', imgLoading: false })));
        });

        ws.addEventListener('close', async (ev) => {
            setGenerating(false);
            if (ev.code !== 1000) { alert('Connection error. Please try again.'); return; }
            // Generate title image
            const { title, paras } = parseHtml(rawHtmlRef.current);
            const div = document.createElement('div');
            div.innerHTML = title;
            const titleText = div.textContent || div.innerText || 'Story';
            genTitleImage(titleText);

            // Save to Firestore
            if (user) {
                await saveGeneration({
                    uid: user.uid,
                    type: 'story',
                    prompt: `Story: ${titleText} (${category}/${topic})`,
                    textContent: rawHtmlRef.current,
                    creditCost: 10,
                    storageMB: 0.2,
                    timeSavedHrs: 3
                });
                refreshStats();
            }
        });

        ws.addEventListener('error', () => {
            setGenerating(false);
            alert('WebSocket error. Please try again.');
        });
    };

    const handleCopy = () => {
        const allText = paragraphs.map(p => p.text).join('\n\n');
        navigator.clipboard.writeText(allText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleReset = () => {
        setTitleHtml('');
        setParagraphs([]);
        setTitleImg('');
        rawHtmlRef.current = '';
    };

    const hasStory = titleHtml || paragraphs.length > 0;

    return (
        <div className="max-w-6xl mx-auto space-y-8">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-xs font-bold uppercase tracking-wider mb-3 border border-purple-500/20">
                    <BookOpen className="w-3 h-3" />
                    Neural Story Engine
                </div>
                <h1 className="text-4xl font-bold mb-2">
                    AI Story <span className="text-gradient">Generator</span>
                </h1>
                <p className="text-gray-400">Create personalised stories for kids — with AI-generated illustrations for every paragraph.</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

                {/* ── FORM ── */}
                <motion.form
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    onSubmit={handleGenerate}
                    className="lg:col-span-2 space-y-6"
                >
                    {/* Story Settings */}
                    <div className="glass rounded-[2rem] border border-white/10 p-6 space-y-4">
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-400" /> Story Settings
                        </h2>
                        <Select label="Category" value={category} onChange={setCategory} options={CATEGORIES} />
                        <Select label="Topic" value={topic} onChange={setTopic} options={TOPICS} />
                        <Select label="Length" value={length} onChange={setLength} options={LENGTHS} />
                        <Select label="Sentences / Paragraph" value={spp} onChange={setSpp} options={SPP} />
                        <Select label="Sentence Length" value={sl} onChange={setSl} options={SL} />
                    </div>

                    {/* Children */}
                    <div className="glass rounded-[2rem] border border-white/10 p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-bold text-white flex items-center gap-2">
                                <User className="w-4 h-4 text-blue-400" /> Characters
                            </h2>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={removeChild} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition-all flex items-center justify-center">
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="text-sm font-bold text-white w-5 text-center">{children.length}</span>
                                <button type="button" onClick={addChild} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-green-500/20 hover:text-green-400 transition-all flex items-center justify-center">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4 no-scrollbar overflow-y-auto max-h-80">
                            {children.map((ch, i) => (
                                <div key={i} className="p-4 bg-white/[0.03] rounded-2xl border border-white/5 space-y-3">
                                    <p className="text-xs font-bold text-purple-400 uppercase tracking-widest">{ORDINALS[i]} Child</p>
                                    <input
                                        type="text"
                                        placeholder="Name"
                                        value={ch.name}
                                        onChange={e => updateChild(i, 'name', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-gray-600"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="number"
                                            placeholder="Age"
                                            value={ch.age}
                                            onChange={e => updateChild(i, 'age', e.target.value)}
                                            min="1" max="18"
                                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-gray-600"
                                        />
                                        <select
                                            value={ch.gender}
                                            onChange={e => updateChild(i, 'gender', e.target.value)}
                                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm appearance-none focus:outline-none focus:border-purple-500/50 transition-all"
                                        >
                                            <option value="male" className="bg-gray-900">Male</option>
                                            <option value="female" className="bg-gray-900">Female</option>
                                            <option value="other" className="bg-gray-900">Other</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[['hair', 'Hair', HAIR], ['eye', 'Eyes', EYES], ['skin', 'Skin', SKIN]].map(([key, lbl, opts]) => (
                                            <select
                                                key={key}
                                                value={ch[key]}
                                                onChange={e => updateChild(i, key, e.target.value)}
                                                className="bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-white text-xs appearance-none focus:outline-none focus:border-purple-500/50 transition-all"
                                            >
                                                {opts.map(o => <option key={o} value={o} className="bg-gray-900">{cap(o)}</option>)}
                                            </select>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={generating}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold transition-all flex items-center justify-center gap-3 shadow-lg shadow-purple-500/20 disabled:opacity-60"
                    >
                        {generating
                            ? <><Loader2 className="w-5 h-5 animate-spin" /> Writing Story…</>
                            : <><BookOpen className="w-5 h-5" /> Generate Story!</>
                        }
                    </button>
                </motion.form>

                {/* ── OUTPUT ── */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-3 space-y-6"
                >
                    {!hasStory && !generating ? (
                        <div className="glass rounded-[2rem] border border-white/10 p-16 flex flex-col items-center justify-center text-center opacity-40">
                            <BookOpen className="w-20 h-20 text-gray-500 mb-4" />
                            <p className="text-gray-400 font-medium text-lg">Your story will appear here</p>
                            <p className="text-gray-500 text-sm mt-1">Configure settings and click Generate!</p>
                        </div>
                    ) : (
                        <>
                            {/* Title + Cover Image */}
                            {(titleHtml || titleImgLoading) && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    className="glass rounded-[2rem] border border-white/10 overflow-hidden"
                                >
                                    {/* Cover image */}
                                    {titleImgLoading ? (
                                        <div className="h-48 bg-white/5 flex items-center justify-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                                                <p className="text-xs text-gray-500">Generating cover art…</p>
                                            </div>
                                        </div>
                                    ) : titleImg ? (
                                        <div className="relative group">
                                            <img src={titleImg} alt="Story Cover" className="w-full h-56 object-cover" />
                                            <button
                                                onClick={() => genTitleImage(titleHtml.replace(/<[^>]+>/g, ''))}
                                                className="absolute bottom-3 right-3 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20"
                                                title="Regenerate cover"
                                            >
                                                <RefreshCw className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : null}

                                    {titleHtml && (
                                        <div
                                            className="p-6 text-center text-2xl font-bold text-white"
                                            dangerouslySetInnerHTML={{ __html: titleHtml }}
                                        />
                                    )}
                                </motion.div>
                            )}

                            {/* Paragraphs */}
                            <div className="space-y-4">
                                <AnimatePresence>
                                    {paragraphs.map((para, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.04 }}
                                            className="glass rounded-2xl border border-white/10 p-6 space-y-4"
                                        >
                                            <p className="text-gray-200 text-sm leading-8">{para.text}</p>

                                            {para.imgLoading ? (
                                                <div className="h-32 bg-white/5 rounded-xl flex items-center justify-center">
                                                    <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                                                </div>
                                            ) : para.imageUrl ? (
                                                <div className="relative group">
                                                    <img src={para.imageUrl} alt="Para illustration" className="w-full rounded-xl object-cover max-h-64" />
                                                    <button
                                                        onClick={() => genParaImage(i)}
                                                        className="absolute bottom-2 right-2 p-1.5 bg-black/50 backdrop-blur-sm rounded-full text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <RefreshCw className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => genParaImage(i)}
                                                    className="flex items-center gap-2 text-xs text-purple-400 hover:text-purple-300 transition-colors font-bold"
                                                >
                                                    <ImageIcon className="w-4 h-4" />
                                                    Generate illustration for this paragraph
                                                </button>
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {generating && (
                                    <div className="flex items-center gap-2 px-4 py-3 text-purple-400 text-sm">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="animate-pulse">AI is writing your story…</span>
                                    </div>
                                )}
                            </div>

                            {/* Action buttons */}
                            {hasStory && !generating && (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="flex gap-3"
                                >
                                    <button
                                        onClick={handleCopy}
                                        className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                    >
                                        {copied ? <><CheckCircle className="w-4 h-4 text-green-400" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Story</>}
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        className="flex-1 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        <RotateCcw className="w-4 h-4" /> Reset
                                    </button>
                                </motion.div>
                            )}
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
