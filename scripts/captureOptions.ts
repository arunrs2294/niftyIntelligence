import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env.local') });

import('@/lib/services/upstox.service').then(async ({ fetchOptionChain, nearestThursday }) => {
  const expiry = nearestThursday();
  console.log(`[CaptureOptions] Fetching option chain for expiry ${expiry}...`);

  const strikes = await fetchOptionChain(expiry);
  console.log(`[CaptureOptions] Fetched ${strikes.length} strikes`);

  if (strikes.length === 0) {
    console.warn('[CaptureOptions] No strikes returned — market may be closed or outside hours. Snapshot not saved.');
    process.exit(0);
  }

  const { saveOptionSnapshot } = await import('@/lib/models/optionSnapshot.model');
  await saveOptionSnapshot(expiry, strikes);
  console.log('[CaptureOptions] ✅ Snapshot saved successfully');
  process.exit(0);
}).catch((err) => {
  console.error('[CaptureOptions] ❌ Failed:', err.message);
  process.exit(1);
});
