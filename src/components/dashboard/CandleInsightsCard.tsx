import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CandleIntelligenceResult } from '@/lib/engines/candle.engine';

const VOLATILITY_STYLE: Record<string, string> = {
  low: 'border-blue-300 text-blue-700',
  normal: 'border-muted-foreground/40 text-muted-foreground',
  high: 'border-orange-300 text-orange-700',
};

const PATTERN_STYLE: Record<string, string> = {
  bullish_engulfing: 'border-green-300 text-green-700',
  hammer: 'border-green-300 text-green-700',
  inside_bar: 'border-yellow-300 text-yellow-700',
  bearish_engulfing: 'border-red-300 text-red-700',
  shooting_star: 'border-red-300 text-red-700',
};

function formatPattern(p: string | null): string {
  if (!p) return 'None detected';
  return p.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function Chip({ label, className }: { label: string; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded border px-2.5 py-0.5 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

export function CandleInsightsCard({ insights }: { insights: CandleIntelligenceResult }) {
  const { ohlcContext, patterns, formations, fibonacci, range } = insights;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Candle Intelligence</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3.5">
        {/* OHLC Context */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">OHLC Context</span>
          <Chip label={ohlcContext.replace(/_/g, ' ')} className="border-muted-foreground/40 text-foreground" />
        </div>

        {/* Patterns */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Pattern</span>
          {patterns.primary ? (
            <Chip
              label={formatPattern(patterns.primary)}
              className={PATTERN_STYLE[patterns.primary] ?? 'border-muted-foreground/40 text-foreground'}
            />
          ) : (
            <span className="text-sm text-foreground/60">None detected</span>
          )}
        </div>

        {/* Formation */}
        <div className="rounded-md bg-muted/60 border px-3 py-2.5">
          <p className="text-xs font-bold tracking-wide text-foreground/70 uppercase">
            {formations.type.replace(/_/g, ' ')}
          </p>
          <p className="text-sm text-foreground/75 mt-0.5">{formations.description}</p>
        </div>

        {/* Fibonacci */}
        {fibonacci && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fibonacci Levels</p>
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="rounded border bg-muted/50 p-2">
                <p className="text-xs text-muted-foreground">38.2%</p>
                <p className="font-semibold text-sm mt-0.5">{fibonacci.level_382}</p>
              </div>
              <div className="rounded border bg-muted/50 p-2">
                <p className="text-xs text-muted-foreground">50%</p>
                <p className="font-semibold text-sm mt-0.5">{fibonacci.level_500}</p>
              </div>
              <div className="rounded border bg-muted/50 p-2">
                <p className="text-xs text-muted-foreground">61.8%</p>
                <p className="font-semibold text-sm mt-0.5">{fibonacci.level_618}</p>
              </div>
            </div>
          </div>
        )}

        {/* Expected Range */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Expected Range</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{range.expectedLow} – {range.expectedHigh}</span>
            <Chip label={range.volatility} className={VOLATILITY_STYLE[range.volatility]} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
