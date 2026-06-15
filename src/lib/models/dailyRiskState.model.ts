import pool from '@/lib/db/client';

export interface DailyRiskState {
  date: string;
  realized_pnl: number;
  buy_trades_count: number;
  sell_trades_count: number;
  consecutive_losses: number;
  is_locked: boolean;
  lock_reason: string | null;
  updated_at: Date;
}

function getISTDate(): string {
  const istMs = Date.now() + 5.5 * 60 * 60 * 1000;
  return new Date(istMs).toISOString().split('T')[0];
}

export async function getOrCreateTodayState(): Promise<DailyRiskState> {
  const today = getISTDate();
  await pool.query(
    'INSERT INTO daily_risk_state (date) VALUES ($1) ON CONFLICT (date) DO NOTHING',
    [today]
  );
  const result = await pool.query<DailyRiskState>(
    'SELECT * FROM daily_risk_state WHERE date = $1',
    [today]
  );
  return result.rows[0];
}

export async function incrementTradeCounts(side: 1 | -1): Promise<void> {
  const today = getISTDate();
  if (side === 1) {
    await pool.query(
      `UPDATE daily_risk_state SET buy_trades_count = buy_trades_count + 1, updated_at = NOW() WHERE date = $1`,
      [today]
    );
  } else {
    await pool.query(
      `UPDATE daily_risk_state SET sell_trades_count = sell_trades_count + 1, updated_at = NOW() WHERE date = $1`,
      [today]
    );
  }
}

export async function recordTradeOutcome(pnl: number): Promise<void> {
  const today = getISTDate();
  if (pnl >= 0) {
    await pool.query(
      `UPDATE daily_risk_state
       SET realized_pnl = realized_pnl + $1,
           consecutive_losses = 0,
           updated_at = NOW()
       WHERE date = $2`,
      [pnl, today]
    );
  } else {
    await pool.query(
      `UPDATE daily_risk_state
       SET realized_pnl = realized_pnl + $1,
           consecutive_losses = consecutive_losses + 1,
           updated_at = NOW()
       WHERE date = $2`,
      [pnl, today]
    );
  }
}

export async function lockDay(reason: string): Promise<void> {
  const today = getISTDate();
  await pool.query(
    `UPDATE daily_risk_state SET is_locked = true, lock_reason = $1, updated_at = NOW() WHERE date = $2`,
    [reason, today]
  );
}

export async function unlockDay(): Promise<void> {
  const today = getISTDate();
  await pool.query(
    `UPDATE daily_risk_state
     SET is_locked = false, lock_reason = NULL, consecutive_losses = 0, updated_at = NOW()
     WHERE date = $1`,
    [today]
  );
}
