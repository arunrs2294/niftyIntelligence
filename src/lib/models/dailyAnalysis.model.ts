import pool from '@/lib/db/client';

export interface DailyAnalysis {
  id: number;
  date: string;
  trend: Record<string, unknown> | null;
  levels: Record<string, unknown> | null;
  options: Record<string, unknown> | null;
  gap: Record<string, unknown> | null;
  event_context: Record<string, unknown> | null;
  candle_insights: Record<string, unknown> | null;
  scenarios: Record<string, unknown> | null;
  bias: Record<string, unknown> | null;
  trade_plan: Record<string, unknown> | null;
  created_at: Date;
}

export async function getLatestAnalysis(): Promise<DailyAnalysis | null> {
  const result = await pool.query<DailyAnalysis>(
    'SELECT * FROM daily_analysis ORDER BY date DESC LIMIT 1'
  );
  return result.rows[0] ?? null;
}

export async function getAnalysisByDate(date: string): Promise<DailyAnalysis | null> {
  const result = await pool.query<DailyAnalysis>(
    'SELECT * FROM daily_analysis WHERE date = $1',
    [date]
  );
  return result.rows[0] ?? null;
}

export async function getAllAnalyses(): Promise<Array<DailyAnalysis & { journal_notes: string | null }>> {
  const result = await pool.query<DailyAnalysis & { journal_notes: string | null }>(
    `SELECT da.*, tj.notes AS journal_notes
     FROM daily_analysis da
     LEFT JOIN trader_journal tj ON tj.date = da.date
     ORDER BY da.date DESC`
  );
  return result.rows;
}

export async function saveDailyAnalysis(data: Omit<DailyAnalysis, 'id' | 'created_at'>): Promise<void> {
  await pool.query(
    `INSERT INTO daily_analysis
       (date, trend, levels, options, gap, event_context, candle_insights, scenarios, bias, trade_plan)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (date) DO UPDATE SET
       trend = EXCLUDED.trend,
       levels = EXCLUDED.levels,
       options = EXCLUDED.options,
       gap = EXCLUDED.gap,
       event_context = EXCLUDED.event_context,
       candle_insights = EXCLUDED.candle_insights,
       scenarios = EXCLUDED.scenarios,
       bias = EXCLUDED.bias,
       trade_plan = EXCLUDED.trade_plan,
       created_at = NOW()`,
    [
      data.date,
      JSON.stringify(data.trend),
      JSON.stringify(data.levels),
      JSON.stringify(data.options),
      JSON.stringify(data.gap),
      JSON.stringify(data.event_context),
      JSON.stringify(data.candle_insights),
      JSON.stringify(data.scenarios),
      JSON.stringify(data.bias),
      JSON.stringify(data.trade_plan),
    ]
  );
}
