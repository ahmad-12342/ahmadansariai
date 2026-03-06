import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import generationRoutes from './routes/generation.js';
import paymentRoutes from './routes/payment.js';
import aiToolsRoutes from './routes/aiTools.js';

// Load env variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(helmet({
    crossOriginResourcePolicy: false
}));
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/generate', generationRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/ai-tools', aiToolsRoutes);

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Routes placeholder
app.get('/', (req, res) => {
    res.json({ message: 'Promptova AI API is running' });
});

// Start Server ONLY if not running in production/serverless environment
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
}

// Export the app for Vercel Serverless Functions
export default app;
