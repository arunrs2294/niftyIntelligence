import type { Candle } from '@/lib/services/upstox.service';

export interface Zone {
  price: number;
  strength: number; // number of times touched
}

export interface LevelsResult {
  pdh: number;
  pdl: number;
  pdc: number;
  support: Zone[];
  resistance: Zone[];
}

function findSwingLows(candles: Candle[], lookback: number = 2): number[] {
  const lows: number[] = [];
  for (let i = lookback; i < candles.length - lookback; i++) {
    const isSwingLow = candles.slice(i - lookback, i).every((c) => c.low > candles[i].low) &&
      candles.slice(i + 1, i + 1 + lookback).every((c) => c.low > candles[i].low);
    if (isSwingLow) lows.push(candles[i].low);
  }
  return lows;
}

function findSwingHighs(candles: Candle[], lookback: number = 2): number[] {
  const highs: number[] = [];
  for (let i = lookback; i < candles.length - lookback; i++) {
    const isSwingHigh = candles.slice(i - lookback, i).every((c) => c.high < candles[i].high) &&
      candles.slice(i + 1, i + 1 + lookback).every((c) => c.high < candles[i].high);
    if (isSwingHigh) highs.push(candles[i].high);
  }
  return highs;
}

function clusterZones(prices: number[], threshold: number = 0.003): Zone[] {
  const sorted = [...prices].sort((a, b) => a - b);
  const zones: Zone[] = [];

  for (const price of sorted) {
    const existing = zones.find((z) => Math.abs(z.price - price) / z.price < threshold);
    if (existing) {
      existing.strength++;
      existing.price = (existing.price + price) / 2; // average
    } else {
      zones.push({ price, strength: 1 });
    }
  }

  return zones.sort((a, b) => b.strength - a.strength).slice(0, 5);
}

export function runLevelsEngine(dailyCandles: Candle[]): LevelsResult {
  // Last candle = most recent completed trading day (we run pre-market, no today candle yet)
  const prevDay = dailyCandles[dailyCandles.length - 1];
  const lookback = dailyCandles.slice(-21);

  const pdh = prevDay?.high ?? 0;
  const pdl = prevDay?.low ?? 0;
  const pdc = prevDay?.close ?? 0;

  const swingLows = findSwingLows(lookback);
  const swingHighs = findSwingHighs(lookback);

  // Combine all swing levels, then classify by position relative to current price (pdc).
  // A level above current price is resistance regardless of how it formed, and vice versa.
  const allZones = clusterZones([...swingLows, ...swingHighs], 0.003);

  const support = allZones
    .filter((z) => z.price < pdc)
    .sort((a, b) => b.price - a.price) // closest below first
    .slice(0, 5);

  const resistance = allZones
    .filter((z) => z.price > pdc)
    .sort((a, b) => a.price - b.price) // closest above first
    .slice(0, 5);

  return { pdh, pdl, pdc, support, resistance };
}
