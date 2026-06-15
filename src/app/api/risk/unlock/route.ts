// DISABLED — risk unlock endpoint commented out
import { NextResponse } from 'next/server';
export async function POST() { return NextResponse.json({ error: 'Disabled' }, { status: 503 }); }

/*
import { unlockDay } from '@/lib/models/dailyRiskState.model';
import { updateRiskConfig } from '@/lib/models/riskConfig.model';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    await unlockDay();
    if (body.enable_trading) {
      await updateRiskConfig({ trading_enabled: true });
    }
    console.log('[Risk] Day unlocked manually');
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
*/
