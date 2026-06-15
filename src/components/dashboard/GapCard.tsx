import type { GapResult } from '@/lib/engines/gap.engine';

interface Props {
  gap: GapResult;
}

const basisConfig = {
  premium: { label: 'Futures Premium', color: 'text-green-600', bg: 'bg-green-50 border-green-200', dot: 'bg-green-500' },
  discount: { label: 'Futures Discount', color: 'text-red-600', bg: 'bg-red-50 border-red-200', dot: 'bg-red-500' },
  flat:    { label: 'Futures Flat',     color: 'text-foreground', bg: 'bg-muted/40 border-border', dot: 'bg-muted-foreground' },
};

export function GapCard({ gap }: Props) {
  const cfg = basisConfig[gap.basisType];
  const sign = gap.basis >= 0 ? '+' : '';
  const noData = !gap.futuresExpiry;

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Nifty Futures Basis</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {gap.futuresExpiry
              ? `Near-month expiry: ${new Date(gap.futuresExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
              : 'Futures data unavailable'}
          </p>
        </div>
        {!noData && (
          <span className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        )}
      </div>

      {noData ? (
        <p className="text-sm text-muted-foreground">
          Could not fetch Nifty futures data. Check logs for details.
        </p>
      ) : (
        <>
          {/* Key numbers */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Spot PDC</p>
              <p className="text-lg font-bold tabular-nums">{gap.spotClose.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Futures Close</p>
              <p className="text-lg font-bold tabular-nums">{gap.futuresClose.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className={`rounded-lg border p-3 text-center ${cfg.bg}`}>
              <p className="text-xs text-muted-foreground mb-1">Basis</p>
              <p className={`text-lg font-bold tabular-nums ${cfg.color}`}>
                {sign}{gap.basis.toFixed(2)}
              </p>
              <p className={`text-xs font-medium ${cfg.color}`}>{sign}{gap.basisPercent.toFixed(2)}%</p>
            </div>
          </div>

          {/* Interpretation */}
          <div className="text-sm text-muted-foreground leading-relaxed">
            {gap.basisType === 'premium' && (
              <>Futures trading above spot by <span className="font-semibold text-green-600">{gap.basis.toFixed(0)} pts ({gap.basisPercent.toFixed(2)}%)</span> — market participants pricing in a positive opening bias.</>
            )}
            {gap.basisType === 'discount' && (
              <>Futures trading below spot by <span className="font-semibold text-red-600">{Math.abs(gap.basis).toFixed(0)} pts ({Math.abs(gap.basisPercent).toFixed(2)}%)</span> — market participants pricing in a negative opening bias.</>
            )}
            {gap.basisType === 'flat' && (
              <>Futures trading near spot — no strong directional bias from the basis.</>
            )}
            <span className="block mt-1 text-xs">Note: Gift Nifty (live pre-market indicator) not yet available via API. Basis shown is from previous session closes.</span>
          </div>
        </>
      )}
    </div>
  );
}
