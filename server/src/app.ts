
import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { RedisStore } from 'connect-redis';
import { createClient } from 'redis';

import { config } from './config/index.js';
import { authRouter } from './routes/authRoutes.js';
import { salesforceApiRouter } from './routes/salesforceRoutes.js';
import { municipalApiRouter } from './modules/municipalRoutes.js';

export const app = express();

app.set('trust proxy', 1);

const isProduction =
  config.nodeEnv === 'production' || Boolean(process.env.VERCEL);

const allowedOrigins = [
  config.frontendUrl,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const isAllowed = allowedOrigins.includes(origin);

      const isVercelPreview =
        origin.endsWith('.vercel.app') &&
        (config.frontendUrl.includes('vercel.app') ||
          config.nodeEnv === 'production');

      if (isAllowed || isVercelPreview) {
        return callback(null, true);
      }

      return callback(new Error('Origin not allowed by CivicTax CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'x-civictax-csrf',
    ],
  })
);

app.use(express.json());
app.use(cookieParser());

// Redis session configuration
let sessionStore: session.Store | undefined;
let redisReady: Promise<void> | undefined;
let redisConnectionError: unknown;

if (config.redisUrl) {
  const redisClient = createClient({
    url: config.redisUrl,
    socket: {
      reconnectStrategy: (retries) =>
        Math.min(retries * 500, 5000),
    },
  });

  redisClient.on('error', (error) => {
    console.error('Redis session client error:', error.message);
  });

  redisClient.on('ready', () => {
    console.log('CivicTax Redis session client ready');
  });

  redisReady = redisClient
    .connect()
    .then(() => {
      console.log('CivicTax Redis session connection established');
    })
    .catch((error: unknown) => {
      redisConnectionError = error;
      console.error('Redis initial connection failed:', error);
    });

  sessionStore = new RedisStore({
    client: redisClient,
    prefix: 'civictax:sess:',
    ttl: 8 * 60 * 60,
  });
} else if (isProduction) {
  throw new Error(
    'REDIS_URL is required in production. Configure Redis before starting CivicTax.'
  );
} else {
  console.warn(
    'REDIS_URL is not configured. Using the Express in-memory session store for local development.'
  );
}

// Ensure Redis is ready before processing session requests.
if (redisReady) {
  app.use(async (_req, _res, next) => {
    await redisReady;

    if (redisConnectionError) {
      return next(redisConnectionError);
    }

    next();
  });
}

// Express session middleware
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
      maxAge: 8 * 60 * 60 * 1000,
      path: '/',
    },
  })
);

// Application routers
app.use(authRouter);
app.use(salesforceApiRouter);
app.use(municipalApiRouter);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'CivicTax Municipal Backend Gateway',
    version: '1.0.0',
    environment: config.nodeEnv,
    salesforceLoginUrl: config.salesforce.loginUrl,
    timestamp: new Date().toISOString(),
  });
});

// Health endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'CivicTax Salesforce Gateway',
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error('Unhandled server error:', err);

    if (res.headersSent) {
      return next(err);
    }

    res.status(err.status || 500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: isProduction
        ? 'An unexpected error occurred'
        : err.message,
    });
  }
);

export default app;
