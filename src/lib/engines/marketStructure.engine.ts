import type { Candle } from '@/lib/services/upstox.service';

export type Trend = 'bullish' | 'bearish' | 'sideways';

export interface MarketStructureResult {
  daily: Trend;
  weekly: Trend;
  dailySwings: { highs: number[]; lows: number[] };
  weeklySwings: { highs: number[]; lows: number[] };
}

function detectTrend(candles: Candle[]): { trend: Trend; highs: number[]; lows: number[] } {
  if (candles.length < 4) return { trend: 'sideways', highs: [], lows: [] };

  // Look at last 6 candles to identify recent swing structure
  const recent = candles.slice(-6);
  const highs: number[] = [];
  const lows: number[] = [];

  for (let i = 1; i < recent.length - 1; i++) {
    if (recent[i].high > recent[i - 1].high && recent[i].high > recent[i + 1].high) {
      highs.push(recent[i].high);
    }
    if (recent[i].low < recent[i - 1].low && recent[i].low < recent[i + 1].low) {
      lows.push(recent[i].low);
    }
  }

  // Need at least 2 swings to determine structure
  if (highs.length >= 2 && lows.length >= 2) {
    const risingHighs = highs[highs.length - 1] > highs[0];
    const risingLows = lows[lows.length - 1] > lows[0];
    const fallingHighs = highs[highs.length - 1] < highs[0];
    const fallingLows = lows[lows.length - 1] < lows[0];

    if (risingHighs && risingLows) return { trend: 'bullish', highs, lows };
    if (fallingHighs && fallingLows) return { trend: 'bearish', highs, lows };
  }

  // Fallback: compare last 3 closes vs first 3 closes
  const avgFirst = recent.slice(0, 3).reduce((s, c) => s + c.close, 0) / 3;
  const avgLast = recent.slice(-3).reduce((s, c) => s + c.close, 0) / 3;
  const pctChange = (avgLast - avgFirst) / avgFirst;

  if (pctChange > 0.005) return { trend: 'bullish', highs, lows };
  if (pctChange < -0.005) return { trend: 'bearish', highs, lows };
  return { trend: 'sideways', highs, lows };
}

export function runMarketStructureEngine(
  dailyCandles: Candle[],
  weeklyCandles: Candle[]
): MarketStructureResult {
  const { trend: daily, highs: dHighs, lows: dLows } = detectTrend(dailyCandles);
  const { trend: weekly, highs: wHighs, lows: wLows } = detectTrend(weeklyCandles);

  return {
    daily,
    weekly,
    dailySwings: { highs: dHighs, lows: dLows },
    weeklySwings: { highs: wHighs, lows: wLows },
  };
}
