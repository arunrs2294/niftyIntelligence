import { saveDailyAnalysis } from '@/lib/models/dailyAnalysis.model';
import { getLatestOptionSnapshot } from '@/lib/models/optionSnapshot.model';
import { fetchDailyCandles, fetchWeeklyCandles, fetchNearMonthFuturesClose } from '@/lib/services/upstox.service';
import { getUpcomingEvents } from '@/lib/services/event.service';
import { runMarketStructureEngine } from '@/lib/engines/marketStructure.engine';
import { runLevelsEngine } from '@/lib/engines/levels.engine';
import { runOptionsEngine } from '@/lib/engines/options.engine';
import { runGapEngine } from '@/lib/engines/gap.engine';
import { runEventEngine } from '@/lib/engines/event.engine';
import { runCandleEngine } from '@/lib/engines/candle.engine';
import { runBiasEngine } from '@/lib/engines/bias.engine';
import { runScenarioEngine, buildTradePlan } from '@/lib/engines/scenario.engine';
import { format } from 'date-fns';

export async function runDailyAnalysis(dateStr?: string): Promise<void> {
  const date = dateStr ?? format(new Date(), 'yyyy-MM-dd');
  console.log(`[Orchestrator] Starting analysis for ${date}`);

  if (!process.env.UPSTOX_ANALYTICS_TOKEN) {
    throw new Error('UPSTOX_ANALYTICS_TOKEN is not set. Add it to .env.local.');
  }

  // 1. Fetch all data
  console.log('[Orchestrator] Fetching market data from Upstox...');

  console.log('[Orchestrator] Fetching daily candles...');
  const dailyCandles = await fetchDailyCandles(30);
  console.log(`[Orchestrator] Daily candles: ${dailyCandles.length}`);

  console.log('[Orchestrator] Fetching weekly candles...');
  const weeklyCandles = await fetchWeeklyCandles(10);
  console.log(`[Orchestrator] Weekly candles: ${weeklyCandles.length}`);

  console.log('[Orchestrator] Fetching near-month Nifty futures...');
  const futuresSnapshot = await fetchNearMonthFuturesClose().catch((err) => {
    console.warn('[Orchestrator] Futures fetch failed:', (err as Error).message);
    return null;
  });

  console.log('[Orchestrator] Loading option snapshot from DB...');
  const snapshot = await getLatestOptionSnapshot();
  const optionChain = snapshot ?? [];
  if (!snapshot) {
    console.warn('[Orchestrator] No option snapshot found — run `npm run capture:options` during market hours (9:15–3:29 IST)');
  } else {
    console.log(`[Orchestrator] Option snapshot loaded: ${optionChain.length} strikes`);
  }

  const events = await getUpcomingEvents(2);

  if (!dailyCandles.length) throw new Error('No daily candles returned from Upstox');

  const lastCandle = dailyCandles[dailyCandles.length - 1];
  const prevCandle = dailyCandles[dailyCandles.length - 2];
  const currentPrice = lastCandle.close;
  const marketDirection =
    prevCandle == null ? 'flat'
    : currentPrice > prevCandle.close ? 'up'
    : currentPrice < prevCandle.close ? 'down'
    : 'flat';

  // 2. Run all engines
  console.log('[Orchestrator] Running analysis engines...');
  const trend = runMarketStructureEngine(dailyCandles, weeklyCandles);
  const levels = runLevelsEngine(dailyCandles);
  const options = runOptionsEngine(optionChain, marketDirection);
  const gap = runGapEngine(
    levels.pdc,
    futuresSnapshot?.prevClose ?? levels.pdc,
    futuresSnapshot?.expiry ?? ''
  );
  const eventCtx = runEventEngine(events);
  const candleInsights = runCandleEngine(dailyCandles);
  const bias = runBiasEngine({ trend, levels, options, eventCtx, candles: candleInsights, currentPrice });
  const scenarios = runScenarioEngine({ levels, options, bias, currentPrice });
  const tradePlan = buildTradePlan({ bias, scenarios, levels, currentPrice });

  // 3. Save to DB
  console.log('[Orchestrator] Saving analysis to DB...');
  await saveDailyAnalysis({
    date,
    trend: trend as unknown as Record<string, unknown>,
    levels: levels as unknown as Record<string, unknown>,
    options: options as unknown as Record<string, unknown>,
    gap: gap as unknown as Record<string, unknown>,
    event_context: eventCtx as unknown as Record<string, unknown>,
    candle_insights: candleInsights as unknown as Record<string, unknown>,
    scenarios: scenarios as unknown as Record<string, unknown>,
    bias: bias as unknown as Record<string, unknown>,
    trade_plan: tradePlan as unknown as Record<string, unknown>,
  });

  console.log(`[Orchestrator] ✅ Analysis complete for ${date}`);
}
