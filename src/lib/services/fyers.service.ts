import axios from 'axios';

const FYERS_BASE = 'https://api-t1.fyers.in/api/v3';
const NIFTY_SYMBOL = 'NSE:NIFTY50-INDEX';

export interface FyersOrder {
  id: string;
  symbol: string;
  qty: number;
  type: number;
  side: number;
  productType: string;
  status: number;
  tradedPrice: number;
  stopPrice: number;
  limitPrice: number;
  filledQty: number;
  orderDateTime: string;
  message: string;
}

function authHeader() {
  const token = process.env.FYERS_ACCESS_TOKEN;
  if (!token) throw new Error('FYERS_ACCESS_TOKEN is not set in .env.local');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function cancelOrder(orderId: string): Promise<void> {
  console.log(`[Fyers] Cancelling order ${orderId}`);
  await axios.delete(`${FYERS_BASE}/orders/sync`, {
    headers: authHeader(),
    data: { id: orderId },
  });
}

export async function placeExitOrder(params: {
  symbol: string;
  qty: number;
  exitSide: 1 | -1;
  productType: string;
}): Promise<string> {
  // CO exits use INTRADAY product type (Fyers requires this for square-off)
  const exitProductType = params.productType === 'CO' || params.productType === 'BO'
    ? 'INTRADAY'
    : params.productType;

  console.log(`[Fyers] Placing exit order: ${params.symbol} ${params.qty} ${params.exitSide === 1 ? 'BUY' : 'SELL'}`);
  const response = await axios.post(
    `${FYERS_BASE}/orders/sync`,
    {
      symbol: params.symbol,
      qty: params.qty,
      type: 2,
      side: params.exitSide,
      productType: exitProductType,
      limitPrice: 0,
      stopPrice: 0,
      validity: 'DAY',
      disclosedQty: 0,
      offlineOrder: false,
    },
    { headers: authHeader() }
  );
  const orderId: string = response.data?.data?.id ?? '';
  console.log(`[Fyers] Exit order placed: ${orderId}`);
  return orderId;
}

// Live NIFTY 50 spot price via Fyers market quotes
export async function fetchSpotPrice(): Promise<number> {
  const response = await axios.get(`${FYERS_BASE}/market-quote/quotes`, {
    headers: authHeader(),
    params: { symbols: NIFTY_SYMBOL },
  });
  const data = response.data?.d as Array<{ v: { lp: number }; n: string }> | undefined;
  if (!data?.length) throw new Error('No quote data returned from Fyers');
  const lp = data[0]?.v?.lp;
  if (!lp) throw new Error('Missing last price in Fyers quote response');
  return lp;
}

export async function getOrders(): Promise<FyersOrder[]> {
  const response = await axios.get(`${FYERS_BASE}/orders`, { headers: authHeader() });
  return (response.data?.data?.orderBook ?? []) as FyersOrder[];
}

// Finds a pending SL/protective order for a given symbol (used for non-CO MIS SL check)
export async function findPendingSLOrder(symbol: string): Promise<FyersOrder | null> {
  const orders = await getOrders();
  return (
    orders.find(
      (o) =>
        o.symbol === symbol &&
        (o.type === 3 || o.type === 4) && // SL or SL-M type
        (o.status === 6 || o.status === 4) // pending or trigger-pending
    ) ?? null
  );
}
