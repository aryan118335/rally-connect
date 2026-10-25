import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool, { query } from './db.js';
import authRoutes from './routes/authRoutes.js';
import communityRoutes from './routes/communityRoutes.js';
import postRoutes from './routes/postRoutes.js';
import voteRoutes from './routes/voteRoutes.js';
import commentRoutes from './routes/commentRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health-check endpoint: verifies backend and database connectivity
app.get('/api/health', async (req, res) => {
  try {
    const dbResult = await query('SELECT NOW() as current_time, current_database() as database');
    res.json({
      status: 'ok',
      service: 'rally-backend',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        database: dbResult.rows[0].database,
        serverTime: dbResult.rows[0].current_time
      }
    });
  } catch (err) {
    console.error('Database health check failed:', err);
    res.status(500).json({
      status: 'error',
      service: 'rally-backend',
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        error: err.message
      }
    });
  }
});

// Route handlers
app.use('/api/auth', authRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/comments', commentRoutes);

// Central error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start listening if run directly
const server = app.listen(PORT, () => {
  console.log(`🚀 Rally Express backend running on http://localhost:${PORT}`);
  console.log(`📡 Health check available at http://localhost:${PORT}/api/health`);
});

export default app;
