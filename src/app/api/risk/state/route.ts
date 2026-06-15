// DISABLED — risk state endpoint commented out
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function GET() { return NextResponse.json({ error: 'Disabled' }, { status: 503 }); }

/*
import { getOrCreateTodayState } from '@/lib/models/dailyRiskState.model';
import { getTodayTrades } from '@/lib/models/tradeLog.model';

export async function GET() {
  try {
    const [state, trades] = await Promise.all([getOrCreateTodayState(), getTodayTrades()]);
    return NextResponse.json({ state, trades });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
*/
