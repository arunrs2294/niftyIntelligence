'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function UnlockButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleUnlock() {
    if (!confirm('Unlock trading for today? Consecutive loss counter will also reset.')) return;
    setLoading(true);
    try {
      await fetch('/api/risk/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable_trading: true }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleUnlock}
      disabled={loading}
      className="px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
    >
      {loading ? 'Unlocking…' : 'Unlock Trading'}
    </button>
  );
}

export function TradingToggle({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    const action = enabled ? 'disable' : 'enable';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} trading?`)) return;
    setLoading(true);
    try {
      await fetch('/api/risk/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trading_enabled: !enabled }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 ${
        enabled
          ? 'bg-red-600 text-white hover:bg-red-700'
          : 'bg-slate-700 text-white hover:bg-slate-600'
      }`}
    >
      {loading ? '…' : enabled ? 'Disable Trading' : 'Enable Trading'}
    </button>
  );
}

export function AutoRefresh() {
  const router = useRouter();
  const [active, setActive] = useState(false);

  function toggle() {
    if (active) {
      setActive(false);
    } else {
      setActive(true);
      const id = setInterval(() => router.refresh(), 30_000);
      // store on window so we can clear it
      (window as unknown as Record<string, unknown>)._riskRefreshId = id;
    }
  }

  function stop() {
    const id = (window as unknown as Record<string, ReturnType<typeof setInterval>>)._riskRefreshId;
    if (id) clearInterval(id);
    setActive(false);
  }

  return (
    <button
      onClick={active ? stop : toggle}
      className={`px-3 py-1.5 rounded text-xs font-medium border ${
        active ? 'border-green-500 text-green-400' : 'border-slate-600 text-slate-400'
      }`}
    >
      {active ? '● Auto-refresh ON (30s)' : '○ Auto-refresh'}
    </button>
  );
}
