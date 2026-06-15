import pool from '@/lib/db/client';

export interface TradeLog {
  id: number;
  date: string;
  fyers_order_id: string;
  symbol: string;
  strike: number | null;
  option_type: string | null;
  side: number;
  qty: number;
  product_type: string;
  order_type: number;
  entry_price: number | null;
  stop_price: number | null;
  target_price: number | null;
  risk_amount: number | null;
  capital_deployed: number | null;
  spot_price_at_entry: number | null;
  executed_at: Date | null;
  exit_price: number | null;
  pnl: number | null;
  rr_realized: number | null;
  status: string;
  is_sl_leg: boolean;
  is_system_exit: boolean;
  validation_passed: boolean | null;
  block_reason: string | null;
  raw_payload: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

function getISTDate(): string {
  const istMs = Date.now() + 5.5 * 60 * 60 * 1000;
  return new Date(istMs).toISOString().split('T')[0];
}

// Parses Fyers orderDateTime string ("28-May-2026 10:30:45", IST) into a Date
function parseFyersDateTime(dt: string | undefined): Date | null {
  if (!dt) return null;
  const d = new Date(dt + ' GMT+0530');
  return isNaN(d.getTime()) ? null : d;
}

export async function logTrade(trade: {
  fyers_order_id: string;
  symbol: string;
  strike?: number;
  option_type?: string;
  side: number;
  qty: number;
  product_type: string;
  order_type: number;
  entry_price?: number;
  stop_price?: number;
  target_price?: number;
  risk_amount?: number;
  capital_deployed?: number;
  spot_price_at_entry?: number;
  executed_at?: string;
  status?: string;
  is_sl_leg?: boolean;
  is_system_exit?: boolean;
  validation_passed?: boolean;
  block_reason?: string;
  raw_payload?: Record<string, unknown>;
}): Promise<void> {
  const today = getISTDate();
  await pool.query(
    `INSERT INTO trade_log
       (date, fyers_order_id, symbol, strike, option_type, side, qty, product_type, order_type,
        entry_price, stop_price, target_price, risk_amount, capital_deployed,
        spot_price_at_entry, executed_at, status, is_sl_leg, is_system_exit,
        validation_passed, block_reason, raw_payload)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
     ON CONFLICT (fyers_order_id) DO NOTHING`,
    [
      today,
      trade.fyers_order_id,
      trade.symbol,
      trade.strike ?? null,
      trade.option_type ?? null,
      trade.side,
      trade.qty,
      trade.product_type,
      trade.order_type,
      trade.entry_price ?? null,
      trade.stop_price ?? null,
      trade.target_price ?? null,
      trade.risk_amount ?? null,
      trade.capital_deployed ?? null,
      trade.spot_price_at_entry ?? null,
      parseFyersDateTime(trade.executed_at),
      trade.status ?? 'OPEN',
      trade.is_sl_leg ?? false,
      trade.is_system_exit ?? false,
      trade.validation_passed ?? null,
      trade.block_reason ?? null,
      JSON.stringify(trade.raw_payload ?? {}),
    ]
  );
}

export async function updateTradeExit(params: {
  symbol: string;
  exit_price: number;
  pnl: number;
  status: string;
}): Promise<void> {
  const today = getISTDate();
  // rr_realized = pnl / risk_amount (reward relative to what was risked)
  // e.g. -1 = SL hit exactly, +1.5 = made 1.5x the risk
  await pool.query(
    `UPDATE trade_log
     SET exit_price    = $1,
         pnl           = $2,
         status        = $3,
         rr_realized   = CASE WHEN risk_amount > 0 THEN ROUND(($2::NUMERIC / risk_amount)::NUMERIC, 2) ELSE NULL END,
         updated_at    = NOW()
     WHERE id = (
       SELECT id FROM trade_log
       WHERE date = $4 AND symbol = $5 AND status = 'OPEN'
         AND is_sl_leg = false AND is_system_exit = false
       ORDER BY created_at DESC
       LIMIT 1
     )`,
    [params.exit_price, params.pnl, params.status, today, params.symbol]
  );
}

export async function markSystemExit(fyersOrderId: string): Promise<void> {
  await pool.query(
    'INSERT INTO system_exit_orders (fyers_order_id) VALUES ($1) ON CONFLICT DO NOTHING',
    [fyersOrderId]
  );
}

export async function isSystemExit(fyersOrderId: string): Promise<boolean> {
  const result = await pool.query(
    'SELECT 1 FROM system_exit_orders WHERE fyers_order_id = $1',
    [fyersOrderId]
  );
  return result.rowCount !== null && result.rowCount > 0;
}

export async function getTodayTrades(): Promise<TradeLog[]> {
  const today = getISTDate();
  const result = await pool.query<TradeLog>(
    'SELECT * FROM trade_log WHERE date = $1 ORDER BY created_at DESC',
    [today]
  );
  return result.rows;
}

export async function getRecentTrades(limit = 20): Promise<TradeLog[]> {
  const result = await pool.query<TradeLog>(
    'SELECT * FROM trade_log ORDER BY created_at DESC LIMIT $1',
    [limit]
  );
  return result.rows;
}
