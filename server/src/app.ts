import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { RedisStore } from 'connect-redis';
import { Redis } from 'ioredis';
import { config } from './config/index.js';
import { authRouter } from './routes/authRoutes.js';
import { salesforceApiRouter } from './routes/salesforceRoutes.js';
import { municipalApiRouter } from './modules/municipalRoutes.js';

export const app = express();

// Trust proxy header when running behind Vercel / reverse proxy
app.set('trust proxy', 1);

// Configure CORS for local development and production Vercel frontend domains
const allowedOrigins = [
  config.frontendUrl,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman, or server-to-server)
      if (!origin) return callback(null, true);

      // Match configured frontendUrl or localhost
      const isAllowed = allowedOrigins.some(
        (allowed) => origin === allowed || origin.startsWith(allowed)
      );

      // Match Vercel preview deployment URLs if frontendUrl is hosted on Vercel
      const isVercelPreview =
        origin.endsWith('.vercel.app') &&
        (config.frontendUrl.includes('vercel.app') || config.nodeEnv === 'production');

      if (isAllowed || isVercelPreview) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-civictax-csrf'],
  })
);

app.use(express.json());
app.use(cookieParser());

// Express Session Setup with Durable Redis Store in Production / Ephemeral fallback in Local
const isProduction = config.nodeEnv === 'production' || Boolean(process.env.VERCEL);

let sessionStore: session.Store | undefined = undefined;
if (config.redisUrl) {
  try {
    const redisClient = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      lazyConnect: true,
    });
    redisClient.connect().catch((err: Error) => {
      console.warn('CivicTax Gateway: Redis connection attempt encountered error:', err.message);
    });
    sessionStore = new RedisStore({
      client: redisClient,
      prefix: 'civictax:sess:',
      ttl: 8 * 60 * 60, // 8 hours in seconds
    });
    console.info('CivicTax Gateway: Configured durable Redis session store for Vercel Serverless clustering.');
  } catch (err: any) {
    console.warn('CivicTax Gateway: Failed to initialize RedisStore, falling back to local memory store:', err.message);
  }
} else {
  if (isProduction) {
    console.warn(
      'CivicTax Gateway WARNING: REDIS_URL not configured in production environment. ' +
      'Serverless functions require REDIS_URL (e.g., Upstash Redis) for cross-instance session persistence. ' +
      'Falling back to MemoryStore.'
    );
  }
}

app.use(
  session({
    name: 'civictax.sid',
    secret: config.sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    },
  })
);

// Mount Routers
app.use(authRouter);
app.use(salesforceApiRouter);
app.use(municipalApiRouter);

// Service Root and Health Endpoints
app.get('/', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'CivicTax Municipal Backend Gateway',
    version: '1.0.0',
    environment: config.nodeEnv,
    salesforceLoginUrl: config.salesforce.loginUrl,
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'CivicTax Salesforce Gateway',
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: isProduction ? 'An unexpected error occurred' : err.message,
  });
});

export default app;
