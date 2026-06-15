import type { OptionStrike } from '@/lib/services/upstox.service';

export type OISignal = 'long_buildup' | 'short_covering' | 'short_buildup' | 'long_unwinding';

export interface StrikeActivity {
  strike: number;
  oi: number;
  changeOI: number;
  signal: OISignal;
  type: 'CE' | 'PE';
}

export interface OptionsResult {
  maxPutOI: { strike: number; oi: number };
  maxCallOI: { strike: number; oi: number };
  pcr: number;
  totalPutOI: number;
  totalCallOI: number;
  topPutStrikes: { strike: number; oi: number }[];
  topCallStrikes: { strike: number; oi: number }[];
  ceActivity: StrikeActivity[];
  peActivity: StrikeActivity[];
  marketDirection: 'up' | 'down' | 'flat';
}

// Classify OI signal based on option type, OI change, and market direction
function classifySignal(
  type: 'CE' | 'PE',
  changeOI: number,
  marketDirection: 'up' | 'down' | 'flat'
): OISignal {
  const oiAdding = changeOI > 0;

  if (type === 'CE') {
    if (oiAdding) return marketDirection === 'up' ? 'long_buildup' : 'short_buildup';
    else return marketDirection === 'up' ? 'short_covering' : 'long_unwinding';
  } else {
    // PE
    if (oiAdding) return marketDirection === 'down' ? 'long_buildup' : 'short_buildup';
    else return marketDirection === 'down' ? 'short_covering' : 'long_unwinding';
  }
}

export function runOptionsEngine(
  chain: OptionStrike[],
  marketDirection: 'up' | 'down' | 'flat' = 'flat'
): OptionsResult {
  if (!chain.length) {
    return {
      maxPutOI: { strike: 0, oi: 0 },
      maxCallOI: { strike: 0, oi: 0 },
      pcr: 1,
      totalPutOI: 0,
      totalCallOI: 0,
      topPutStrikes: [],
      topCallStrikes: [],
      ceActivity: [],
      peActivity: [],
      marketDirection,
    };
  }

  const totalPutOI = chain.reduce((s, r) => s + r.PE_OI, 0);
  const totalCallOI = chain.reduce((s, r) => s + r.CE_OI, 0);
  const pcr = totalCallOI > 0 ? totalPutOI / totalCallOI : 1;

  const maxPut = chain.reduce((max, r) => (r.PE_OI > max.PE_OI ? r : max), chain[0]);
  const maxCall = chain.reduce((max, r) => (r.CE_OI > max.CE_OI ? r : max), chain[0]);

  const topPutStrikes = [...chain]
    .sort((a, b) => b.PE_OI - a.PE_OI)
    .slice(0, 5)
    .map((r) => ({ strike: r.strike, oi: r.PE_OI }));

  const topCallStrikes = [...chain]
    .sort((a, b) => b.CE_OI - a.CE_OI)
    .slice(0, 5)
    .map((r) => ({ strike: r.strike, oi: r.CE_OI }));

  // Top 5 CE strikes by OI with activity signal
  const ceActivity: StrikeActivity[] = [...chain]
    .filter((r) => r.CE_OI > 0)
    .sort((a, b) => b.CE_OI - a.CE_OI)
    .slice(0, 5)
    .map((r) => ({
      strike: r.strike,
      oi: r.CE_OI,
      changeOI: r.CE_changeOI,
      signal: classifySignal('CE', r.CE_changeOI, marketDirection),
      type: 'CE' as const,
    }));

  // Top 5 PE strikes by OI with activity signal
  const peActivity: StrikeActivity[] = [...chain]
    .filter((r) => r.PE_OI > 0)
    .sort((a, b) => b.PE_OI - a.PE_OI)
    .slice(0, 5)
    .map((r) => ({
      strike: r.strike,
      oi: r.PE_OI,
      changeOI: r.PE_changeOI,
      signal: classifySignal('PE', r.PE_changeOI, marketDirection),
      type: 'PE' as const,
    }));

  return {
    maxPutOI: { strike: maxPut.strike, oi: maxPut.PE_OI },
    maxCallOI: { strike: maxCall.strike, oi: maxCall.CE_OI },
    pcr: Math.round(pcr * 100) / 100,
    totalPutOI,
    totalCallOI,
    topPutStrikes,
    topCallStrikes,
    ceActivity,
    peActivity,
    marketDirection,
  };
}
