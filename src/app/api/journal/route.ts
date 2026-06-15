// DISABLED — journal save endpoint commented out
import { NextResponse } from 'next/server';
export async function POST() {
  return NextResponse.json({ error: 'Disabled' }, { status: 503 });
}

/*
import { upsertJournalEntry } from '@/lib/models/traderJournal.model';

export async function POST(req: Request) {
  try {
    const { date, notes } = await req.json() as { date: string; notes: string };
    if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 });
    await upsertJournalEntry(date, notes ?? '');
    console.log(`[Journal] Saved notes for ${date} (${(notes ?? '').length} chars)`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Journal] Failed to save:', err);
    return NextResponse.json({ error: 'Failed to save journal entry' }, { status: 500 });
  }
}
*/
