// DISABLED — dashboard commented out; re-enable by restoring full page implementation
import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
export default function DashboardPage() { redirect('/must-read'); }
