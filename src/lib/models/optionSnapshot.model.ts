import pool from '@/lib/db/client';
import type { OptionStrike } from '@/lib/services/upstox.service';

export async function getLatestOptionSnapshot(): Promise<OptionStrike[] | null> {
  const result = await pool.query<{ strikes: OptionStrike[] }>(
    'SELECT strikes FROM option_snapshots ORDER BY captured_at DESC LIMIT 1'
  );
  return result.rows[0]?.strikes ?? null;
}

export async function saveOptionSnapshot(expiryDate: string, strikes: OptionStrike[]): Promise<void> {
  await pool.query(
    'INSERT INTO option_snapshots (expiry_date, strikes) VALUES ($1, $2)',
    [expiryDate, JSON.stringify(strikes)]
  );
  console.log(`[OptionSnapshot] Saved ${strikes.length} strikes for expiry ${expiryDate}`);
}
