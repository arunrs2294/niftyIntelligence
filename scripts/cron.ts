import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env.local') });

import cron from 'node-cron';

console.log('[Cron] Starting Nifty Intelligence scheduler...');
console.log('[Cron] Jobs: analysis at 8:30 AM IST | option snapshot at 3:29 PM IST (Mon–Fri)');

// 3:00 AM UTC = 8:30 AM IST — morning analysis (reads candles + stored option snapshot)
cron.schedule('0 3 * * 1-5', async () => {
  console.log(`[Cron] Triggering daily analysis at ${new Date().toISOString()}`);
  try {
    const { runDailyAnalysis } = await import('@/lib/orchestrator');
    await runDailyAnalysis();
    console.log('[Cron] ✅ Daily analysis completed successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Cron] ❌ Daily analysis failed:', message);
  }
}, { timezone: 'UTC' });

// 9:59 AM UTC = 3:29 PM IST — EOD option snapshot (1 min before market close)
cron.schedule('59 9 * * 1-5', async () => {
  console.log(`[Cron] Triggering option snapshot at ${new Date().toISOString()}`);
  try {
    const { fetchOptionChain, nearestThursday } = await import('@/lib/services/upstox.service');
    const { saveOptionSnapshot } = await import('@/lib/models/optionSnapshot.model');
    const expiry = nearestThursday();
    const strikes = await fetchOptionChain(expiry);
    if (strikes.length === 0) {
      console.warn('[Cron] Option snapshot: 0 strikes returned — skipping save');
      return;
    }
    await saveOptionSnapshot(expiry, strikes);
    console.log(`[Cron] ✅ Option snapshot saved: ${strikes.length} strikes for expiry ${expiry}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Cron] ❌ Option snapshot failed:', message);
  }
}, { timezone: 'UTC' });

// Keep process alive
process.on('SIGINT', () => {
  console.log('[Cron] Shutting down...');
  process.exit(0);
});
