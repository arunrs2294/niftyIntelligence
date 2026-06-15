import Link from 'next/link';
import { CommandmentGrid } from '@/components/CommandmentGrid';

const COMMANDMENTS = [
  // PSYCHOLOGY
  { roman: 'I',     title: 'WATCH YOUR MIND',                                   tag: 'PSYCHOLOGY', body: 'Engage in active conversation with it before the market opens. Your mind is your first opponent — before the chart, before the price. Observe it. Question it. It will lie. Do not obey it blindly.' },
  { roman: 'XIII',  title: 'NAME YOUR FEARS',                                   tag: 'PSYCHOLOGY', body: 'Losing money and being proven wrong sit at the top of your fear list. Say them out loud before the market opens. An unnamed fear controls you from the shadows. A named fear loses half its power.' },
  { roman: 'XVI',   title: 'FEAR NARROWS YOUR VISION',                          tag: 'PSYCHOLOGY', body: 'When you are fearful, the mind locks onto the object of fear and blinds itself to every other possibility. Recognise the fear. Name it. Step back. Widen your view. Then — and only then — decide.' },
  { roman: 'XX',    title: 'THE MIND WILL LIE TO PROTECT ITSELF',               tag: 'PSYCHOLOGY', body: 'The default human response to emotional pain is avoidance. Your mind will manufacture reasons to hold a losing trade. The defense attorney inside your head is your greatest enemy. Fire it before you trade.' },
  // MINDSET
  { roman: 'XIV',   title: 'EVERY TRADE IS WRONG UNTIL THE MARKET PROVES IT RIGHT', tag: 'MINDSET', body: 'Enter skeptically. Let price — not hope, not logic, not the analyst on TV — earn your conviction. The moment you assume a trade is right, you stop seeing the evidence that it is wrong.' },
  { roman: 'X',     title: 'THE NEXT TRADE IS ALWAYS COMING',                   tag: 'MINDSET',    body: 'Missing this setup is not a loss. The market will open tomorrow. Chasing a move that has already happened is panic dressed as opportunity. Let it go. The best traders miss trades and feel nothing.' },
  { roman: 'III',   title: 'EXPECT DISCOMFORT',                                 tag: 'MINDSET',    body: 'Discomfort is not a warning to exit your trade. It is the confirmation that you are operating at the edge of discipline. Comfortable traders become complacent. Complacent traders become ex-traders.' },
  // EXECUTION
  { roman: 'IV',    title: 'ADD ONLY WHEN RIGHT',                               tag: 'EXECUTION',  body: 'Scale into a position only after the market confirms your thesis with price action. Winners deserve more fuel. Never before. A winning trade earns additions. A losing trade earns an exit.' },
  { roman: 'XVII',  title: 'NOT TAKING A TRADE IS A TRADE',                     tag: 'EXECUTION',  body: 'Sitting on your hands is an active, deliberate, high-discipline decision. There is no rule that says you must trade today. Some of the best positions you will ever hold are the ones you never entered.' },
  { roman: 'XIX',   title: 'JUST FOLLOW THE MARKET',                            tag: 'EXECUTION',  body: "Not your opinion of it. Not what it should logically do. Not what the morning news said. What the market IS doing — right now — in front of your eyes. That is your only instruction." },
  { roman: 'XXI',   title: 'HOPE WITH WINNERS. FEAR WITH LOSERS.',              tag: 'EXECUTION',  body: 'Most traders do the opposite — they cut winners early out of fear, and hold losers hoping the market changes its mind. Invert this completely. Fear in a losing trade is not a weakness. It is your most precise signal.' },
  // RULE
  { roman: 'VI',    title: 'ATM TRADES ONLY',                                   tag: 'RULE',       body: 'No OTM lottery tickets. No "cheap" options with a prayer attached. At-The-Money, every time. Precision over speculation. Your edge is defined by the strike you choose.' },
  { roman: 'VII',   title: 'ALWAYS PLACE A STOP LOSS',                          tag: 'RULE',       body: "No exceptions. No \"I'll watch it closely.\" The stop loss is your contract with discipline — signed before you enter. Without it, you are not trading. You are gambling with borrowed time." },
  { roman: 'XV',    title: 'ON EXPIRY — DOUBT MEANS EXIT',                      tag: 'RULE',       body: 'When the market hesitates on expiry day and the current trend is in question, do not wait for clarity. Exit immediately. Doubt is not a pause — it is your signal. Time decay works against you.' },
  // SETUP
  { roman: 'IX',    title: 'DEFINE YOUR EDGE — THEN TRADE IT',                  tag: 'SETUP',      body: 'Your edge is a specific support or resistance zone where probability tilts decisively in your favor. If you cannot define it before you enter, there is no edge. And if there is no edge, there is no trade. Boredom is not a setup. Sitting out is a position.' },
  { roman: 'XII',   title: 'FOLLOW THE TREND — DISCOUNTS ARE FOR SUPERMARKETS', tag: 'SETUP',      body: 'Never buy weakness hoping for a bargain. Never short strength hoping for a reversal. Trends continue far longer than logic or comfort suggests. Your job is to follow price, not predict it.' },
  // PROCESS
  { roman: 'XI',    title: 'RECORD YOUR IN-MARKET OBSERVATIONS',                tag: 'PROCESS',    body: 'The insight you have at the exact moment price is moving is your most valuable data. Write it down — in the moment, not after. Patterns repeat. Your notes are your second brain.' },
  { roman: 'XVIII', title: 'OWN YOUR TRADE',                                    tag: 'PROCESS',    body: 'Plan the trade before the market opens. Trade the plan once it does. Take full responsibility for every entry and every exit — no blaming the market, the news, the setup, or the broker.' },
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
            BE A MISSILE
          </h1>
          <p className="text-zinc-500 text-sm tracking-widest uppercase">
            ⚔ &nbsp; Eighteen Commandments &nbsp; ⚔
          </p>
          <p className="text-zinc-300 text-lg max-w-lg mx-auto leading-relaxed pt-1">
            Read this before every session. Not as a reminder — as a declaration.
            The market does not care about your feelings. Be precise. Be ruthless. Be ready.
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
            The Commandments
          </h2>
          <span />
        </div>
        <CommandmentGrid commandments={COMMANDMENTS} />
      </div>

    </div>
  );
}
