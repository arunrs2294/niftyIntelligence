'use client';

import { useState } from 'react';

interface Commandment {
  roman: string;
  title: string;
  body: string;
  tag: string;
}

const TAG_COLORS: Record<string, { text: string; border: string; bg: string; activeBg: string }> = {
  ALL:        { text: 'text-amber-400',   border: 'border-amber-400/40',   bg: 'bg-amber-400/5',   activeBg: 'bg-amber-400/15' },
  PSYCHOLOGY: { text: 'text-purple-400',  border: 'border-purple-400/40',  bg: 'bg-purple-400/5',  activeBg: 'bg-purple-400/15' },
  MINDSET:    { text: 'text-blue-400',    border: 'border-blue-400/40',    bg: 'bg-blue-400/5',    activeBg: 'bg-blue-400/15' },
  EXECUTION:  { text: 'text-amber-400',   border: 'border-amber-400/40',   bg: 'bg-amber-400/5',   activeBg: 'bg-amber-400/15' },
  RULE:       { text: 'text-red-400',     border: 'border-red-400/40',     bg: 'bg-red-400/5',     activeBg: 'bg-red-400/15' },
  SETUP:      { text: 'text-emerald-400', border: 'border-emerald-400/40', bg: 'bg-emerald-400/5', activeBg: 'bg-emerald-400/15' },
  PROCESS:    { text: 'text-zinc-300',    border: 'border-zinc-400/40',    bg: 'bg-zinc-400/5',    activeBg: 'bg-zinc-400/15' },
};

const TABS = ['ALL', 'PSYCHOLOGY', 'MINDSET', 'EXECUTION', 'RULE', 'SETUP', 'PROCESS'];

export function CommandmentGrid({ commandments }: { commandments: Commandment[] }) {
  const [active, setActive] = useState('ALL');

  const filtered = active === 'ALL'
    ? commandments
    : commandments.filter((c) => c.tag === active);

  return (
    <div className="space-y-8">
      {/* Tab bar */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const colors = TAG_COLORS[tab];
          const isActive = active === tab;
          const count = tab === 'ALL'
            ? commandments.length
            : commandments.filter((c) => c.tag === tab).length;

          return (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={`
                flex items-center gap-1.5 px-3.5 py-1.5 rounded-md border text-xs font-bold
                tracking-widest uppercase transition-all duration-150
                ${colors.text} ${colors.border}
                ${isActive ? colors.activeBg + ' opacity-100' : colors.bg + ' opacity-60 hover:opacity-100'}
              `}
            >
              {tab}
              <span className="opacity-60 font-normal">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((cmd) => {
          const colors = TAG_COLORS[cmd.tag];
          return (
            <div
              key={cmd.roman}
              className={`
                rounded-xl border ${colors.border} ${colors.bg}
                p-5 space-y-3 flex flex-col
                hover:brightness-125 transition-all duration-150
              `}
            >
              {/* Top row: numeral + tag */}
              <div className="flex items-center justify-between">
                <span className="font-black text-amber-500/50 text-2xl leading-none select-none">
                  {cmd.roman}
                </span>
                <span className={`text-[10px] font-bold tracking-[0.2em] uppercase ${colors.text}`}>
                  {cmd.tag}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-base font-black text-white leading-snug tracking-wide">
                {cmd.title}
              </h3>

              {/* Amber rule */}
              <div className="w-8 h-px bg-amber-500/40" />

              {/* Body */}
              <p className="text-zinc-300 text-sm leading-relaxed flex-1">
                {cmd.body}
              </p>
            </div>
          );
        })}
      </div>

      {/* Count footer */}
      <p className="text-zinc-600 text-xs text-center tracking-widest uppercase">
        {filtered.length} of {commandments.length} commandments
      </p>
    </div>
  );
}
