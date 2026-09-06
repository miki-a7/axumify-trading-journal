export * from "./dates";

export interface TradeData {
  id: string;
  date: Date | string;
  instrument: string;
  market: string;
  session: string;
  direction: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  exitPrice?: number | null;
  positionSize?: number | null;
  riskAmount?: number | null;
  possibleRR?: number | null;
  actualR: number;
  pnl: number;
  result: string; // WIN, LOSS, BREAKEVEN
  grade?: string | null;
  setup?: string | null;
  ictConcepts?: string | string[];
  mistakes?: string | string[];
  positives?: string | string[];
  psychConfidence?: number | null;
  psychPatience?: number | null;
  mae?: number | null;
  mfe?: number | null;
  commission?: number | null;
  fees?: number | null;
  swap?: number | null;
  slippage?: number | null;
}

export interface TradeOutcomeInput {
  riskAmount?: number | null;
  actualRR?: number | null;
  result?: string | null;
}

export interface TradeOutcome {
  result: "WIN" | "LOSS" | "BREAKEVEN" | "OPEN";
  actualR: number | null;
  pnl: number | null;
}

/** Apply the platform outcome rules without using direction or Possible R:R. */
export function calculateTradeOutcome(input: TradeOutcomeInput): TradeOutcome {
  const result = String(input.result || "OPEN").toUpperCase();
  const normalizedResult = result === "WIN" || result === "LOSS" || result === "BREAKEVEN" ? result : "OPEN";
  const risk = input.riskAmount !== null && input.riskAmount !== undefined && Number.isFinite(Number(input.riskAmount))
    ? Number(input.riskAmount)
    : null;
  const rr = input.actualRR !== null && input.actualRR !== undefined && Number.isFinite(Number(input.actualRR)) && Number(input.actualRR) > 0
    ? Number(Math.abs(Number(input.actualRR)).toFixed(2))
    : null;

  if (normalizedResult === "LOSS") return { result: normalizedResult, actualR: -1, pnl: risk === null ? null : Number((-risk).toFixed(2)) };
  if (normalizedResult === "BREAKEVEN") return { result: normalizedResult, actualR: 0, pnl: 0 };
  if (normalizedResult === "WIN") return { result: normalizedResult, actualR: rr, pnl: risk === null || rr === null ? null : Number((risk * rr).toFixed(2)) };
  return { result: "OPEN", actualR: null, pnl: null };
}

export interface PerformanceFilter {
  startDate?: string;
  endDate?: string;
  instrument?: string;
  session?: string;
  direction?: string;
  setup?: string;
  market?: string;
  result?: string;
}

export interface CalculatedStats {
  totalTrades: number;
  closedTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRate: number; // percentage (deciders win/deciders total)
  lossRate: number;
  breakevenRate: number;
  grossProfit: number;
  grossLoss: number;
  netPnl: number;
  profitFactor: number;
  expectancy: number; // $ per trade
  totalR: number;
  averageR: number; // R per trade
  averageWin: number;
  averageLoss: number;
  averageWinR: number;
  averageLossR: number;
  largestWin: number;
  largestLoss: number;
  largestWinR: number;
  largestLossR: number;
  maxDrawdownAmount: number;
  maxDrawdownR: number;
  maxRunupAmount: number;
  winningStreak: number;
  losingStreak: number;
}

export interface TimePeriodPerformance {
  periodKey: string;
  periodLabel: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRate: number;
  totalPnl: number;
  totalR: number;
  averageR: number;
  averageWinR: number;
  averageLossR: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  expectancy: number;
  bestTradePnl: number;
  worstTradePnl: number;
  bestTradeR: number;
  worstTradeR: number;
}

/**
 * Filter trade records according to active user filter criteria
 */
export function filterTrades(trades: TradeData[], filters?: PerformanceFilter): TradeData[] {
  if (!filters) return trades;
  return trades.filter((t) => {
    if (filters.startDate && new Date(t.date) < new Date(filters.startDate)) return false;
    if (filters.endDate && new Date(t.date) > new Date(filters.endDate)) return false;
    if (filters.instrument && t.instrument.toUpperCase() !== filters.instrument.toUpperCase()) return false;
    if (filters.session && t.session !== filters.session) return false;
    if (filters.direction && t.direction !== filters.direction) return false;
    if (filters.setup && t.setup !== filters.setup) return false;
    if (filters.market && t.market !== filters.market) return false;
    if (filters.result && t.result !== filters.result) return false;
    return true;
  });
}

/**
 * Centralized calculation engine for overall trade performance statistics
 */
