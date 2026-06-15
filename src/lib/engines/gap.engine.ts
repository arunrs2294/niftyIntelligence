export type BasisType = 'premium' | 'discount' | 'flat';

export interface GapResult {
  spotClose: number;       // Nifty spot PDC
  futuresClose: number;    // Nifty near-month futures previous close
  futuresExpiry: string;   // e.g. '2026-04-28'
  basis: number;           // futuresClose - spotClose (points)
  basisPercent: number;    // basis as % of spot
  basisType: BasisType;    // premium | discount | flat
}

export function runGapEngine(spotClose: number, futuresClose: number, futuresExpiry: string): GapResult {
  const basis = Math.round((futuresClose - spotClose) * 100) / 100;
  const basisPercent = Math.round((basis / spotClose) * 10000) / 100;

  let basisType: BasisType = 'flat';
  if (basisPercent > 0.1) basisType = 'premium';
  else if (basisPercent < -0.1) basisType = 'discount';

  return { spotClose, futuresClose, futuresExpiry, basis, basisPercent, basisType };
}
