import 'dotenv/config';
import { resolve } from 'path';
import { config } from 'dotenv';

// Load .env.local for standalone script
config({ path: resolve(process.cwd(), '.env.local') });

import { Pool } from 'pg';

async function init() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS daily_analysis (
      id            SERIAL PRIMARY KEY,
      date          DATE UNIQUE NOT NULL,
      trend         JSONB,
      levels        JSONB,
      options       JSONB,
      gap           JSONB,
      event_context JSONB,
      candle_insights JSONB,
      scenarios     JSONB,
      bias          JSONB,
      trade_plan    JSONB,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS trader_journal (
      date       DATE PRIMARY KEY,
      notes      TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS option_snapshots (
      id          SERIAL PRIMARY KEY,
      expiry_date DATE NOT NULL,
      strikes     JSONB NOT NULL,
      captured_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS risk_config (
      id                      SERIAL PRIMARY KEY,
      daily_sl_limit          NUMERIC NOT NULL DEFAULT 15000,
      max_risk_per_trade      NUMERIC NOT NULL DEFAULT 7000,
      max_consecutive_losses  INT     NOT NULL DEFAULT 3,
      max_buy_trades_per_day  INT     NOT NULL DEFAULT 5,
      max_sell_trades_per_day INT     NOT NULL DEFAULT 5,
      allow_otm               BOOLEAN NOT NULL DEFAULT false,
      trading_enabled         BOOLEAN NOT NULL DEFAULT true,
      updated_at              TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Seed defaults only if table is empty
  await pool.query(`
    INSERT INTO risk_config (daily_sl_limit, max_risk_per_trade, max_consecutive_losses,
                             max_buy_trades_per_day, max_sell_trades_per_day, allow_otm, trading_enabled)
    SELECT 15000, 7000, 3, 5, 5, false, true
    WHERE NOT EXISTS (SELECT 1 FROM risk_config);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS daily_risk_state (
      date                DATE PRIMARY KEY,
      realized_pnl        NUMERIC NOT NULL DEFAULT 0,
      buy_trades_count    INT     NOT NULL DEFAULT 0,
      sell_trades_count   INT     NOT NULL DEFAULT 0,
      consecutive_losses  INT     NOT NULL DEFAULT 0,
      is_locked           BOOLEAN NOT NULL DEFAULT false,
      lock_reason         TEXT,
      updated_at          TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS trade_log (
      id                   SERIAL PRIMARY KEY,
      date                 DATE        NOT NULL,
      fyers_order_id       TEXT UNIQUE NOT NULL,
      symbol               TEXT        NOT NULL,
      strike               INT,
      option_type          CHAR(2),
      side                 INT         NOT NULL,
      qty                  INT         NOT NULL,
      product_type         TEXT        NOT NULL,
      order_type           INT         NOT NULL,
      entry_price          NUMERIC,
      stop_price           NUMERIC,
      target_price         NUMERIC,
      risk_amount          NUMERIC,
      capital_deployed     NUMERIC,
      spot_price_at_entry  NUMERIC,
      executed_at          TIMESTAMPTZ,
      exit_price           NUMERIC,
      pnl                  NUMERIC,
      rr_realized          NUMERIC,
      status               TEXT        NOT NULL DEFAULT 'OPEN',
      is_sl_leg            BOOLEAN     NOT NULL DEFAULT false,
      is_system_exit       BOOLEAN     NOT NULL DEFAULT false,
      validation_passed    BOOLEAN,
      block_reason         TEXT,
      raw_payload          JSONB,
      created_at           TIMESTAMPTZ DEFAULT NOW(),
      updated_at           TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Add new columns to existing installs without dropping the table
  const newCols = [
    'ALTER TABLE trade_log ADD COLUMN IF NOT EXISTS target_price        NUMERIC',
    'ALTER TABLE trade_log ADD COLUMN IF NOT EXISTS capital_deployed    NUMERIC',
    'ALTER TABLE trade_log ADD COLUMN IF NOT EXISTS spot_price_at_entry NUMERIC',
    'ALTER TABLE trade_log ADD COLUMN IF NOT EXISTS executed_at         TIMESTAMPTZ',
    'ALTER TABLE trade_log ADD COLUMN IF NOT EXISTS rr_realized         NUMERIC',
  ];
  for (const sql of newCols) await pool.query(sql);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS system_exit_orders (
      fyers_order_id TEXT PRIMARY KEY,
      created_at     TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  console.log('✅ Tables created: daily_analysis, trader_journal, option_snapshots, risk_config, daily_risk_state, trade_log, system_exit_orders');
  await pool.end();
}

init().catch((err) => {
  console.error('DB init failed:', err.message);
  process.exit(1);
});
