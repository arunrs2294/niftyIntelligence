import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { BiasResult } from '@/lib/engines/bias.engine';

const DIRECTION_STYLES: Record<string, string> = {
  bullish: 'bg-green-600 text-white',
  bearish: 'bg-red-600 text-white',
  neutral: 'bg-yellow-500 text-white',
};

const CONFIDENCE_STYLES: Record<string, string> = {
  high: 'border-foreground text-foreground',
  medium: 'border-muted-foreground text-muted-foreground',
  low: 'border-muted-foreground/50 text-muted-foreground',
};

export function BiasCard({ bias }: { bias: BiasResult }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          Market Bias
          <div className="flex gap-2">
            <Badge className={DIRECTION_STYLES[bias.direction]}>
              {bias.direction.toUpperCase()}
            </Badge>
            <Badge variant="outline" className={CONFIDENCE_STYLES[bias.confidence]}>
              {bias.confidence} confidence
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-muted-foreground font-medium">Probability</span>
            <span className="font-bold text-base">{bias.probability}%</span>
          </div>
          <Progress value={bias.probability} className="h-2.5" />
        </div>
        <div className="space-y-1.5 pt-1">
          {bias.reasoning.map((r, i) => (
            <p key={i} className="text-sm text-foreground/70 leading-snug">• {r}</p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
