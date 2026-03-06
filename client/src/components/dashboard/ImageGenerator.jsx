"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ImageIcon, Download, Sparkles, Wand2, RefreshCw, Upload, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { saveGeneration, checkDailyLimit } from '@/lib/firestoreService';

const styles = [
    { id: 'realistic', label: 'Realistic', icon: '📸' },
    { id: 'anime', label: 'Anime', icon: '🎨' },
    { id: 'cinematic', label: 'Cinematic', icon: '🎬' },
    { id: '3d', label: '3D Render', icon: '🧊' },
    { id: 'pixel', label: 'Pixel Art', icon: '👾' },
];

const resolutions = ['512x512', '1024x1024', '1920x1080', '1080x1920'];

const ImageGenerator = () => {
    const { user, refreshStats } = useAuth();
    const [prompt, setPrompt] = useState('');
    const [selectedStyle, setSelectedStyle] = useState('realistic');
    const [resolution, setResolution] = useState('1024x1024');
    const [generating, setGenerating] = useState(false);
    const [refining, setRefining] = useState(false);
    const [result, setResult] = useState(null);
    const [referenceImage, setReferenceImage] = useState(null);
    const [status, setStatus] = useState('');
    const [imageLoading, setImageLoading] = useState(false);
    const [loadingTimeoutId, setLoadingTimeoutId] = useState(null);

    const handleRefinePrompt = async () => {
        if (!prompt.trim() || refining) return;
        setRefining(true);
        try {
            const response = await fetch('/api/ai-tools/refine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, type: 'image' })
            });
            const data = await response.json();

            if (response.status === 422) {
                alert(data.message);
                return;
            }

            if (data.refinedPrompt) {
                setPrompt(data.refinedPrompt);
            }
        } catch (error) {
            console.error("Refinement failed:", error);
        } finally {
            setRefining(false);
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim() && !referenceImage) return;

        // ✅ Check Login and Daily Limits
        if (!user) {
            alert("Bina login kare aap image generate nahi kar sakte. Please login ya signup karein!");
            window.location.href = '/login';
            return;
        }

        const limitCheck = await checkDailyLimit(user.uid, 'image');
        if (!limitCheck.allowed) {
            alert(limitCheck.message);
            return;
        }

        console.log("Generating with OpenAI DALL-E...");
        setGenerating(true);
        setResult(null);
        setImageLoading(true);

        try {
            const userPrompt = prompt.trim() || 'beautiful scenery';
            const finalPrompt = `${selectedStyle} style, ${userPrompt}, intricate, 4k resolution`;

            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: finalPrompt,
                    resolution: resolution
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error("OpenAI error string:", data.error);
                throw new Error(data.error || 'Failed to generate');
            }

            const imageUrl = data.url;
            setResult(imageUrl);

            // ✅ Save to Firestore + refresh dashboard stats
            if (user) {
                await saveGeneration({
                    uid: user.uid,
                    type: 'image',
                    prompt: finalPrompt,
                    resultUrl: imageUrl,
                    metadata: { style: selectedStyle, resolution },
                    creditCost: 1,
                    storageMB: 2.5,
                    timeSavedHrs: 1.5,
                });
                refreshStats(); // Update dashboard stats live
            }
        } catch (error) {
            console.error("Image generation failed:", error);
            alert("Oops! Image generation failed: " + error.message);
            setImageLoading(false);
        } finally {
            setGenerating(false);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setReferenceImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDownload = async () => {
        if (!result) return;
        try {
            const response = await fetch(result);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `promptova-ai-image-${Date.now()}.jpg`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            window.open(result, '_blank');
        }
    };

    const handleRegenerate = () => {
        handleGenerate();
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12">
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-blue-500/20">
                    <Sparkles className="w-3 h-3" />
                    Neural Vision Engine
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">What will you <span className="text-gradient">imagine</span> today?</h1>
                <p className="text-gray-400 max-w-xl mx-auto">Enter a prompt and watch the AI bring your vision to life in high resolution.</p>
            </motion.header>

            <div className="space-y-12">
                {/* Modern Prompt Input */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="max-w-4xl mx-auto"
                >
                    <div className="glass p-2 rounded-[2rem] border border-white/10 shadow-2xl focus-within:border-primary/50 transition-all flex flex-col md:flex-row items-center gap-2">
                        <div className="flex-1 flex items-center px-6 w-full">
                            <ImageIcon className="w-6 h-6 text-gray-400 mr-4" />
                            {referenceImage && (
                                <div className="relative w-12 h-12 mr-4 group">
                                    <img src={referenceImage} alt="Ref" className="w-full h-full object-cover rounded-lg border border-white/20" />
                                    <button
                                        onClick={() => setReferenceImage(null)}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                                placeholder={referenceImage ? "Describe how to modify this image..." : "A cinematic shot of a neon-lit futuristic Tokyo street in the rain..."}
                                className="w-full bg-transparent border-none outline-none py-6 text-lg text-white placeholder:text-gray-600"
                            />
                            <div className="flex items-center gap-1 mr-2">
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleRefinePrompt}
                                    disabled={refining || !prompt.trim()}
                                    title="Magic Prompt Refiner"
                                    className="p-3 hover:bg-white/10 rounded-full transition-all group relative"
                                >
                                    <Wand2 className={`w-5 h-5 ${refining ? 'animate-pulse text-primary' : 'text-gray-400 group-hover:text-primary'}`} />
                                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        Refine Prompt
                                    </span>
                                </motion.button>
                                <label className="cursor-pointer p-3 hover:bg-white/10 rounded-full transition-all group relative">
                                    <Upload className="w-5 h-5 text-gray-400 group-hover:text-primary" />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        Reference Image
                                    </span>
                                </label>
                            </div>
                        </div>
                        <button
                            onClick={handleGenerate}
                            disabled={generating || (!prompt && !referenceImage)}
                            className="w-full md:w-auto px-10 py-5 rounded-[1.5rem] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20 disabled:opacity-50"
                        >
                            {generating ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-5 h-5" />
                                    {referenceImage ? 'Variation' : 'Generate'}
                                </>
                            )}
                        </button>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3 mt-6">
                        {styles.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setSelectedStyle(s.id)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${selectedStyle === s.id
                                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                                    : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/20'
                                    }`}
                            >
                                <span className="mr-2">{s.icon}</span>
                                {s.label}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Result Section */}
                <div className="max-w-4xl mx-auto">
                    <div className="relative aspect-video rounded-[2.5rem] overflow-hidden glass border border-white/10 group shadow-2xl">
                        {result ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="w-full h-full relative"
                            >
                                <img
                                    key={result}
                                    src={result}
                                    alt="Result"
                                    className="w-full h-full object-contain relative z-10 block"
                                    onLoad={() => setImageLoading(false)}
                                    onError={() => setImageLoading(false)}
                                />

                                {/* HIGH VISIBILITY BUTTONS */}
                                <div className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-none">
                                    {imageLoading && (
                                        <div className="bg-black/80 p-8 rounded-[2rem] border border-white/10 backdrop-blur-xl flex flex-col items-center pointer-events-auto shadow-2xl">
                                            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                                            <p className="text-white font-bold mb-6 animate-pulse">GENERATING YOUR MASTERPIECE...</p>
                                            <a
                                                href={result}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-black uppercase text-sm shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all flex items-center gap-3 scale-110"
                                            >
                                                <Sparkles className="w-5 h-5" />
                                                See Result Immediately
                                            </a>
                                            <p className="text-gray-500 text-[10px] mt-4 uppercase tracking-tighter">Click if dashboard stays empty</p>
                                        </div>
                                    )}
                                </div>

                                <div className="absolute bottom-6 right-6 z-50 flex gap-3">
                                    <button
                                        onClick={handleDownload}
                                        className="bg-white/10 hover:bg-white/20 text-white p-4 rounded-full backdrop-blur-md border border-white/10 transition-all"
                                    >
                                        <Download className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleGenerate()}
                                        className="bg-white text-black px-6 py-4 rounded-full font-bold shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                                    >
                                        <RefreshCw className="w-5 h-5" />
                                        Re-Imagine
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                                {generating ? (
                                    <div className="space-y-6 flex flex-col items-center">
                                        <div className="relative w-24 h-24">
                                            <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                                            <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-blue-500 animate-pulse" />
                                        </div>
                                        <div>
                                            <p className="text-xl font-bold mb-2 animate-pulse text-white">Dreaming up your image...</p>
                                            <p className="text-gray-500 text-sm">Synthesizing pixels using Neural Vision Core</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4 opacity-30">
                                        <ImageIcon className="w-24 h-24 mx-auto text-gray-400" />
                                        <p className="text-xl font-medium max-w-xs mx-auto text-gray-400">Your masterpiece will manifest here after you enter a prompt.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageGenerator;
