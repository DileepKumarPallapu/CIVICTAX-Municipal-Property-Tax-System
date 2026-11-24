
import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import {
  config,
  getAllowedFrontendOrigins,
} from './config/index.js';
import {
  getRedisClient,
  RedisUnavailableError,
  reportRedisError,
} from './services/redisClient.js';
import { RedisSessionStore } from './services/redisSessionStore.js';
import {
  enforceSessionLifetime,
  SESSION_COOKIE_NAME,
  SESSION_IDLE_TIMEOUT_MS,
} from './middleware/auth.js';
import { authRouter } from './routes/authRoutes.js';
import { salesforceApiRouter } from './routes/salesforceRoutes.js';
import { municipalApiRouter } from './modules/municipalRoutes.js';

export const app = express();

app.set('trust proxy', 1);

const isProduction = config.isProduction;
const allowedOrigins = getAllowedFrontendOrigins(config);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const isAllowed = allowedOrigins.includes(origin);

      if (isAllowed) {
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

const redisClient = getRedisClient(isProduction);

if (!redisClient) {
  console.warn(
    'Redis is not configured. Using the Express in-memory session store for local development.'
  );
}

// Express session middleware
app.use(
  session({
    name: SESSION_COOKIE_NAME,
    secret: config.sessionSecret,
    store: redisClient
      ? new RedisSessionStore(redisClient, 'civictax:sess:', 8 * 60 * 60)
      : undefined,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: SESSION_IDLE_TIMEOUT_MS,
      path: '/',
    },
  })
);
app.use(enforceSessionLifetime);

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
app.get('/health', async (_req, res) => {
  if (redisClient) {
    try {
      await redisClient.ping();
    } catch (error) {
      reportRedisError('health check', error);
      res.status(503).json({
        status: 'UNAVAILABLE',
        service: 'CivicTax Salesforce Gateway',
      });
      return;
    }
  }

  res.json({
    status: 'HEALTHY',
    service: 'CivicTax Salesforce Gateway',
    redis: redisClient ? 'connected' : 'development-memory',
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
    if (err instanceof RedisUnavailableError) {
      console.error('Redis-backed request failed (RedisUnavailableError).');
      return res.status(503).json({
        error: 'SERVICE_UNAVAILABLE',
        message: 'A required storage service is unavailable',
      });
    }

    const errorType =
      err instanceof Error ? err.name : 'UnknownError';
    console.error(`Unhandled server error (${errorType}).`);

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