export function calculateTradingStats(trades: TradeData[]): CalculatedStats {
  if (!trades || trades.length === 0) {
    return {
      totalTrades: 0,
      closedTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakevenTrades: 0,
      winRate: 0,
      lossRate: 0,
      breakevenRate: 0,
      grossProfit: 0,
      grossLoss: 0,
      netPnl: 0,
      profitFactor: 0,
      expectancy: 0,
      totalR: 0,
      averageR: 0,
      averageWin: 0,
      averageLoss: 0,
      averageWinR: 0,
      averageLossR: 0,
      largestWin: 0,
      largestLoss: 0,
      largestWinR: 0,
      largestLossR: 0,
      maxDrawdownAmount: 0,
      maxDrawdownR: 0,
      maxRunupAmount: 0,
      winningStreak: 0,
      losingStreak: 0,
    };
  }

  // Sort trades chronologically
  const sorted = [...trades].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const totalTrades = sorted.length;
  let winningTrades = 0;
  let losingTrades = 0;
  let breakevenTrades = 0;

  let grossProfit = 0;
  let grossLoss = 0;
  let totalR = 0;

  let totalWinPnl = 0;
  let totalLossPnl = 0;
  let totalWinR = 0;
  let totalLossR = 0;

  let largestWin = 0;
  let largestLoss = 0;
  let largestWinR = 0;
  let largestLossR = 0;

  let currentWinStreak = 0;
  let maxWinStreak = 0;
  let currentLossStreak = 0;
  let maxLossStreak = 0;

  // Drawdown calculation based on Peak Cumulative P&L
  let runningCumPnl = 0;
  let peakCumPnl = 0;
  let maxDrawdownAmount = 0;
  let runningCumR = 0;
  let peakCumR = 0;
  let maxDrawdownR = 0;
  let maxRunupAmount = 0;

  sorted.forEach((trade) => {
    const pnl = Number(trade.pnl || 0);
    const r = getSignedR(Number(trade.actualR || 0), trade.result);
    const res = trade.result ? trade.result.toUpperCase() : (pnl > 0 ? "WIN" : pnl < 0 ? "LOSS" : "BREAKEVEN");

    totalR += r;
    runningCumPnl += pnl;
    runningCumR += r;

    if (runningCumPnl > peakCumPnl) {
      peakCumPnl = runningCumPnl;
    }
    const currentDrawdownPnl = peakCumPnl - runningCumPnl;
    if (currentDrawdownPnl > maxDrawdownAmount) {
      maxDrawdownAmount = currentDrawdownPnl;
    }

    if (runningCumR > peakCumR) {
      peakCumR = runningCumR;
    }
    const currentDrawdownR = peakCumR - runningCumR;
    if (currentDrawdownR > maxDrawdownR) {
      maxDrawdownR = currentDrawdownR;
    }

    if (runningCumPnl > maxRunupAmount) {
      maxRunupAmount = runningCumPnl;
    }

    if (res === "WIN") {
      winningTrades++;
      grossProfit += pnl;
      totalWinPnl += pnl;
      totalWinR += r;

      if (pnl > largestWin) largestWin = pnl;
      if (r > largestWinR) largestWinR = r;

      currentWinStreak++;
      if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
      currentLossStreak = 0;
    } else if (res === "LOSS") {
      losingTrades++;
      const absPnl = Math.abs(pnl);
      grossLoss += absPnl;
      totalLossPnl += absPnl;
      totalLossR += Math.abs(r);

      if (absPnl > largestLoss) largestLoss = absPnl;
      if (Math.abs(r) > largestLossR) largestLossR = Math.abs(r);

      currentLossStreak++;
      if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
      currentWinStreak = 0;
    } else {
      breakevenTrades++;
      currentWinStreak = 0;
      currentLossStreak = 0;
    }
  });

  const closedTrades = totalTrades;
  // Win Rate formula excluding breakevens from denominator when deciders exist
  const decisiveTrades = winningTrades + losingTrades;
  const winRate = decisiveTrades > 0 ? (winningTrades / decisiveTrades) * 100 : 0;
  const lossRate = decisiveTrades > 0 ? (losingTrades / decisiveTrades) * 100 : 0;
  const breakevenRate = closedTrades > 0 ? (breakevenTrades / closedTrades) * 100 : 0;

  const netPnl = grossProfit - grossLoss;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999.0 : 0;

  const averageWin = winningTrades > 0 ? totalWinPnl / winningTrades : 0;
  const averageLoss = losingTrades > 0 ? totalLossPnl / losingTrades : 0;

  const averageWinR = winningTrades > 0 ? totalWinR / winningTrades : 0;
  const averageLossR = losingTrades > 0 ? totalLossR / losingTrades : 0;

  const decimalWinRate = winRate / 100;
  const decimalLossRate = lossRate / 100;
  const expectancy = decimalWinRate * averageWin - decimalLossRate * averageLoss;

  const averageR = closedTrades > 0 ? totalR / closedTrades : 0;

  return {
    totalTrades,
    closedTrades,
    winningTrades,
    losingTrades,
    breakevenTrades,
    winRate: Number(winRate.toFixed(2)),
    lossRate: Number(lossRate.toFixed(2)),
    breakevenRate: Number(breakevenRate.toFixed(2)),
    grossProfit: Number(grossProfit.toFixed(2)),
    grossLoss: Number(grossLoss.toFixed(2)),
    netPnl: Number(netPnl.toFixed(2)),
    profitFactor: Number(profitFactor.toFixed(2)),
    expectancy: Number(expectancy.toFixed(2)),
    totalR: Number(totalR.toFixed(2)),
    averageR: Number(averageR.toFixed(2)),
    averageWin: Number(averageWin.toFixed(2)),
    averageLoss: Number(averageLoss.toFixed(2)),
    averageWinR: Number(averageWinR.toFixed(2)),
    averageLossR: Number(averageLossR.toFixed(2)),
    largestWin: Number(largestWin.toFixed(2)),
    largestLoss: Number(largestLoss.toFixed(2)),
    largestWinR: Number(largestWinR.toFixed(2)),
    largestLossR: Number(largestLossR.toFixed(2)),
    maxDrawdownAmount: Number(maxDrawdownAmount.toFixed(2)),
    maxDrawdownR: Number(maxDrawdownR.toFixed(2)),
    maxRunupAmount: Number(maxRunupAmount.toFixed(2)),
    winningStreak: maxWinStreak,
    losingStreak: maxLossStreak,
  };
}

