import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { LevelsResult } from '@/lib/engines/levels.engine';

export function LevelsCard({ levels }: { levels: LevelsResult }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Key Levels</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* PDH / PDC / PDL */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md border border-green-200 bg-green-50 p-2">
            <p className="text-xs font-medium text-green-700 uppercase tracking-wide">PDH</p>
            <p className="font-bold text-green-700 text-base mt-0.5">{levels.pdh.toFixed(2)}</p>
          </div>
          <div className="rounded-md border bg-muted p-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">PDC</p>
            <p className="font-bold text-base mt-0.5">{levels.pdc.toFixed(2)}</p>
          </div>
          <div className="rounded-md border border-red-200 bg-red-50 p-2">
            <p className="text-xs font-medium text-red-700 uppercase tracking-wide">PDL</p>
            <p className="font-bold text-red-700 text-base mt-0.5">{levels.pdl.toFixed(2)}</p>
          </div>
        </div>

        {/* Zones Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-sm">Zone</TableHead>
              <TableHead className="text-sm">Price</TableHead>
              <TableHead className="text-sm">Strength</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {levels.resistance.slice(0, 3).map((z, i) => (
              <TableRow key={`r-${i}`}>
                <TableCell>
                  <span className="inline-flex items-center rounded border border-red-300 px-2 py-0.5 text-xs font-semibold text-red-600">
                    Resistance
                  </span>
                </TableCell>
                <TableCell className="font-semibold text-sm">{z.price.toFixed(2)}</TableCell>
                <TableCell className="text-sm">{'★'.repeat(Math.min(z.strength, 5))}</TableCell>
              </TableRow>
            ))}
            {levels.support.slice(0, 3).map((z, i) => (
              <TableRow key={`s-${i}`}>
                <TableCell>
                  <span className="inline-flex items-center rounded border border-green-300 px-2 py-0.5 text-xs font-semibold text-green-600">
                    Support
                  </span>
                </TableCell>
                <TableCell className="font-semibold text-sm">{z.price.toFixed(2)}</TableCell>
                <TableCell className="text-sm">{'★'.repeat(Math.min(z.strength, 5))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
