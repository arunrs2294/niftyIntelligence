// DISABLED — analysis by date endpoint commented out
import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json({ error: 'Disabled' }, { status: 503 });
}

/*
import { getAnalysisByDate } from '@/lib/models/dailyAnalysis.model';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD.' }, { status: 400 });
    }
    const analysis = await getAnalysisByDate(date);
    if (!analysis) {
      return NextResponse.json({ error: `No analysis found for ${date}` }, { status: 404 });
    }
    return NextResponse.json(analysis);
  } catch (err) {
    console.error('[API] GET /api/analysis/[date] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
*/
