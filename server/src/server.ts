import { app } from './app.js';
import { config } from './config/index.js';

const PORT = config.port;

// Only start listening server when executed directly (local development or standalone node process)
// Avoid starting a permanent listening server when loaded as a Vercel Serverless Function
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`CivicTax Salesforce Gateway running on http://localhost:${PORT}`);
    console.log(`Frontend Origin: ${config.frontendUrl}`);
    console.log(`Salesforce Login URL: ${config.salesforce.loginUrl}`);
  });
}

export { app };
export default app;
