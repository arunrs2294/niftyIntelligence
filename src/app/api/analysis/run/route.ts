// DISABLED — analysis run endpoint commented out
import { NextResponse } from 'next/server';
export async function POST() {
  return NextResponse.json({ error: 'Disabled' }, { status: 503 });
}

/*
import { runDailyAnalysis } from '@/lib/orchestrator';

export async function POST(req: Request) {
  const secret = req.headers.get('x-run-secret');
  if (secret !== process.env.ANALYSIS_RUN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const date = typeof body.date === 'string' ? body.date : undefined;
    await runDailyAnalysis(date);
    return NextResponse.json({ ok: true, date: date ?? 'today' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[API] POST /api/analysis/run error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
*/
