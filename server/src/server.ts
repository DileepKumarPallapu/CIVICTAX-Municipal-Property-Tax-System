import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { config } from './config/index.js';
import { authRouter } from './routes/authRoutes.js';
import { salesforceApiRouter } from './routes/salesforceRoutes.js';
import { municipalApiRouter } from './modules/municipalRoutes.js';

const app = express();

// CORS setup allowing only designated React origin with credentials
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Express Session Setup with HttpOnly cookies
app.use(
  session({
    name: 'civictax.sid',
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    },
  })
);

// Mount Routers
app.use(authRouter);
app.use(salesforceApiRouter);
app.use(municipalApiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'CivicTax Salesforce Gateway',
    timestamp: new Date().toISOString(),
  });
});

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`CivicTax Salesforce Gateway running on http://localhost:${PORT}`);
  console.log(`Frontend Origin: ${config.frontendUrl}`);
  console.log(`Salesforce Login URL: ${config.salesforce.loginUrl}`);
});