/**
 * Generate Equity Curve points
 */
export function generateEquityCurve(trades: TradeData[]) {
  if (!trades || trades.length === 0) {
    return [
      {
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        cumPnl: 0,
        cumR: 0,
        pnl: 0,
        r: 0,
        tradesCount: 0,
      },
    ];
  }

  const sorted = [...trades].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let currentCumPnl = 0;
  let currentCumR = 0;
  const curve = [
    {
      date: "Start",
      cumPnl: 0,
      cumR: 0,
      pnl: 0,
      r: 0,
      tradesCount: 0,
    },
  ];

  sorted.forEach((trade, index) => {
    const pnlVal = Number(trade.pnl || 0);
    const rVal = getSignedR(Number(trade.actualR || 0), trade.result);
    currentCumPnl += pnlVal;
    currentCumR += rVal;
    const formattedDate = new Date(trade.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    curve.push({
      date: `${formattedDate} (#${index + 1})`,
      cumPnl: Number(currentCumPnl.toFixed(2)),
      cumR: Number(currentCumR.toFixed(2)),
      pnl: Number(pnlVal.toFixed(2)),
      r: Number(rVal.toFixed(2)),
      tradesCount: index + 1,
    });
  });

  return curve;
}

/**
 * Safe UTC Date String extractor (YYYY-MM-DD)
 */
export function getUTCDateString(dateInput: Date | string): string {
  if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
    return dateInput.substring(0, 10);
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    return new Date().toISOString().substring(0, 10);
  }
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}



/**
 * Single Trade Metrics Calculation
 * Actual R is entered/stored as a positive magnitude.
 * WIN: Actual R = +Magnitude, P&L = +Risk * Magnitude
 * LOSS: Actual R = -1.00R, P&L = -Risk
 * BREAKEVEN: Actual R = 0.00R, P&L = $0.00
 */
