'use client';

import { useState, useRef } from 'react';

interface JournalPanelProps {
  date: string;          // 'YYYY-MM-DD'
  initialNotes: string;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function JournalPanel({ date, initialNotes }: JournalPanelProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function save(value: string) {
    setSaveState('saving');
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, notes: value }),
      });
      setSaveState(res.ok ? 'saved' : 'error');
    } catch {
      setSaveState('error');
    }
    setTimeout(() => setSaveState('idle'), 2000);
  }

  function handleChange(value: string) {
    setNotes(value);
    // Debounce auto-save: 1.5s after user stops typing
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(value), 1500);
  }

  const statusText: Record<SaveState, string> = {
    idle:   notes !== initialNotes ? 'Unsaved changes' : '',
    saving: 'Saving…',
    saved:  '✓ Saved',
    error:  '✗ Save failed',
  };
  const statusColor: Record<SaveState, string> = {
    idle:   'text-muted-foreground',
    saving: 'text-muted-foreground',
    saved:  'text-green-600',
    error:  'text-red-600',
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div>
          <h2 className="text-lg font-bold">My Analysis</h2>
          <p className="text-sm text-muted-foreground">Your inferences for today</p>
        </div>
        <span className={`text-xs font-medium ${statusColor[saveState]}`}>
          {statusText[saveState]}
        </span>
      </div>

      {/* Textarea */}
      <textarea
        value={notes}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          save(notes);
        }}
        placeholder={`What do you see in today's data?\n\n• What does the bias tell you?\n• Do the levels confirm your view?\n• What's your plan if market opens above/below key levels?\n• Any concerns or events to watch?`}
        className="
          flex-1 w-full resize-none rounded-lg border bg-muted/30 p-4
          text-sm leading-relaxed text-foreground
          placeholder:text-muted-foreground/50
          focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-background
          transition-colors duration-150
          font-[inherit]
        "
      />

      {/* Save button */}
      <button
        onClick={() => {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          save(notes);
        }}
        disabled={saveState === 'saving'}
        className="
          mt-3 shrink-0 w-full rounded-lg border border-primary/30 py-2.5
          text-sm font-semibold text-primary
          hover:bg-primary/5 active:bg-primary/10
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-150
        "
      >
        {saveState === 'saving' ? 'Saving…' : 'Save Notes'}
      </button>
    </div>
  );
}
