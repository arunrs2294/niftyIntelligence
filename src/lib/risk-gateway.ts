import { validateTrade, parseSymbol, isSLOrderType } from '@/lib/engines/risk.engine';
import { getOrCreateTodayState, incrementTradeCounts, recordTradeOutcome, lockDay } from '@/lib/models/dailyRiskState.model';
import { getRiskConfig } from '@/lib/models/riskConfig.model';
import { logTrade, updateTradeExit, markSystemExit, isSystemExit } from '@/lib/models/tradeLog.model';
import { cancelOrder, placeExitOrder, findPendingSLOrder, fetchSpotPrice } from '@/lib/services/fyers.service';

export interface FyersWebhookPayload {
  id: string;
  symbol: string;
  qty: number;
  type: number;       // 1=Limit 2=Market 3=SL 4=SL-M
  side: number;       // 1=Buy -1=Sell
  productType: string;
  status: number;     // 1=Cancelled 2=Traded 4=Transit 5=Rejected 6=Pending
  tradedPrice: number;
  stopPrice: number;
  limitPrice: number;
  filledQty: number;
  orderDateTime: string;
  message: string;
  [key: string]: unknown;
}

export async function processIncomingOrder(payload: FyersWebhookPayload): Promise<void> {
  const tag = `[Gateway][${payload.id}]`;

  // Skip system-generated exits (our own square-off orders) to avoid re-validation loops
  if (await isSystemExit(payload.id)) {
    console.log(`${tag} System exit order — skipping validation`);
    return;
  }

  // SL and SL-M type orders are protective legs, not new positions
  if (isSLOrderType(payload.type)) {
    await handleSLLegFill(payload);
    return;
  }

  // Only act on filled (2) or pending (6) orders
  if (payload.status !== 2 && payload.status !== 6) {
    return;
  }

  const parsed = parseSymbol(payload.symbol);
  if (!parsed) {
    console.warn(`${tag} Could not parse option symbol: ${payload.symbol} — skipping`);
    return;
  }

  const [state, config] = await Promise.all([getOrCreateTodayState(), getRiskConfig()]);

  let spotPrice = 0;
  try {
    spotPrice = await fetchSpotPrice();
  } catch {
    console.warn(`${tag} Could not fetch spot price — OTM check will be skipped`);
  }

  const result = validateTrade(
    {
      orderId: payload.id,
      symbol: payload.symbol,
      strike: parsed.strike,
      optionType: parsed.optionType,
      side: payload.side as 1 | -1,
      qty: payload.qty,
      productType: payload.productType,
      orderType: payload.type,
      tradedPrice: payload.tradedPrice ?? 0,
      stopPrice: payload.stopPrice ?? 0,
      status: payload.status,
    },
    {
      date: state.date,
      realizedPnl: Number(state.realized_pnl),
      buyTradesCount: state.buy_trades_count,
      sellTradesCount: state.sell_trades_count,
      consecutiveLosses: state.consecutive_losses,
      isLocked: state.is_locked,
      lockReason: state.lock_reason,
    },
    {
      dailySlLimit: Number(config.daily_sl_limit),
      maxRiskPerTrade: Number(config.max_risk_per_trade),
      maxConsecutiveLosses: config.max_consecutive_losses,
      maxBuyTradesPerDay: config.max_buy_trades_per_day,
      maxSellTradesPerDay: config.max_sell_trades_per_day,
      allowOtm: config.allow_otm,
      tradingEnabled: config.trading_enabled,
    },
    spotPrice
  );

  if (!result.pass) {
    console.warn(`${tag} BLOCKED — ${result.failedRule}: ${result.reason}`);

    await logTrade({
      fyers_order_id: payload.id,
      symbol: payload.symbol,
      strike: parsed.strike,
      option_type: parsed.optionType,
      side: payload.side,
      qty: payload.qty,
      product_type: payload.productType,
      order_type: payload.type,
      entry_price: payload.tradedPrice || undefined,
      stop_price: payload.stopPrice || undefined,
      capital_deployed: payload.tradedPrice > 0 ? payload.tradedPrice * payload.qty : undefined,
      spot_price_at_entry: spotPrice > 0 ? spotPrice : undefined,
      executed_at: payload.orderDateTime,
      status: 'BLOCKED',
      validation_passed: false,
      block_reason: result.reason,
      raw_payload: payload as Record<string, unknown>,
    });

    await executeExit(payload, result.reason ?? '');

    // Lock the day for hard limit violations
    if (
      result.failedRule === 'DAILY_SL_LIMIT' ||
      result.failedRule === 'CONSECUTIVE_LOSS_LOCK'
    ) {
      await lockDay(result.reason ?? result.failedRule ?? 'Limit reached');
    }
  } else {
    console.log(`${tag} PASSED — logging trade`);

    const riskAmount =
      payload.stopPrice > 0 && payload.tradedPrice > 0
        ? Math.abs(payload.tradedPrice - payload.stopPrice) * payload.qty
        : undefined;

    await logTrade({
      fyers_order_id: payload.id,
      symbol: payload.symbol,
      strike: parsed.strike,
      option_type: parsed.optionType,
      side: payload.side,
      qty: payload.qty,
      product_type: payload.productType,
      order_type: payload.type,
      entry_price: payload.tradedPrice || undefined,
      stop_price: payload.stopPrice || undefined,
      risk_amount: riskAmount,
      capital_deployed: payload.tradedPrice > 0 ? payload.tradedPrice * payload.qty : undefined,
      spot_price_at_entry: spotPrice > 0 ? spotPrice : undefined,
      executed_at: payload.orderDateTime,
      status: payload.status === 2 ? 'OPEN' : 'PENDING',
      validation_passed: true,
      raw_payload: payload as Record<string, unknown>,
    });

    if (payload.status === 2) {
      await incrementTradeCounts(payload.side as 1 | -1);
    }

    // For plain MIS (non-CO) filled orders: verify SL exists after 10 seconds
    if (payload.status === 2 && payload.productType === 'INTRADAY' && payload.stopPrice === 0) {
      setTimeout(() => {
        checkMandatorySL(payload, parsed.optionType).catch((e) =>
          console.error(`${tag} SL watchdog error:`, e)
        );
      }, 10_000);
    }
  }
}

