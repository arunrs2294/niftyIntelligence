import type { MarketStructureResult } from './marketStructure.engine';
import type { LevelsResult } from './levels.engine';
import type { OptionsResult } from './options.engine';
import type { EventEngineResult } from './event.engine';
import type { CandleIntelligenceResult } from './candle.engine';

export type BiasDirection = 'bullish' | 'bearish' | 'neutral';
export type Confidence = 'low' | 'medium' | 'high';

export interface BiasResult {
  direction: BiasDirection;
  probability: number; // 0–100
  confidence: Confidence;
  score: number;
  reasoning: string[];
}

const BULLISH_PATTERNS = new Set(['bullish_engulfing', 'hammer', 'inside_bar']);
const BEARISH_PATTERNS = new Set(['bearish_engulfing', 'shooting_star']);

export function runBiasEngine(inputs: {
  trend: MarketStructureResult;
  levels: LevelsResult;
  options: OptionsResult;
  eventCtx: EventEngineResult;
  candles: CandleIntelligenceResult;
  currentPrice: number;
}): BiasResult {
  const { trend, levels, options, eventCtx, candles, currentPrice } = inputs;
  let score = 0;
  const reasoning: string[] = [];

  // Trend signals
  if (trend.daily === 'bullish') { score += 2; reasoning.push('Daily trend: bullish (+2)'); }
  if (trend.daily === 'bearish') { score -= 2; reasoning.push('Daily trend: bearish (-2)'); }
  if (trend.weekly === 'bullish') { score += 1; reasoning.push('Weekly trend: bullish (+1)'); }
  if (trend.weekly === 'bearish') { score -= 1; reasoning.push('Weekly trend: bearish (-1)'); }

  // Price vs levels
  if (currentPrice > 0 && levels.pdh > 0) {
    const nearSupport = levels.support.some((z) => Math.abs(z.price - currentPrice) / currentPrice < 0.005);
    const nearResistance = levels.resistance.some((z) => Math.abs(z.price - currentPrice) / currentPrice < 0.005);

    if (nearSupport) { score += 2; reasoning.push('Price near support zone (+2)'); }
    if (nearResistance) { score -= 2; reasoning.push('Price near resistance zone (-2)'); }

    if (currentPrice > levels.pdh) { score += 1; reasoning.push('Above PDH — bullish breakout (+1)'); }
    if (currentPrice < levels.pdl) { score -= 1; reasoning.push('Below PDL — bearish breakdown (-1)'); }
  }

  // Options / OI signals
  if (options.pcr > 1.2) { score += 2; reasoning.push(`PCR ${options.pcr} > 1.2: put-heavy → bullish (+2)`); }
  if (options.pcr < 0.8) { score -= 2; reasoning.push(`PCR ${options.pcr} < 0.8: call-heavy → bearish (-2)`); }

  // Candle pattern signals
  const primaryPat = candles.patterns.primary;
  if (primaryPat && BULLISH_PATTERNS.has(primaryPat)) { score += 2; reasoning.push(`Bullish pattern: ${primaryPat} (+2)`); }
  if (primaryPat && BEARISH_PATTERNS.has(primaryPat)) { score -= 2; reasoning.push(`Bearish pattern: ${primaryPat} (-2)`); }

  // OHLC context
  if (candles.ohlcContext === 'strong_bullish') { score += 1; reasoning.push('Strong bullish close (+1)'); }
  if (candles.ohlcContext === 'strong_bearish') { score -= 1; reasoning.push('Strong bearish close (-1)'); }

  // Event risk
  if (eventCtx.impact === 'HIGH') { score -= 2; reasoning.push(`High-impact event today: ${eventCtx.event} (-2)`); }
  if (eventCtx.impact === 'MEDIUM') { score -= 1; reasoning.push(`Medium-impact event: ${eventCtx.event} (-1)`); }

  // Map score to direction & probability
  // Score range: roughly -14 to +14
  const normalized = Math.max(-14, Math.min(14, score));
  const probability = Math.round(50 + (normalized / 14) * 40); // 10%–90%

  let direction: BiasDirection = 'neutral';
  if (score >= 3) direction = 'bullish';
  if (score <= -3) direction = 'bearish';

  const absScore = Math.abs(score);
  const confidence: Confidence = absScore >= 6 ? 'high' : absScore >= 3 ? 'medium' : 'low';

  return { direction, probability, confidence, score, reasoning };
}
