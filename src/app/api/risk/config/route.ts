// DISABLED — risk config endpoint commented out
import { NextResponse } from 'next/server';
export async function GET() { return NextResponse.json({ error: 'Disabled' }, { status: 503 }); }
export async function PUT() { return NextResponse.json({ error: 'Disabled' }, { status: 503 }); }

/*
import { getRiskConfig, updateRiskConfig } from '@/lib/models/riskConfig.model';

export async function GET() {
  try {
    const config = await getRiskConfig();
    return NextResponse.json(config);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const allowed = [
      'daily_sl_limit', 'max_risk_per_trade', 'max_consecutive_losses',
      'max_buy_trades_per_day', 'max_sell_trades_per_day', 'allow_otm', 'trading_enabled',
    ];
    const patch = Object.fromEntries(
      Object.entries(body).filter(([key]) => allowed.includes(key))
    );
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 });
    }
    const updated = await updateRiskConfig(patch);
    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
*/
