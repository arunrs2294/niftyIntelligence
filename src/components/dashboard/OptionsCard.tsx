import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { OptionsResult, OISignal, StrikeActivity } from '@/lib/engines/options.engine';

function formatOI(oi: number): string {
  if (oi >= 10_000_000) return `${(oi / 10_000_000).toFixed(1)}Cr`;
  if (oi >= 100_000) return `${(oi / 100_000).toFixed(1)}L`;
  return oi.toLocaleString('en-IN');
}

function formatChangeOI(change: number): string {
  const abs = Math.abs(change);
  const str = formatOI(abs);
  return change >= 0 ? `+${str}` : `−${str}`;
}

const SIGNAL_META: Record<OISignal, { label: string; color: string; interpretation: string }> = {
  long_buildup: {
    label: 'Long Buildup',
    color: 'text-green-600',
    interpretation: 'Trend continuation — fresh positions supporting the move',
  },
  short_covering: {
    label: 'Short Covering',
    color: 'text-yellow-600',
    interpretation: 'Caution — opposing shorts closing, not fresh conviction',
  },
  short_buildup: {
    label: 'Short Buildup',
    color: 'text-red-600',
    interpretation: 'Trend continuation — fresh positions against the move',
  },
  long_unwinding: {
    label: 'Long Unwinding',
    color: 'text-orange-500',
    interpretation: 'Weak signal — existing positions exiting',
  },
};

function ActivityTable({ rows, title }: { rows: StrikeActivity[]; title: string }) {
  if (!rows.length) {
    return (
      <div>
        <p className="text-sm font-semibold mb-2">{title}</p>
        <p className="text-sm text-muted-foreground">No data — market may be closed</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-semibold mb-2">{title}</p>
      <div className="space-y-2">
        {rows.map((row) => {
          const meta = SIGNAL_META[row.signal];
          return (
            <div key={row.strike} className="flex items-center justify-between rounded-md border px-3 py-2">
              <div className="flex items-center gap-3">
                <span className="font-bold text-base w-16">{row.strike}</span>
                <span className="text-sm text-muted-foreground">{formatOI(row.oi)} OI</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${row.changeOI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatChangeOI(row.changeOI)}
                </span>
                <Badge variant="outline" className={`text-xs ${meta.color}`}>
                  {meta.label}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SignalLegend() {
  return (
    <div className="rounded-md bg-muted/50 p-3 space-y-1.5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Signal Guide</p>
      {Object.entries(SIGNAL_META).map(([signal, meta]) => (
        <div key={signal} className="flex gap-2 text-xs">
          <span className={`font-semibold w-32 shrink-0 ${meta.color}`}>{meta.label}</span>
          <span className="text-muted-foreground">{meta.interpretation}</span>
        </div>
      ))}
    </div>
  );
}

export function OptionsCard({ options }: { options: OptionsResult }) {
  const pcrColor =
    options.pcr > 1.2 ? 'text-green-600' : options.pcr < 0.8 ? 'text-red-600' : 'text-yellow-600';
  const pcrLabel =
    options.pcr > 1.2 ? 'Put Heavy — Bullish bias' : options.pcr < 0.8 ? 'Call Heavy — Bearish bias' : 'Neutral';

  const marketDirection = options.marketDirection ?? 'flat';
  const directionLabel =
    marketDirection === 'up' ? '▲ Up day'
    : marketDirection === 'down' ? '▼ Down day'
    : '— Flat';
  const directionColor =
    marketDirection === 'up' ? 'text-green-600'
    : marketDirection === 'down' ? 'text-red-600'
    : 'text-muted-foreground';

  const ceActivity = options.ceActivity ?? [];
  const peActivity = options.peActivity ?? [];
  const hasData = ceActivity.length > 0 || peActivity.length > 0;

  return (
    <Card className="col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          Options Intelligence
          <span className={`text-sm font-medium ${directionColor}`}>{directionLabel}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* PCR + Key Levels */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-md border p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">PCR</p>
            <p className={`text-xl font-bold ${pcrColor}`}>{options.pcr}</p>
            <p className={`text-xs mt-1 ${pcrColor}`}>{pcrLabel}</p>
          </div>
          <div className="rounded-md border p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Max Put OI (Support)</p>
            <p className="text-xl font-bold text-green-600">{options.maxPutOI.strike || '—'}</p>
            <p className="text-xs text-muted-foreground">{options.maxPutOI.oi ? formatOI(options.maxPutOI.oi) : '—'}</p>
          </div>
          <div className="rounded-md border p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Max Call OI (Resistance)</p>
            <p className="text-xl font-bold text-red-600">{options.maxCallOI.strike || '—'}</p>
            <p className="text-xs text-muted-foreground">{options.maxCallOI.oi ? formatOI(options.maxCallOI.oi) : '—'}</p>
          </div>
        </div>

        {/* OI Activity Tables */}
        {hasData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <ActivityTable rows={ceActivity} title="Call OI Activity (Resistance zone)" />
            <ActivityTable rows={peActivity} title="Put OI Activity (Support zone)" />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No OI activity data — market may be closed or option chain unavailable.
          </p>
        )}

        {/* Signal Legend */}
        {hasData && <SignalLegend />}

      </CardContent>
    </Card>
  );
}
