// DISABLED — analysis GET endpoint commented out
import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json({ error: 'Disabled' }, { status: 503 });
}

/*
import { getLatestAnalysis } from '@/lib/models/dailyAnalysis.model';

export async function GET() {
  try {
    const analysis = await getLatestAnalysis();
    if (!analysis) {
      return NextResponse.json({ error: 'No analysis found' }, { status: 404 });
    }
    return NextResponse.json(analysis);
  } catch (err) {
    console.error('[API] GET /api/analysis error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
*/
