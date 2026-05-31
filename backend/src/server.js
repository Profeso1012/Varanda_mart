const app = require('./app');
const { config } = require('./config/env');
const { initializeJobs } = require('./jobs');
const { sql } = require('./config/database');

const server = app.listen(config.port, () => {
  console.log(`[${config.nodeEnv}] Varanda API running on port ${config.port}`);
  console.log(`[cookie] refreshToken: httpOnly=true secure=${config.nodeEnv === 'production'} sameSite=${config.nodeEnv === 'production' ? 'none' : 'lax'} domain=${config.nodeEnv === 'production' ? '.' + config.baseDomain : 'unset'} maxAge=${config.refreshTokenExpiresDays}d`);
  console.log(`[cors] credentials=true baseDomain=${config.baseDomain} sellerDashboard=${config.sellerDashboardUrl}`);
  if (config.nodeEnv !== 'test') {
    initializeJobs();
  }
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  console.log('[server] SIGTERM received — shutting down gracefully');
  server.close(async () => {
    await sql.end();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  server.close(async () => {
    await sql.end();
    process.exit(0);
  });
});
