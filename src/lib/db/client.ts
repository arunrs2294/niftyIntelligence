import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set');
  return new Pool({ connectionString });
}

// Reuse pool across hot-reloads in dev
const pool: Pool = globalThis._pgPool ?? createPool();
if (process.env.NODE_ENV !== 'production') globalThis._pgPool = pool;

export default pool;
