import axios from 'axios';
import { gunzip } from 'zlib';
import { promisify } from 'util';

const gunzipAsync = promisify(gunzip);

const UPSTOX_API_BASE = 'https://api.upstox.com/v2';
const NIFTY_INSTRUMENT_KEY = 'NSE_INDEX|Nifty 50';
const NSE_INSTRUMENTS_URL = 'https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Candle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  oi: number;
}

export interface OptionStrike {
  strike: number;
  CE_OI: number;
  PE_OI: number;
  CE_changeOI: number; // oi - prev_oi
  PE_changeOI: number;
  CE_lastPrice: number;
  PE_lastPrice: number;
  CE_IV: number;
  PE_IV: number;
  CE_delta: number;
  PE_delta: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function authHeader() {
  const token = process.env.UPSTOX_ANALYTICS_TOKEN;
  if (!token) throw new Error('UPSTOX_ANALYTICS_TOKEN is not set in environment');
  return { Authorization: `Bearer ${token}`, Accept: 'application/json' };
}

function fmt(d: Date): string {
  return d.toISOString().split('T')[0];
}

// Returns nearest upcoming Thursday (NIFTY weekly expiry day)
export function nearestThursday(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 4=Thu
  const daysUntilThursday = (4 - day + 7) % 7 || 7;
  const thursday = new Date(now);
  thursday.setDate(now.getDate() + daysUntilThursday);
  return fmt(thursday);
}

// ── Historical Candles ────────────────────────────────────────────────────────

async function fetchCandles(
  instrumentKey: string,
  interval: 'day' | 'week',
  fromDate: string,
  toDate: string
): Promise<Candle[]> {
  const encodedKey = encodeURIComponent(instrumentKey);
  const url = `${UPSTOX_API_BASE}/historical-candle/${encodedKey}/${interval}/${toDate}/${fromDate}`;
  console.log(`[Upstox] GET ${url}`);

  const response = await axios.get(url, { headers: authHeader() });

  if (response.data.status !== 'success') {
    throw new Error(`Upstox candle fetch failed: ${JSON.stringify(response.data)}`);
  }

  // Response: [timestamp, open, high, low, close, volume, oi] — newest first
  // Reverse to ascending order (oldest → newest) so all engines can use slice(-N)
  return (response.data.data.candles as (string | number)[][])
    .map(([timestamp, open, high, low, close, volume, oi]) => ({
      timestamp: String(timestamp),
      open: Number(open),
      high: Number(high),
      low: Number(low),
      close: Number(close),
      volume: Number(volume),
      oi: Number(oi),
    }))
    .reverse();
}

export async function fetchDailyCandles(days: number): Promise<Candle[]> {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days * 2); // buffer for weekends/holidays
  return fetchCandles(NIFTY_INSTRUMENT_KEY, 'day', fmt(from), fmt(to));
}

export async function fetchWeeklyCandles(weeks: number): Promise<Candle[]> {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - weeks * 10); // buffer
  return fetchCandles(NIFTY_INSTRUMENT_KEY, 'week', fmt(from), fmt(to));
}

// ── Nifty Futures (near-month) ────────────────────────────────────────────────

interface UpstoxInstrument {
  instrument_key: string;
  name: string;
  segment: string;
  instrument_type: string;
  expiry: string; // 'YYYY-MM-DD'
}

export interface FuturesSnapshot {
  instrumentKey: string;
  expiry: string;
  prevClose: number;
}

