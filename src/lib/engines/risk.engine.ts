export type OptionType = 'CE' | 'PE';

export interface ParsedOrder {
  orderId: string;
  symbol: string;
  strike: number;
  optionType: OptionType;
  side: 1 | -1;
  qty: number;
  productType: string;
  orderType: number;  // 1=Limit 2=Market 3=SL 4=SL-M
  tradedPrice: number;
  stopPrice: number;
  status: number;
}

export interface RiskState {
  date: string;
  realizedPnl: number;
  buyTradesCount: number;
  sellTradesCount: number;
  consecutiveLosses: number;
  isLocked: boolean;
  lockReason: string | null;
}

export interface RiskConfig {
  dailySlLimit: number;
  maxRiskPerTrade: number;
  maxConsecutiveLosses: number;
  maxBuyTradesPerDay: number;
  maxSellTradesPerDay: number;
  allowOtm: boolean;
  tradingEnabled: boolean;
}

export interface ValidationResult {
  pass: boolean;
  failedRule?: string;
  reason?: string;
}

// Parses Fyers option symbol → strike + option type
// Handles both weekly (NSE:NIFTY2521524000CE-OPT) and monthly (NSE:NIFTY24MAY24000CE-OPT) formats
export function parseSymbol(symbol: string): { strike: number; optionType: OptionType } | null {
  const match = symbol.match(/(\d+)(CE|PE)-OPT$/);
  if (!match) return null;
  return {
    strike: parseInt(match[1], 10),
    optionType: match[2] as OptionType,
  };
}

// SL orders (type 3=SL, 4=SL-M) are protective legs, not new positions — skip validation
export function isSLOrderType(orderType: number): boolean {
  return orderType === 3 || orderType === 4;
}

// IST = UTC + 5:30. Returns true if current time is at or after 15:00 IST
export function isAfter3PMIST(): boolean {
  const istMs = Date.now() + 5.5 * 60 * 60 * 1000;
  const ist = new Date(istMs);
  return ist.getUTCHours() * 60 + ist.getUTCMinutes() >= 15 * 60;
}

export function validateTrade(
  order: ParsedOrder,
  state: RiskState,
  config: RiskConfig,
  spotPrice: number
): ValidationResult {
  if (!config.tradingEnabled) {
    return { pass: false, failedRule: 'TRADING_DISABLED', reason: 'Trading has been manually disabled' };
  }

  if (state.isLocked) {
    return { pass: false, failedRule: 'DAY_LOCKED', reason: state.lockReason ?? 'Trading locked for today' };
  }

  if (state.realizedPnl <= -config.dailySlLimit) {
    return {
      pass: false,
      failedRule: 'DAILY_SL_LIMIT',
      reason: `Daily SL hit — realized P&L ₹${state.realizedPnl.toFixed(0)} has reached the ₹${config.dailySlLimit} limit`,
    };
  }

  if (state.consecutiveLosses >= config.maxConsecutiveLosses) {
    return {
      pass: false,
      failedRule: 'CONSECUTIVE_LOSS_LOCK',
      reason: `${state.consecutiveLosses} consecutive losses — locked until manual reset`,
    };
  }

  if (order.side === 1 && state.buyTradesCount >= config.maxBuyTradesPerDay) {
    return {
      pass: false,
      failedRule: 'MAX_BUY_TRADES',
      reason: `Max ${config.maxBuyTradesPerDay} buy trades already taken today`,
    };
  }

  if (order.side === -1 && state.sellTradesCount >= config.maxSellTradesPerDay) {
    return {
      pass: false,
      failedRule: 'MAX_SELL_TRADES',
      reason: `Max ${config.maxSellTradesPerDay} sell trades already taken today`,
    };
  }

  // Overnight positions (NRML/CNC) are only allowed after 3 PM IST
  if (order.productType === 'NRML' || order.productType === 'CNC') {
    if (!isAfter3PMIST()) {
      return {
        pass: false,
        failedRule: 'OVERNIGHT_BEFORE_3PM',
        reason: `${order.productType} position rejected — overnight positions only allowed after 3:00 PM IST`,
      };
    }
  }

  // Strike must be ATM or ITM (no OTM)
  // CE is OTM if strike > spot; PE is OTM if strike < spot
  if (spotPrice > 0 && !config.allowOtm) {
    const isOTM =
      (order.optionType === 'CE' && order.strike > spotPrice) ||
      (order.optionType === 'PE' && order.strike < spotPrice);
    if (isOTM) {
      return {
        pass: false,
        failedRule: 'OTM_STRIKE',
        reason: `OTM blocked — ${order.optionType} ${order.strike} is OTM at spot ₹${spotPrice.toFixed(0)}. Only ATM or ITM strikes allowed`,
      };
    }
  }

  // Risk per trade: |entry - SL| × qty must not exceed limit
  // Only checked when both prices are available (CO orders always have stopPrice)
  if (order.stopPrice > 0 && order.tradedPrice > 0) {
    const risk = Math.abs(order.tradedPrice - order.stopPrice) * order.qty;
    if (risk > config.maxRiskPerTrade) {
      return {
        pass: false,
        failedRule: 'MAX_RISK_PER_TRADE',
        reason: `Risk ₹${risk.toFixed(0)} exceeds limit of ₹${config.maxRiskPerTrade} — SL is ₹${Math.abs(order.tradedPrice - order.stopPrice).toFixed(1)} away × ${order.qty} qty`,
      };
    }
  }

  return { pass: true };
}