export function calculateSingleTradeMetrics(input: {
  direction?: string | null;
  entryPrice?: number | null;
  stopLoss?: number | null;
  takeProfit?: number | null;
  exitPrice?: number | null;
  plannedRR?: number | null;
  possibleRR?: number | null;
  actualR?: number | null;
  pnl?: number | null;
  riskAmount?: number | null;
  result?: string | null;
}): {
  /** Stored in DB for backward compat. Always equals actualR magnitude. Not shown to user as "Planned R:R". */
  plannedRR: number;
  actualR: number;
  pnl: number;
  result: string;
} {
  const dir = (input.direction || "LONG").toUpperCase();
  const riskAmt = input.riskAmount !== undefined && input.riskAmount !== null && Number.isFinite(Number(input.riskAmount))
    ? Number(input.riskAmount)
    : 0;

  const entry =
    input.entryPrice !== undefined && input.entryPrice !== null && !isNaN(Number(input.entryPrice))
      ? Number(input.entryPrice)
      : null;
  const sl =
    input.stopLoss !== undefined && input.stopLoss !== null && !isNaN(Number(input.stopLoss))
      ? Number(input.stopLoss)
      : null;
  const tp =
    input.takeProfit !== undefined && input.takeProfit !== null && !isNaN(Number(input.takeProfit))
      ? Number(input.takeProfit)
      : null;

  // 1. Calculate R:R magnitude — user input takes precedence, then price-derived
  let rrMagnitude: number | null = null;
  if (
    input.actualR !== undefined &&
    input.actualR !== null &&
    !isNaN(Number(input.actualR)) &&
    Number(input.actualR) > 0
  ) {
    rrMagnitude = Number(Math.abs(Number(input.actualR)).toFixed(2));
  } else if (
    input.plannedRR !== undefined &&
    input.plannedRR !== null &&
    !isNaN(Number(input.plannedRR)) &&
    Number(input.plannedRR) > 0
  ) {
    rrMagnitude = Number(Number(input.plannedRR).toFixed(2));
  } else if (entry !== null && sl !== null && tp !== null) {
    let riskDistance = 0;
    let rewardDistance = 0;
    if (dir === "LONG") {
      riskDistance = Math.abs(entry - sl);
      rewardDistance = Math.abs(tp - entry);
    } else {
      riskDistance = Math.abs(sl - entry);
      rewardDistance = Math.abs(entry - tp);
    }
    if (riskDistance > 0 && rewardDistance > 0) {
      rrMagnitude = Number((rewardDistance / riskDistance).toFixed(2));
    }
  }

  // 2. Determine Outcome: WIN, LOSS, BREAKEVEN
  const outcome = calculateTradeOutcome({ riskAmount: input.riskAmount, actualRR: rrMagnitude, result: input.result });

  return {
    plannedRR: rrMagnitude ?? 0,
    actualR: outcome.actualR ?? 0,
    pnl: outcome.pnl ?? 0,
    result: outcome.result === "OPEN" ? "BREAKEVEN" : outcome.result,
  };
}

/**
 * Signed R for analytics and performance views.
 * WIN -> +rrMagnitude
 * LOSS -> -1.0R (standard stopped-out loss)
 * BREAKEVEN -> 0.0R
 */
export function getSignedR(actualRMagnitude: number, result?: string | null): number {
  const res = (result || "").toUpperCase();
  if (res === "WIN") return Math.abs(Number(actualRMagnitude || 0));
  if (res === "LOSS") return -1.0;
  return 0;
}

/** Compute P&L from positive RR magnitude and outcome. */
export function computePnlFromResult(
  riskAmount: number,
  rrMagnitude: number,
  result?: string | null
): number {
  const risk = Number(riskAmount) || 0;
  const rr = Math.abs(Number(rrMagnitude) || 0);
  const res = (result || "WIN").toUpperCase();
  if (res === "BREAKEVEN") return 0;
  if (res === "LOSS") return Number((-risk).toFixed(2));
  if (res === "WIN") return Number((risk * rr).toFixed(2));
  return 0;
}

/** Resolve positive RR magnitude from explicit actualR or plannedRR (defaults to 1R). */
export function resolveRRMagnitude(
  actualR?: number | null,
  plannedRR?: number | null
): number {
  if (actualR !== undefined && actualR !== null && !isNaN(Number(actualR))) {
    const mag = Math.abs(Number(actualR));
    if (mag > 0) return Number(mag.toFixed(2));
  }
  if (plannedRR !== undefined && plannedRR !== null && !isNaN(Number(plannedRR)) && Number(plannedRR) > 0) {
    return Number(Math.abs(Number(plannedRR)).toFixed(2));
  }
  return 1.0;
}

/** Display RR magnitude without sign (5.00R). */
export function formatRRMagnitude(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(Number(value))) return "—";
  return `${Math.abs(Number(value)).toFixed(2)}R`;
}

