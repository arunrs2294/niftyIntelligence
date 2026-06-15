import pool from '@/lib/db/client';

export async function getJournalEntry(date: string): Promise<string> {
  const result = await pool.query<{ notes: string }>(
    'SELECT notes FROM trader_journal WHERE date = $1',
    [date]
  );
  return result.rows[0]?.notes ?? '';
}

export async function upsertJournalEntry(date: string, notes: string): Promise<void> {
  await pool.query(
    `INSERT INTO trader_journal (date, notes, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (date) DO UPDATE SET notes = EXCLUDED.notes, updated_at = NOW()`,
    [date, notes]
  );
}
