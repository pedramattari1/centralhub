import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { validateEnv, env } from './lib/env.js';
import { clerkAuth } from './middleware/clerkAuth.js';

import authRoutes from './routes/auth.js';
import meRoutes from './routes/me.js';
import platformRoutes from './routes/platforms.js';
import categoryRoutes from './routes/categories.js';
import preferenceRoutes from './routes/preferences.js';
import recentlyUsedRoutes from './routes/recentlyUsed.js';
import adminRoutes from './routes/admin.js';

validateEnv();

const app = express();
app.set('trust proxy', 1); // behind Railway's proxy - needed for rate limiting

// CORS: only the configured frontend origin may call the API.
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());

// Health check for Railway - must not depend on Clerk, so mount before it.
app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));

app.use(clerkAuth); // verifies Clerk JWT (if present) on every API request

// Rate limiters for sensitive routes.
const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
const adminLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false });

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/me', meRoutes);
app.use('/api/platforms', platformRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/preferences', preferenceRoutes);
app.use('/api/recently-used', recentlyUsedRoutes);
app.use('/api/admin', adminLimiter, adminRoutes);

// 404 for unmatched API routes.
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// Central error handler.
app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(env.PORT, () => {
  console.log(`[CentralHub] API listening on port ${env.PORT}`);
});
