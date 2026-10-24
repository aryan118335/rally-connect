import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// PostgreSQL Connection Pool
// Reuses connections efficiently for high performance and concurrency
export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'rally',
  user: process.env.DB_USER || 'aryan',
  password: process.env.DB_PASSWORD || '',
  max: 20, // maximum connection pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

// Helper for running parameterized queries
export const query = (text, params) => pool.query(text, params);

export default pool;
