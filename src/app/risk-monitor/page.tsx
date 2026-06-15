// DISABLED — risk monitor commented out; re-enable by restoring full page implementation
import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
export default function RiskMonitorPage() { redirect('/must-read'); }