export async function fetchNearMonthFuturesClose(): Promise<FuturesSnapshot | null> {
  // 1. Download and decompress the NSE instruments master (refreshed daily at ~6 AM IST)
  console.log('[Upstox] Fetching NSE instruments file...');
  const raw = await axios.get(NSE_INSTRUMENTS_URL, { responseType: 'arraybuffer' });
  const decompressed = await gunzipAsync(Buffer.from(raw.data as ArrayBuffer));
  const instruments: UpstoxInstrument[] = JSON.parse(decompressed.toString('utf-8'));

  // 2. Filter for NIFTY near-month futures, sorted by expiry ascending
  const today = fmt(new Date());
  const niftyFuts = instruments
    .filter(
      (i) =>
        i.segment === 'NSE_FO' &&
        i.instrument_type === 'FUT' &&
        i.name === 'NIFTY' &&
        i.expiry >= today // exclude already-expired contracts
    )
    .sort((a, b) => a.expiry.localeCompare(b.expiry));

  if (!niftyFuts.length) {
    console.warn('[Upstox] No active NIFTY futures found in instruments file');
    return null;
  }

  const nearMonth = niftyFuts[0];
  console.log(`[Upstox] Near-month futures: ${nearMonth.instrument_key} (expiry ${nearMonth.expiry})`);

  // 3. Fetch last 5 trading days of daily candles to get most recent close
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 14); // 2-week buffer covers weekends/holidays
  const candles = await fetchCandles(nearMonth.instrument_key, 'day', fmt(from), fmt(to));

  if (!candles.length) {
    console.warn('[Upstox] No candles returned for near-month futures');
    return null;
  }

  const prevClose = candles[candles.length - 1].close;
  return { instrumentKey: nearMonth.instrument_key, expiry: nearMonth.expiry, prevClose };
}

// ── Live Spot Price ───────────────────────────────────────────────────────────

export async function fetchSpotPrice(): Promise<number> {
  const instrumentKey = encodeURIComponent(NIFTY_INSTRUMENT_KEY);
  const url = `${UPSTOX_API_BASE}/market-quote/ltp?instrument_key=${instrumentKey}`;
  const response = await axios.get(url, { headers: authHeader() });
  const data = response.data?.data as Record<string, { last_price: number }> | undefined;
  if (!data) throw new Error('No LTP data returned from Upstox');
  const entry = Object.values(data)[0];
  if (!entry?.last_price) throw new Error('last_price missing in Upstox LTP response');
  return entry.last_price;
}

// ── Option Chain ──────────────────────────────────────────────────────────────

interface UpstoxOptionLeg {
  market_data: {
    ltp: number;
    oi: number;
    prev_oi: number;
    volume: number;
  };
  option_greeks: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    iv: number;
    pop: number;
  };
}

interface UpstoxOptionChainRow {
  strike_price: number;
  call_options: UpstoxOptionLeg;
  put_options: UpstoxOptionLeg;
}

export async function fetchOptionChain(expiryDate?: string): Promise<OptionStrike[]> {
  const expiry = expiryDate ?? nearestThursday();
  const instrumentKey = encodeURIComponent(NIFTY_INSTRUMENT_KEY);
  const url = `${UPSTOX_API_BASE}/option/chain?instrument_key=${instrumentKey}&expiry_date=${expiry}`;
  console.log(`[Upstox] GET ${url}`);

  const response = await axios.get(url, { headers: authHeader() });

  if (response.data.status !== 'success') {
    throw new Error(`Upstox option chain failed: ${JSON.stringify(response.data)}`);
  }

  const rows: UpstoxOptionChainRow[] = response.data.data ?? [];

  return rows.map((row) => {
    const ce = row.call_options;
    const pe = row.put_options;
    return {
      strike: row.strike_price,
      CE_OI: ce?.market_data?.oi ?? 0,
      PE_OI: pe?.market_data?.oi ?? 0,
      CE_changeOI: (ce?.market_data?.oi ?? 0) - (ce?.market_data?.prev_oi ?? 0),
      PE_changeOI: (pe?.market_data?.oi ?? 0) - (pe?.market_data?.prev_oi ?? 0),
      CE_lastPrice: ce?.market_data?.ltp ?? 0,
      PE_lastPrice: pe?.market_data?.ltp ?? 0,
      CE_IV: ce?.option_greeks?.iv ?? 0,
      PE_IV: pe?.option_greeks?.iv ?? 0,
      CE_delta: ce?.option_greeks?.delta ?? 0,
      PE_delta: pe?.option_greeks?.delta ?? 0,
    };
  });
}
