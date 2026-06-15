import type { LevelsResult } from './levels.engine';
import type { OptionsResult } from './options.engine';
import type { BiasResult } from './bias.engine';

export interface Scenario {
  label: string;
  trigger: string;
  target: string;
  invalidation: string;
  probability: number;
}

export interface ScenarioResult {
  bullish: Scenario;
  bearish: Scenario;
  range: Scenario;
}

export interface TradePlan {
  primaryBias: string;
  entryZone: string;
  stopLoss: string;
  target1: string;
  target2: string;
  notes: string;
}

export function runScenarioEngine(inputs: {
  levels: LevelsResult;
  options: OptionsResult;
  bias: BiasResult;
  currentPrice: number;
}): ScenarioResult {
  const { levels, options, bias, currentPrice } = inputs;

  const resistanceLevel = options.maxCallOI.strike || levels.pdh;
  const supportLevel = options.maxPutOI.strike || levels.pdl;
  const midPoint = (resistanceLevel + supportLevel) / 2;

  // Distribute probability based on bias
  let bullProb: number, bearProb: number, rangeProb: number;
  if (bias.direction === 'bullish') {
    bullProb = Math.round(bias.probability * 0.7);
    bearProb = Math.round((100 - bias.probability) * 0.6);
    rangeProb = 100 - bullProb - bearProb;
  } else if (bias.direction === 'bearish') {
    bearProb = Math.round(bias.probability * 0.7);
    bullProb = Math.round((100 - bias.probability) * 0.6);
    rangeProb = 100 - bearProb - bullProb;
  } else {
    bullProb = 30;
    bearProb = 30;
    rangeProb = 40;
  }

  const fmt = (n: number) => n.toFixed(0);

  return {
    bullish: {
      label: 'Bullish Breakout',
      trigger: `Sustained trade above ${fmt(resistanceLevel)} with volume`,
      target: `${fmt(resistanceLevel + (resistanceLevel - supportLevel) * 0.5)}–${fmt(resistanceLevel + (resistanceLevel - supportLevel))}`,
      invalidation: `Close below ${fmt(midPoint)}`,
      probability: Math.max(5, bullProb),
    },
    bearish: {
      label: 'Bearish Breakdown',
      trigger: `Sustained break below ${fmt(supportLevel)} with volume`,
      target: `${fmt(supportLevel - (resistanceLevel - supportLevel) * 0.5)}–${fmt(supportLevel - (resistanceLevel - supportLevel))}`,
      invalidation: `Recovery above ${fmt(midPoint)}`,
      probability: Math.max(5, bearProb),
    },
    range: {
      label: 'Range-Bound Session',
      trigger: `No decisive break of ${fmt(supportLevel)}–${fmt(resistanceLevel)} zone`,
      target: `Buy near ${fmt(supportLevel)}, sell near ${fmt(resistanceLevel)}`,
      invalidation: `Break outside ${fmt(supportLevel - 50)}–${fmt(resistanceLevel + 50)}`,
      probability: Math.max(5, rangeProb),
    },
  };
}

export function buildTradePlan(inputs: {
  bias: BiasResult;
  scenarios: ScenarioResult;
  levels: LevelsResult;
  currentPrice: number;
}): TradePlan {
  const { bias, scenarios, levels, currentPrice } = inputs;
  const fmt = (n: number) => n.toFixed(0);

  const primaryScenario = bias.direction === 'bullish'
    ? scenarios.bullish
    : bias.direction === 'bearish'
      ? scenarios.bearish
      : scenarios.range;

  const riskPoints = Math.round((levels.pdh - levels.pdl) * 0.4);
  const stopLoss = bias.direction === 'bullish'
    ? fmt(currentPrice - riskPoints)
    : fmt(currentPrice + riskPoints);

  const target1Points = riskPoints * 1.5;
  const target2Points = riskPoints * 2.5;

  return {
    primaryBias: `${bias.direction.toUpperCase()} (${bias.probability}% probability, ${bias.confidence} confidence)`,
    entryZone: primaryScenario.trigger,
    stopLoss: `${stopLoss} (${fmt(riskPoints)} pts risk)`,
    target1: bias.direction === 'bullish'
      ? fmt(currentPrice + target1Points)
      : fmt(currentPrice - target1Points),
    target2: bias.direction === 'bullish'
      ? fmt(currentPrice + target2Points)
      : fmt(currentPrice - target2Points),
    notes: bias.reasoning.slice(0, 3).join(' | '),
  };
}
