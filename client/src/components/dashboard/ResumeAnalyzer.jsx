"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Upload, Sparkles, ChevronLeft, ChevronRight,
    Loader2, CheckCircle, User, Briefcase, GraduationCap,
    MessageSquare, AlertCircle, X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { saveGeneration, checkDailyLimit } from '@/lib/firestoreService';

export default function ResumeAnalyzer() {
    const { user, refreshStats } = useAuth();
    const [pdfDoc, setPdfDoc] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [resumeText, setResumeText] = useState('');
    const [fileName, setFileName] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [output, setOutput] = useState('');
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');
    const [pdfLoaded, setPdfLoaded] = useState(false);

    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    // ── Load PDF.js from CDN ──
    useEffect(() => {
        if (window.pdfjsLib) { setPdfLoaded(true); return; }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.min.js';
        script.onload = () => {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.worker.min.js';
            setPdfLoaded(true);
        };
        document.head.appendChild(script);
    }, []);

    // ── Render page on canvas ──
    const renderPage = useCallback(async (doc, pageNum) => {
        if (!doc || !canvasRef.current) return;
        const page = await doc.getPage(pageNum);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const viewport = page.getViewport({ scale: 1.4 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: ctx, viewport }).promise;
    }, []);

    useEffect(() => {
        if (pdfDoc) renderPage(pdfDoc, currentPage);
    }, [pdfDoc, currentPage, renderPage]);

    // ── Handle file upload ──
    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !pdfLoaded) return;
        setError('');
        setOutput('');
        setDone(false);
        setFileName(file.name);

        try {
            const buffer = await file.arrayBuffer();
            const doc = await window.pdfjsLib.getDocument({ data: buffer }).promise;
            setPdfDoc(doc);
            setCurrentPage(1);

            let text = '';
            for (let i = 1; i <= doc.numPages; i++) {
                const page = await doc.getPage(i);
                const content = await page.getTextContent();
                text += content.items.map(item => item.str).join(' ') + ' ';
            }
            setResumeText(text.trim());
        } catch (err) {
            setError("Couldn't read this PDF. Please try another file.");
            console.error(err);
        }
    };

    // ── Analyze via WebSocket streaming ──
    const handleAnalyze = async () => {
        if (!resumeText.trim()) {
            setError('No text extracted. Please upload a valid PDF.');
            return;
        }

        if (!user) {
            setError('Bina login kare aap resume analyze nahi kar sakte. Please login ya signup karein!');
            return;
        }

        const limitCheck = await checkDailyLimit(user.uid, 'resume');
        if (!limitCheck.allowed) {
            setError(limitCheck.message);
            return;
        }

        setAnalyzing(true);
        setOutput('');
        setDone(false);
        setError('');

        const prompt =
            `Analyze the given resume text and return:
1. GPA (if mentioned)
2. Years of experience
3. A 1-sentence summary of the candidate
4. A list of initial screening questions

Resume text: ${resumeText}`;

        const ws = new WebSocket('wss://backend.buildpicoapps.com/ask_ai_streaming_v2');
        ws.addEventListener('open', () => {
            ws.send(JSON.stringify({ appId: 'candidate-finish', prompt }));
        });
        ws.addEventListener('message', (e) => {
            setOutput(prev => prev + e.data);
        });
        ws.addEventListener('close', async (e) => {
            setAnalyzing(false);
            if (e.code === 1000) {
                setDone(true);
                // Save to Firestore
                if (user) {
                    await saveGeneration({
                        uid: user.uid,
                        type: 'resume',
                        prompt: `Resume analysis for ${fileName}`,
                        textContent: output,
                        creditCost: 5,
                        storageMB: 0.5,
                        timeSavedHrs: 1
                    });
                    refreshStats();
                }
            }
            else setError('Connection closed unexpectedly. Please try again.');
        });
        ws.addEventListener('error', () => {
            setAnalyzing(false);
            setError('WebSocket error. Please refresh and try again.');
        });
    };

    const numPages = pdfDoc?.numPages || 0;

    return (
        <div className="max-w-7xl mx-auto space-y-8">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-500/10 text-pink-400 rounded-full text-xs font-bold uppercase tracking-wider mb-3 border border-pink-500/20">
                    <FileText className="w-3 h-3" />
                    AI Resume Intelligence
                </div>
                <h1 className="text-4xl font-bold mb-2">
                    Resume <span className="text-gradient">Analyzer</span>
                </h1>
                <p className="text-gray-400">Upload your PDF resume — AI will extract insights, experience, and interview questions instantly.</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* LEFT — Upload + Output */}
                <div className="space-y-6">

                    {/* Upload Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass rounded-[2rem] border border-white/10 p-8 space-y-6"
                    >
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <Upload className="w-5 h-5 text-pink-400" /> Upload Resume
                        </h2>

                        {/* Drop zone */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`cursor-pointer border-2 border-dashed rounded-2xl p-10 text-center transition-all
                                ${fileName
                                    ? 'border-pink-500/40 bg-pink-500/5'
                                    : 'border-white/10 hover:border-pink-500/40 hover:bg-pink-500/5'
                                }`}
                        >
                            <FileText className={`w-12 h-12 mx-auto mb-3 ${fileName ? 'text-pink-400' : 'text-gray-600'}`} />
                            {fileName ? (
                                <>
                                    <p className="text-pink-400 font-bold text-sm">{fileName}</p>
                                    <p className="text-gray-500 text-xs mt-1">Click to change file</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-gray-300 font-bold">Click to upload PDF</p>
                                    <p className="text-gray-500 text-xs mt-1">Only PDF files supported</p>
                                </>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={handleFile}
                        />

                        {error && (
                            <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        {resumeText && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={handleAnalyze}
                                disabled={analyzing}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold transition-all flex items-center justify-center gap-3 shadow-lg shadow-pink-500/20 disabled:opacity-60"
                            >
                                {analyzing
                                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing Resume…</>
                                    : <><Sparkles className="w-5 h-5" /> Analyze with AI</>
                                }
                            </motion.button>
                        )}
                    </motion.div>

                    {/* AI Output */}
                    <AnimatePresence>
                        {(output || analyzing) && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="glass rounded-[2rem] border border-white/10 p-8 space-y-4"
                            >
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-purple-400" /> AI Analysis
                                    </h2>
                                    {done && (
                                        <span className="flex items-center gap-1.5 text-xs text-green-400 font-bold">
                                            <CheckCircle className="w-4 h-4" /> Complete
                                        </span>
                                    )}
                                    {analyzing && (
                                        <span className="flex items-center gap-1.5 text-xs text-pink-400 font-bold animate-pulse">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Streaming…
                                        </span>
                                    )}
                                </div>

                                <div className="no-scrollbar max-h-80 overflow-y-auto bg-black/20 rounded-2xl p-6 text-sm text-gray-300 leading-7 whitespace-pre-wrap border border-white/5">
                                    {output || (
                                        <div className="flex gap-1.5 items-center text-gray-500">
                                            <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* RIGHT — PDF Preview */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass rounded-[2rem] border border-white/10 p-6 flex flex-col"
                >
                    <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-blue-400" /> PDF Preview
                    </h2>

                    {!pdfDoc ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-20 opacity-30">
                            <FileText className="w-20 h-20 text-gray-500 mb-4" />
                            <p className="text-gray-400 font-medium">Upload a PDF to preview it here</p>
                        </div>
                    ) : (
                        <>
                            {/* Canvas container */}
                            <div className="no-scrollbar flex-1 overflow-y-auto bg-black/30 rounded-2xl border border-white/5 flex items-center justify-center" style={{ minHeight: 400 }}>
                                <canvas
                                    ref={canvasRef}
                                    className="max-w-full rounded-xl shadow-2xl"
                                />
                            </div>

                            {/* Page controls */}
                            {numPages > 1 && (
                                <div className="flex items-center justify-center gap-4 mt-5">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage <= 1}
                                        className="p-2.5 rounded-xl glass border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <span className="text-sm font-bold text-gray-300 px-4">
                                        Page {currentPage} <span className="text-gray-600">/ {numPages}</span>
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                                        disabled={currentPage >= numPages}
                                        className="p-2.5 rounded-xl glass border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
