import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ScenarioResult } from '@/lib/engines/scenario.engine';

const SCENARIO_STYLES = {
  bullish: {
    border: 'border-green-200 bg-green-50/50',
    badge: 'bg-green-600 text-white',
    label: 'text-green-700',
    icon: '📈',
  },
  bearish: {
    border: 'border-red-200 bg-red-50/50',
    badge: 'bg-red-600 text-white',
    label: 'text-red-700',
    icon: '📉',
  },
  range: {
    border: 'border-yellow-200 bg-yellow-50/50',
    badge: 'bg-yellow-500 text-white',
    label: 'text-yellow-700',
    icon: '↔️',
  },
};

function ScenarioBox({
  type,
  scenario,
}: {
  type: keyof typeof SCENARIO_STYLES;
  scenario: { label: string; trigger: string; target: string; invalidation: string; probability: number };
}) {
  const style = SCENARIO_STYLES[type];
  return (
    <div className={`rounded-lg border p-4 space-y-2.5 ${style.border}`}>
      <div className="flex items-center justify-between">
        <span className={`font-bold text-sm ${style.label}`}>
          {style.icon} {scenario.label}
        </span>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${style.badge}`}>
          {scenario.probability}%
        </span>
      </div>
      <div className="space-y-1.5 text-sm">
        <p><span className="font-semibold text-foreground">Trigger: </span><span className="text-foreground/75">{scenario.trigger}</span></p>
        <p><span className="font-semibold text-foreground">Target: </span><span className="text-foreground/75">{scenario.target}</span></p>
        <p><span className="font-semibold text-foreground">Invalidated if: </span><span className="text-foreground/75">{scenario.invalidation}</span></p>
      </div>
    </div>
  );
}

export function ScenariosCard({ scenarios }: { scenarios: ScenarioResult }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Scenarios</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ScenarioBox type="bullish" scenario={scenarios.bullish} />
        <ScenarioBox type="bearish" scenario={scenarios.bearish} />
        <ScenarioBox type="range" scenario={scenarios.range} />
      </CardContent>
    </Card>
  );
}
