import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { EventEngineResult } from '@/lib/engines/event.engine';

const IMPACT_STYLES: Record<string, { badge: string; border: string }> = {
  HIGH: { badge: 'bg-red-600', border: 'border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800' },
  MEDIUM: { badge: 'bg-orange-500', border: 'border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800' },
  LOW: { badge: 'bg-gray-400', border: 'border-gray-200 bg-gray-50' },
};

export function EventWarningCard({ eventCtx }: { eventCtx: EventEngineResult }) {
  if (eventCtx.impact === 'LOW') return null;

  const styles = IMPACT_STYLES[eventCtx.impact];

  return (
    <Card className={`border-2 ${styles.border}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          ⚠️ Event Warning
          <Badge className={styles.badge}>{eventCtx.impact} IMPACT</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-medium">{eventCtx.event}</p>
        <p className="text-sm text-muted-foreground mt-1">
          Expected behavior: <span className="font-medium">{eventCtx.marketBehavior.replace(/_/g, ' ')}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Avoid aggressive positions. Markets may gap or reverse sharply.
        </p>
      </CardContent>
    </Card>
  );
}
