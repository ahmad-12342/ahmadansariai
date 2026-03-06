import express from 'express';
import OpenAI from 'openai';
import User from '../models/User.js';
import Generation from '../models/Generation.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─────────────────────────────────────────────────────────────
// Helper: deduct credits & update stats, then save generation
// ─────────────────────────────────────────────────────────────
async function trackUsage(user, { creditCost, storageMB, timeSavedHrs }) {
    user.credits -= creditCost;
    user.totalGenerations += 1;
    user.storageUsed = parseFloat((user.storageUsed + storageMB).toFixed(2));
    user.timeSaved = parseFloat((user.timeSaved + timeSavedHrs).toFixed(2));
    await user.save();
}

// ─────────────────────────────────────────────────────────────
// GET /api/generate/history/:firebaseId  — Recent generations
// ─────────────────────────────────────────────────────────────
router.get('/history/:firebaseId', async (req, res) => {
    try {
        const user = await User.findOne({ firebaseId: req.params.firebaseId });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const generations = await Generation.find({ userId: user._id })
            .sort({ createdAt: -1 }); // No limit — all history permanently preserved

        res.json(generations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
// POST /api/generate/image
// ─────────────────────────────────────────────────────────────
router.post('/image', async (req, res) => {
    const { firebaseId, prompt, style, resolution } = req.body;
    try {
        const user = await User.findOne({ firebaseId });
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.credits < 1) return res.status(403).json({ message: 'Insufficient credits' });

        // Map resolution to DALL-E 3 supported sizes
        let size = '1024x1024';
        if (resolution === '1920x1080') size = '1792x1024';
        if (resolution === '1080x1920') size = '1024x1792';

        const response = await openai.images.generate({
            model: 'dall-e-3',
            prompt: style ? `${prompt}, style: ${style}` : prompt,
            n: 1,
            size,
        });

        const imageUrl = response.data[0].url;

        // Save generation record FIRST
        const generation = new Generation({
            userId: user._id,
            type: 'image',
            prompt,
            resultUrl: imageUrl,
            metadata: { style, resolution },
        });
        await generation.save();

        // Then deduct credits & update stats
        await trackUsage(user, { creditCost: 1, storageMB: 2.5, timeSavedHrs: 1.5 });

        res.json({
            imageUrl,
            creditsRemaining: user.credits,
            totalGenerations: user.totalGenerations,
            storageUsed: user.storageUsed,
            timeSaved: user.timeSaved,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
// POST /api/generate/video
// ─────────────────────────────────────────────────────────────
router.post('/video', async (req, res) => {
    const { firebaseId, prompt, duration } = req.body;
    try {
        const user = await User.findOne({ firebaseId });
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.credits < 5) return res.status(403).json({ message: 'Insufficient credits (need 5 for video)' });

        // Using replicate for video (e.g. Stable Video Diffusion or similar model)
        // Returning placeholder until actual model token is configured
        const videoUrl = `https://placeholder-video.com/result_${Date.now()}.mp4`;

        const generation = new Generation({
            userId: user._id,
            type: 'video',
            prompt,
            resultUrl: videoUrl,
            metadata: { duration },
        });
        await generation.save();

        await trackUsage(user, { creditCost: 5, storageMB: 50, timeSavedHrs: 5 });

        res.json({
            videoUrl,
            creditsRemaining: user.credits,
            totalGenerations: user.totalGenerations,
            storageUsed: user.storageUsed,
            timeSaved: user.timeSaved,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
// POST /api/generate/cv
// ─────────────────────────────────────────────────────────────
router.post('/cv', async (req, res) => {
    const { firebaseId, name, title, experience, skills, education, summary } = req.body;
    try {
        const user = await User.findOne({ firebaseId });
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.credits < 3) return res.status(403).json({ message: 'Insufficient credits (need 3 for CV)' });

        const cvPrompt = `
Create a professional, ATS-optimized CV in clean HTML format for:
Name: ${name}
Title: ${title}
Summary: ${summary}
Experience: ${experience}
Skills: ${skills}
Education: ${education}

Return only the HTML content inside a <div> tag, no markdown, no explanation.
        `.trim();

        const completion = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [{ role: 'user', content: cvPrompt }],
        });

        const cvHtml = completion.choices[0].message.content;

        const generation = new Generation({
            userId: user._id,
            type: 'cv',
            prompt: `CV for ${name} - ${title}`,
            textContent: cvHtml,
            metadata: { template: 'professional' },
        });
        await generation.save();

        await trackUsage(user, { creditCost: 3, storageMB: 0.2, timeSavedHrs: 4 });

        res.json({
            cvHtml,
            creditsRemaining: user.credits,
            totalGenerations: user.totalGenerations,
            storageUsed: user.storageUsed,
            timeSaved: user.timeSaved,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
// POST /api/generate/content  — Blog / Script / Code
// ─────────────────────────────────────────────────────────────
router.post('/content', async (req, res) => {
    const { firebaseId, prompt, contentType } = req.body;
    try {
        const user = await User.findOne({ firebaseId });
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.credits < 2) return res.status(403).json({ message: 'Insufficient credits (need 2 for content)' });

        const systemMsg = contentType === 'code'
            ? 'You are an expert software engineer. Write clean, well-commented code.'
            : contentType === 'script'
                ? 'You are a professional scriptwriter. Write engaging, well-structured scripts.'
                : 'You are a professional content writer. Write engaging, SEO-optimized blog posts.';

        const completion = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
                { role: 'system', content: systemMsg },
                { role: 'user', content: prompt },
            ],
        });

        const resultText = completion.choices[0].message.content;

        const generation = new Generation({
            userId: user._id,
            type: 'content',
            prompt,
            textContent: resultText,
            metadata: { type: contentType },
        });
        await generation.save();

        await trackUsage(user, { creditCost: 2, storageMB: 0.1, timeSavedHrs: 3 });

        res.json({
            text: resultText,
            creditsRemaining: user.credits,
            totalGenerations: user.totalGenerations,
            storageUsed: user.storageUsed,
            timeSaved: user.timeSaved,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
