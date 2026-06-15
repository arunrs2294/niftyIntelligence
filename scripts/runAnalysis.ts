import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env.local') });

// After loading env, import the orchestrator
import('@/lib/orchestrator').then(({ runDailyAnalysis }) => {
  return runDailyAnalysis();
}).then(() => {
  console.log('Manual analysis run complete.');
  process.exit(0);
}).catch((err) => {
  console.error('Analysis failed:', err.message);
  process.exit(1);
});
