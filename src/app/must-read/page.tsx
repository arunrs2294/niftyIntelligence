import Link from 'next/link';
import { CommandmentGrid } from '@/components/CommandmentGrid';

const COMMANDMENTS = [
  { roman: 'I',     title: 'WATCH YOUR MIND',                                   tag: 'PSYCHOLOGY', body: 'Your mind is your first opponent — before the chart, before the price. It will lie to protect itself, manufacturing reasons to hold a losing trade. Name your fears — losing money, being wrong — say them out loud. An unnamed fear blinds you; a named one you can control. Question your mind before you trade.' },
  { roman: 'II',    title: 'ADD ONLY WHEN RIGHT',                               tag: 'EXECUTION',  body: 'Scale in only after price confirms your thesis. A winning trade earns additions. A losing trade earns an exit.' },
  { roman: 'III',   title: 'ATM TRADES ONLY',                                   tag: 'RULE',       body: 'No OTM lottery tickets. No cheap options with a prayer attached. At-The-Money, every time — your edge is defined by the strike you choose.' },
  { roman: 'IV',    title: 'ALWAYS PLACE A STOP LOSS',                          tag: 'RULE',       body: 'No exceptions. The stop loss is your contract with discipline, signed before you enter. Without it, you are not trading — you are gambling.' },
  { roman: 'V',     title: 'DEFINE YOUR EDGE — THEN TRADE IT',                  tag: 'SETUP',      body: 'If you cannot define your edge before you enter, there is no edge — and no trade. Boredom is not a setup.' },
  { roman: 'VI',    title: 'THE NEXT TRADE IS ALWAYS COMING',                   tag: 'MINDSET',    body: 'Missing this setup is not a loss. Chasing a move that already happened is panic dressed as opportunity — let it go.' },
  { roman: 'VII',   title: 'RECORD YOUR IN-MARKET OBSERVATIONS',                tag: 'PROCESS',    body: 'The insight you have while price is moving is your most valuable data. Write it down in the moment — not after.' },
  { roman: 'VIII',  title: 'FOLLOW THE TREND — DISCOUNTS ARE FOR SUPERMARKETS', tag: 'SETUP',      body: 'Never buy weakness. Never short strength. Trends last far longer than logic suggests. Not your opinion, not what it should do — what the market IS doing, right now, in front of your eyes, is your only instruction.' },
  { roman: 'IX',    title: 'EVERY TRADE IS WRONG UNTIL THE MARKET PROVES IT RIGHT', tag: 'MINDSET', body: 'Enter skeptically. Your analysis is a hypothesis — not a fact. A level only your mind has confirmed is a trap.' },
  { roman: 'X',     title: 'ON EXPIRY — DOUBT MEANS EXIT',                      tag: 'RULE',       body: 'On expiry day, do not wait for clarity. Doubt is not a pause — it is your signal. Time decay works against you.' },
  { roman: 'XI',    title: 'NOT TAKING A TRADE IS A TRADE',                     tag: 'EXECUTION',  body: 'Sitting out is an active, high-discipline decision. There is no rule that says you must trade today. Define your no-trade zones before the session — the chop between key levels, the ambiguous middle ground where neither side has conviction. Mark these zones on your chart. When price is inside them, your job is to do nothing. Absolute nothing. No entries, no adjustments, no watching for "just one more candle." Inaction inside a no-trade zone is not weakness — it is the trade.' },
  { roman: 'XII',   title: 'OWN YOUR TRADE',                                    tag: 'PROCESS',    body: 'Plan the trade before the market opens. Trade the plan once it does. No blaming the market, the news, or the broker.' },
  { roman: 'XIII',  title: 'HOPE WITH WINNERS. FEAR WITH LOSERS.',              tag: 'EXECUTION',  body: 'Most traders cut winners out of fear and hold losers out of hope. Invert this completely — fear in a losing trade is your most precise signal.' },
  { roman: 'XIV',   title: 'EACH CANDLE IS A VERDICT',                          tag: 'EXECUTION',  body: 'At every candle close, ask: is my edge still here? Your analysis was a hypothesis — each candle is the market\'s verdict. If it contradicts your thesis, exit.' },
];

const POSTULATES = [
  { num: '01', title: 'ANYTHING CAN HAPPEN AT ANY POINT IN TIME' },
  { num: '02', title: 'EVERY MOMENT IS UNIQUE' },
  { num: '03', title: 'THERE IS A RANDOM DISTRIBUTION BETWEEN WINNERS AND LOSERS' },
  { num: '04', title: 'YOU DO NOT NEED TO KNOW WHAT HAPPENS NEXT IN ORDER TO MAKE MONEY' },
  { num: '05', title: 'AN EDGE IS A POINT/ZONE WHERE THERE IS HIGHER PROBABILITY FOR AN EVENT TO OCCUR OVER ANOTHER EVENT' },
];

export default function MustReadPage() {
  return (
    <div className="bg-zinc-950 text-white min-h-screen">

      {/* ── Hero ── */}
      <div className="relative border-b border-zinc-800 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(180,120,0,0.18) 0%, transparent 70%)' }}
        />
        <div className="relative max-w-5xl mx-auto px-6 py-16 text-center space-y-4">
          <p className="text-amber-500 tracking-[0.3em] text-xs font-semibold uppercase">
            Pre-Market Mental Preparation
          </p>
          <h1 className="text-6xl sm:text-8xl font-black tracking-tight text-white">
            THE WAIT IS THE WORK
          </h1>
          <p className="text-zinc-300 text-lg max-w-lg mx-auto leading-relaxed pt-1">
            The market does not care about you. Be patient, be decisive, be precise.
          </p>
        </div>
      </div>

      {/* ── The 5 Postulates ── */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-6">
            <p className="text-amber-500/70 tracking-[0.25em] text-xs font-semibold uppercase shrink-0">
              Accept before you act —
            </p>
            <h2 className="text-lg font-black tracking-widest text-zinc-100 uppercase">
              The Five Postulates
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {POSTULATES.map((p) => (
              <div key={p.num} className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
                <span className="font-black text-amber-500/30 text-xl leading-none shrink-0 select-none mt-0.5">
                  {p.num}
                </span>
                <p className="text-zinc-100 text-sm font-bold tracking-wide leading-snug uppercase">
                  {p.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Commandments ── */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black tracking-widest text-zinc-100 uppercase">
            Critical — Must Read
          </h2>
          <span />
        </div>
        <CommandmentGrid commandments={COMMANDMENTS} />
      </div>

    </div>
  );
}
