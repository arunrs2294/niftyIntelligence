import pool from '@/lib/db/client';

export interface RiskConfig {
  id: number;
  daily_sl_limit: number;
  max_risk_per_trade: number;
  max_consecutive_losses: number;
  max_buy_trades_per_day: number;
  max_sell_trades_per_day: number;
  allow_otm: boolean;
  trading_enabled: boolean;
  updated_at: Date;
}

export async function getRiskConfig(): Promise<RiskConfig> {
  const result = await pool.query<RiskConfig>('SELECT * FROM risk_config ORDER BY id LIMIT 1');
  if (!result.rows[0]) throw new Error('risk_config not seeded — run npm run db:init');
  return result.rows[0];
}

export async function updateRiskConfig(
  patch: Partial<Omit<RiskConfig, 'id' | 'updated_at'>>
): Promise<RiskConfig> {
  const fields = Object.entries(patch)
    .map(([key], i) => `${key} = $${i + 1}`)
    .join(', ');
  const values = Object.values(patch);
  const result = await pool.query<RiskConfig>(
    `UPDATE risk_config SET ${fields}, updated_at = NOW() WHERE id = (SELECT id FROM risk_config ORDER BY id LIMIT 1) RETURNING *`,
    values
  );
  return result.rows[0];
}
