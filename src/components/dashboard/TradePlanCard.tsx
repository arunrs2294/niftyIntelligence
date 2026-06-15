import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { TradePlan } from '@/lib/engines/scenario.engine';

function PlanRow({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <div className="flex justify-between items-start py-2">
      <span className="text-sm font-medium text-muted-foreground w-28 shrink-0">{label}</span>
      <span className={`text-sm font-semibold text-right ${highlight ?? 'text-foreground'}`}>{value}</span>
    </div>
  );
}

export function TradePlanCard({ tradePlan }: { tradePlan: TradePlan }) {
  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">📋 Trade Plan</CardTitle>
      </CardHeader>
      <CardContent>
        <PlanRow label="Primary Bias" value={tradePlan.primaryBias} />
        <Separator />
        <PlanRow label="Entry Zone" value={tradePlan.entryZone} />
        <PlanRow label="Stop Loss" value={tradePlan.stopLoss} highlight="text-red-600" />
        <Separator />
        <PlanRow label="Target 1" value={tradePlan.target1} highlight="text-green-600" />
        <PlanRow label="Target 2" value={tradePlan.target2} highlight="text-green-600" />
        {tradePlan.notes && (
          <>
            <Separator />
            <p className="text-sm text-foreground/65 pt-2 leading-relaxed">{tradePlan.notes}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
