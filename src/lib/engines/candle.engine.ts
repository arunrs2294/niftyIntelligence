import type { Candle } from '@/lib/services/upstox.service';

// ── Types ────────────────────────────────────────────────────────────────────

export type OHLCContext =
  | 'strong_bullish'
  | 'strong_bearish'
  | 'inside_day'
  | 'outside_day'
  | 'neutral';

export type CandlePattern =
  | 'bullish_engulfing'
  | 'bearish_engulfing'
  | 'inside_bar'
  | 'hammer'
  | 'shooting_star'
  | null;

export type Formation =
  | 'consolidation'
  | 'breakout_buildup'
  | 'double_top'
  | 'double_bottom'
  | 'trend_continuation'
  | 'none';

export type VolatilityTag = 'low' | 'normal' | 'high';

export interface FibonacciLevels {
  swingHigh: number;
  swingLow: number;
  level_382: number;
  level_500: number;
  level_618: number;
}

export interface CandleIntelligenceResult {
  ohlcContext: OHLCContext;
  patterns: { primary: CandlePattern; secondary: CandlePattern };
  formations: { type: Formation; description: string };
  fibonacci: FibonacciLevels | null;
  range: { expectedHigh: number; expectedLow: number; expectedRange: number; volatility: VolatilityTag };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function bodySize(c: Candle) { return Math.abs(c.close - c.open); }
function totalRange(c: Candle) { return c.high - c.low; }
function upperWick(c: Candle) { return c.high - Math.max(c.open, c.close); }
function lowerWick(c: Candle) { return Math.min(c.open, c.close) - c.low; }

// ── OHLC Context ─────────────────────────────────────────────────────────────

function analyzeOHLCContext(candle: Candle): OHLCContext {
  const range = totalRange(candle);
  if (range === 0) return 'neutral';

  const closePosition = (candle.close - candle.low) / range; // 0 = at low, 1 = at high

  if (closePosition >= 0.75) return 'strong_bullish';
  if (closePosition <= 0.25) return 'strong_bearish';

  // Inside day: high < prev.high && low > prev.low — check against prev candle handled in main
  return 'neutral';
}

function analyzeOHLCContextWithPrev(candle: Candle, prev: Candle): OHLCContext {
  const base = analyzeOHLCContext(candle);
  if (base !== 'neutral') return base;

  if (candle.high < prev.high && candle.low > prev.low) return 'inside_day';
  if (candle.high > prev.high && candle.low < prev.low) return 'outside_day';
  return 'neutral';
}

// ── Candlestick Patterns ─────────────────────────────────────────────────────

function detectPattern(candles: Candle[]): CandlePattern {
  if (candles.length < 2) return null;
  const curr = candles[candles.length - 1];
  const prev = candles[candles.length - 2];

  const currBody = bodySize(curr);
  const prevBody = bodySize(prev);
  const currRange = totalRange(curr);

  // Bullish Engulfing
  if (
    prev.close < prev.open && // prev bearish
    curr.close > curr.open && // curr bullish
    curr.open < prev.close &&
    curr.close > prev.open
  ) return 'bullish_engulfing';

  // Bearish Engulfing
  if (
    prev.close > prev.open &&
    curr.close < curr.open &&
    curr.open > prev.close &&
    curr.close < prev.open
  ) return 'bearish_engulfing';

  // Inside Bar (current inside previous)
  if (curr.high < prev.high && curr.low > prev.low) return 'inside_bar';

  // Hammer: small body at top, long lower wick (bullish)
  if (
    currRange > 0 &&
    lowerWick(curr) > currBody * 2 &&
    upperWick(curr) < currBody * 0.5
  ) return 'hammer';

  // Shooting Star: small body at bottom, long upper wick (bearish)
  if (
    currRange > 0 &&
    upperWick(curr) > currBody * 2 &&
    lowerWick(curr) < currBody * 0.5
  ) return 'shooting_star';

  return null;
}

// ── Multi-Day Formations ─────────────────────────────────────────────────────

function detectFormation(candles: Candle[]): { type: Formation; description: string } {
  const recent = candles.slice(-5);
  if (recent.length < 3) return { type: 'none', description: 'Insufficient data' };

  const highs = recent.map((c) => c.high);
  const lows = recent.map((c) => c.low);
  const maxHigh = Math.max(...highs);
  const minLow = Math.min(...lows);
  const range = maxHigh - minLow;

  // Consolidation: all candles within 1% range
  const allWithinRange = recent.every(
    (c) => c.high <= minLow + range * 1.01 && c.low >= maxHigh - range * 1.01
  );
  if (allWithinRange && range / minLow < 0.015) {
    return { type: 'consolidation', description: `Tight range between ${minLow.toFixed(0)}–${maxHigh.toFixed(0)}` };
  }

  // Double Top: two highs close to the same level
  if (
    highs.length >= 4 &&
    Math.abs(highs[0] - highs[highs.length - 1]) / highs[0] < 0.003
  ) {
    return { type: 'double_top', description: `Resistance near ${highs[0].toFixed(0)}` };
  }

  // Double Bottom
  if (
    lows.length >= 4 &&
    Math.abs(lows[0] - lows[lows.length - 1]) / lows[0] < 0.003
  ) {
    return { type: 'double_bottom', description: `Support near ${lows[0].toFixed(0)}` };
  }

  // Breakout Buildup: contracting range for last 3 candles
  const last3Ranges = recent.slice(-3).map(totalRange);
  if (last3Ranges[0] > last3Ranges[1] && last3Ranges[1] > last3Ranges[2]) {
    return { type: 'breakout_buildup', description: 'Contracting range — potential breakout setup' };
  }

  return { type: 'trend_continuation', description: 'No special formation detected' };
}

// ── Fibonacci ─────────────────────────────────────────────────────────────────

function computeFibonacci(candles: Candle[]): FibonacciLevels | null {
  if (candles.length < 5) return null;
  const recent = candles.slice(-20);
  const swingHigh = Math.max(...recent.map((c) => c.high));
  const swingLow = Math.min(...recent.map((c) => c.low));
  const diff = swingHigh - swingLow;
  if (diff === 0) return null;

  return {
    swingHigh,
    swingLow,
    level_382: Math.round((swingHigh - diff * 0.382) * 100) / 100,
    level_500: Math.round((swingHigh - diff * 0.5) * 100) / 100,
    level_618: Math.round((swingHigh - diff * 0.618) * 100) / 100,
  };
}

// ── Range Prediction ──────────────────────────────────────────────────────────

function predictRange(
  candles: Candle[],
  lastClose: number
): { expectedHigh: number; expectedLow: number; expectedRange: number; volatility: VolatilityTag } {
  const recent = candles.slice(-14);
  const atr = recent.reduce((sum, c) => sum + totalRange(c), 0) / recent.length;

  // ATR as % of price
  const atrPct = atr / lastClose;
  const volatility: VolatilityTag = atrPct < 0.007 ? 'low' : atrPct > 0.015 ? 'high' : 'normal';

  // Expected range ≈ 85% of ATR (intraday usually less than daily range)
  const expectedRange = Math.round(atr * 0.85 * 100) / 100;
  const expectedHigh = Math.round((lastClose + expectedRange / 2) * 100) / 100;
  const expectedLow = Math.round((lastClose - expectedRange / 2) * 100) / 100;

  return { expectedHigh, expectedLow, expectedRange, volatility };
}

// ── Main Engine ───────────────────────────────────────────────────────────────

export function runCandleEngine(dailyCandles: Candle[]): CandleIntelligenceResult {
  if (!dailyCandles.length) {
    return {
      ohlcContext: 'neutral',
      patterns: { primary: null, secondary: null },
      formations: { type: 'none', description: 'No data' },
      fibonacci: null,
      range: { expectedHigh: 0, expectedLow: 0, expectedRange: 0, volatility: 'normal' },
    };
  }

  const last = dailyCandles[dailyCandles.length - 1];
  const prev = dailyCandles[dailyCandles.length - 2];

  const ohlcContext = prev ? analyzeOHLCContextWithPrev(last, prev) : analyzeOHLCContext(last);
  const primary = detectPattern(dailyCandles);
  const secondary = dailyCandles.length >= 3
    ? detectPattern(dailyCandles.slice(0, -1))
    : null;
  const formations = detectFormation(dailyCandles);
  const fibonacci = computeFibonacci(dailyCandles);
  const range = predictRange(dailyCandles, last.close);

  return { ohlcContext, patterns: { primary, secondary }, formations, fibonacci, range };
}
