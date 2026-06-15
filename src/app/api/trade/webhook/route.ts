// DISABLED — trade webhook endpoint commented out
import { NextResponse } from 'next/server';
export async function POST() { return NextResponse.json({ error: 'Disabled' }, { status: 503 }); }

/*
import { processIncomingOrder, type FyersWebhookPayload } from '@/lib/risk-gateway';

export async function POST(req: Request) {
  let payload: FyersWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!payload?.id || !payload?.symbol) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  console.log(`[Webhook] Received order update: ${payload.id} | ${payload.symbol} | status=${payload.status}`);
  processIncomingOrder(payload).catch((err) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Webhook] processIncomingOrder failed for ${payload.id}:`, msg);
  });
  return NextResponse.json({ ok: true });
}
*/
