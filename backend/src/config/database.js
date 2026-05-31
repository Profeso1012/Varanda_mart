const postgres = require('postgres');
const { config } = require('./env');

const sql = postgres(config.databaseUrl, {
  max: 10,
  idle_timeout: 30,
  connect_timeout: 10,
  ssl: config.nodeEnv === 'production' ? { rejectUnauthorized: true } : { rejectUnauthorized: false },
  onnotice: () => {},
});

/**
 * Wraps a function in a postgres transaction.
 * Usage: await withTransaction(async (tx) => { ... })
 */
const withTransaction = (fn) => sql.begin(fn);

module.exports = { sql, withTransaction };