async function executeExit(payload: FyersWebhookPayload, reason: string): Promise<void> {
  const tag = `[Gateway][${payload.id}]`;
  try {
    if (payload.status === 6) {
      // Still pending — cancel it
      await cancelOrder(payload.id);
      console.log(`${tag} Cancelled pending order. Reason: ${reason}`);
    } else if (payload.status === 2) {
      // Already filled — square off
      const exitSide = payload.side === 1 ? -1 : 1;
      const exitOrderId = await placeExitOrder({
        symbol: payload.symbol,
        qty: payload.qty,
        exitSide,
        productType: payload.productType,
      });
      await markSystemExit(exitOrderId);
      console.log(`${tag} Squared off. Exit order: ${exitOrderId}. Reason: ${reason}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`${tag} Exit failed — MANUAL ACTION REQUIRED. Error: ${msg}`);
  }
}

async function handleSLLegFill(payload: FyersWebhookPayload): Promise<void> {
  if (payload.status !== 2) return; // Only process when SL actually triggers and fills

  console.log(`[Gateway] SL triggered for ${payload.symbol} at ₹${payload.tradedPrice}`);

  // Find the original open entry trade and calculate P&L
  // SL leg is opposite side to entry: if entry was BUY (1), SL exit is SELL (-1)
  const entrySide = payload.side === -1 ? 1 : -1;
  const pnl = payload.side === -1
    ? (payload.tradedPrice - 0) * payload.qty  // will be corrected when we find entry price
    : (0 - payload.tradedPrice) * payload.qty;

  // We pass 0 for entry_price here — updateTradeExit computes final P&L using stored entry_price
  // Fetch the actual entry price to compute correct P&L
  const { default: pool } = await import('@/lib/db/client');
  const istMs = Date.now() + 5.5 * 60 * 60 * 1000;
  const today = new Date(istMs).toISOString().split('T')[0];

  const entryRow = await pool.query(
    `SELECT entry_price FROM trade_log
     WHERE date = $1 AND symbol = $2 AND status = 'OPEN' AND is_sl_leg = false
     ORDER BY created_at DESC LIMIT 1`,
    [today, payload.symbol]
  );

  const entryPrice = entryRow.rows[0]?.entry_price ?? 0;
  const correctedPnl = entrySide === -1
    ? (entryPrice - payload.tradedPrice) * payload.qty   // short exit
    : (payload.tradedPrice - entryPrice) * payload.qty;  // long exit (SL hit = loss)

  await updateTradeExit({
    symbol: payload.symbol,
    exit_price: payload.tradedPrice,
    pnl: correctedPnl,
    status: 'SL_HIT',
  });

  await recordTradeOutcome(correctedPnl);
}

async function checkMandatorySL(payload: FyersWebhookPayload, optionType: string): Promise<void> {
  const tag = `[SL-Watchdog][${payload.id}]`;
  try {
    const slOrder = await findPendingSLOrder(payload.symbol);
    if (!slOrder) {
      console.warn(`${tag} No SL order found for ${payload.symbol} ${optionType} after 10s — exiting position`);
      const exitSide = payload.side === 1 ? -1 : 1;
      const exitOrderId = await placeExitOrder({
        symbol: payload.symbol,
        qty: payload.qty,
        exitSide: exitSide as 1 | -1,
        productType: payload.productType,
      });
      await markSystemExit(exitOrderId);
      console.log(`${tag} Emergency exit placed: ${exitOrderId}`);
    } else {
      console.log(`${tag} SL order confirmed: ${slOrder.id}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`${tag} Error during SL check: ${msg}`);
  }
}