/** Display monetary P&L with a single $ (+$500, -$500, $0). */
export function formatPnlDisplay(pnl: number | null | undefined): string {
  if (pnl === null || pnl === undefined || isNaN(Number(pnl))) return "—";
  const n = Number(pnl);
  if (n > 0) return `+$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (n < 0) return `-$${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return "$0.00";
}

/** Signed R for performance views (+5.00R / -1.00R / 0.00R) derived from magnitude + result. */
export function formatSignedRDisplay(
  actualRMagnitude: number | null | undefined,
  result?: string | null
): string {
  if (actualRMagnitude === null || actualRMagnitude === undefined || isNaN(Number(actualRMagnitude))) {
    return "—";
  }
  const signed = getSignedR(Number(actualRMagnitude), result);
  const fixed = Math.abs(signed).toFixed(2);
  if (signed > 0) return `+${fixed}R`;
  if (signed < 0) return `-${fixed}R`;
  return `${fixed}R`;
}

export function formatRDisplay(value: number | null | undefined, result?: string | null): string {
  if (result !== undefined) return formatSignedRDisplay(value, result);
  return formatRRMagnitude(value);
}

/** Format optional price for display. */
export function formatPriceDisplay(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(Number(value))) return "—";
  return String(value);
}

/**
 * Get ISO Week string helper (e.g. 2026-W34) using UTC
 */
export function getISOWeekKey(dateInput: Date | string): string {
  const dateStr = getUTCDateString(dateInput);
  const parts = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/**
 * Group trades into Daily, Weekly, Monthly, and Yearly Performance metrics
 */
export function calculateTimePeriodRollups(trades: TradeData[]) {
  const dailyMap: Record<string, TradeData[]> = {};
  const weeklyMap: Record<string, TradeData[]> = {};
  const monthlyMap: Record<string, TradeData[]> = {};
  const yearlyMap: Record<string, TradeData[]> = {};

  trades.forEach((t) => {
    const dateStr = getUTCDateString(t.date);
    const parts = dateStr.split("-");
    const yearStr = parts[0];
    const monthStr = `${parts[0]}-${parts[1]}`;
    const weekStr = getISOWeekKey(t.date);

    if (!dailyMap[dateStr]) dailyMap[dateStr] = [];
    if (!weeklyMap[weekStr]) weeklyMap[weekStr] = [];
    if (!monthlyMap[monthStr]) monthlyMap[monthStr] = [];
    if (!yearlyMap[yearStr]) yearlyMap[yearStr] = [];

    dailyMap[dateStr].push(t);
    weeklyMap[weekStr].push(t);
    monthlyMap[monthStr].push(t);
    yearlyMap[yearStr].push(t);
  });

  const buildRollup = (groupMap: Record<string, TradeData[]>, labelPrefix: string): TimePeriodPerformance[] => {
    return Object.entries(groupMap).map(([key, groupTrades]) => {
      const stats = calculateTradingStats(groupTrades);
      
      let bestPnl = -Infinity;
      let worstPnl = Infinity;
      let bestR = -Infinity;
      let worstR = Infinity;

      groupTrades.forEach((t) => {
        const pnl = Number(t.pnl || 0);
        const r = getSignedR(Number(t.actualR || 0), t.result);
        if (pnl > bestPnl) bestPnl = pnl;
        if (pnl < worstPnl) worstPnl = pnl;
        if (r > bestR) bestR = r;
        if (r < worstR) worstR = r;
      });

      if (bestPnl === -Infinity) bestPnl = 0;
      if (worstPnl === Infinity) worstPnl = 0;
      if (bestR === -Infinity) bestR = 0;
      if (worstR === Infinity) worstR = 0;

      return {
        periodKey: key,
        periodLabel: `${labelPrefix} ${key}`,
        totalTrades: stats.totalTrades,
        winningTrades: stats.winningTrades,
        losingTrades: stats.losingTrades,
        breakevenTrades: stats.breakevenTrades,
        winRate: stats.winRate,
        totalPnl: stats.netPnl,
        totalR: stats.totalR,
        averageR: stats.averageR,
        averageWinR: stats.averageWinR,
        averageLossR: stats.averageLossR,
        averageWin: stats.averageWin,
        averageLoss: stats.averageLoss,
        profitFactor: stats.profitFactor,
        expectancy: stats.expectancy,
        bestTradePnl: Number(bestPnl.toFixed(2)),
        worstTradePnl: Number(worstPnl.toFixed(2)),
        bestTradeR: Number(bestR.toFixed(2)),
        worstTradeR: Number(worstR.toFixed(2)),
      };
    });
  };

  return {
    daily: buildRollup(dailyMap, "Day"),
    weekly: buildRollup(weeklyMap, "Week"),
    monthly: buildRollup(monthlyMap, "Month"),
    yearly: buildRollup(yearlyMap, "Year"),
  };
}

