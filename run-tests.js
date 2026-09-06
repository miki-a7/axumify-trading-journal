#!/usr/bin/env node
/**
 * Unit tests for trade calculation engine (LONG/SHORT/BREAKEVEN/partial R).
 * Run: node run-tests.js
 */
require("tsx/cjs");

const { calculateSingleTradeMetrics } = require("./src/lib/calculations/stats.ts");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ ${message}`);
    failed++;
  }
}

function approx(a, b, msg) {
  assert(Math.abs(Number(a) - Number(b)) < 0.001, msg);
}

console.log("AXUMIFY Calculation Tests\n");

// A. LONG WIN
{
  const m = calculateSingleTradeMetrics({
    direction: "LONG",
    entryPrice: 100,
    stopLoss: 99,
    takeProfit: 102,
    plannedRR: 2,
    riskAmount: 300,
    result: "WIN",
  });
  approx(m.actualR, 2, "LONG WIN: +2R");
  approx(m.pnl, 600, "LONG WIN: P&L +$600");
  assert(m.result === "WIN", "LONG WIN: result WIN");
}

// B. LONG LOSS
{
  const m = calculateSingleTradeMetrics({
    direction: "LONG",
    plannedRR: 2,
    riskAmount: 300,
    result: "LOSS",
  });
  approx(m.actualR, -1, "LONG LOSS: -1R");
  approx(m.pnl, -300, "LONG LOSS: P&L -$300");
}

// C. LONG BREAKEVEN
{
  const m = calculateSingleTradeMetrics({
    direction: "LONG",
    plannedRR: 2,
    riskAmount: 300,
    result: "BREAKEVEN",
  });
  approx(m.actualR, 0, "LONG BREAKEVEN: 0R");
  approx(m.pnl, 0, "LONG BREAKEVEN: P&L $0");
}

// D. SHORT WIN
{
  const m = calculateSingleTradeMetrics({
    direction: "SHORT",
    entryPrice: 100,
    stopLoss: 101,
    takeProfit: 98,
    plannedRR: 2,
    riskAmount: 300,
    result: "WIN",
  });
  approx(m.actualR, 2, "SHORT WIN: +2R (not negative)");
  approx(m.pnl, 600, "SHORT WIN: P&L +$600");
}

// E. SHORT LOSS
{
  const m = calculateSingleTradeMetrics({
    direction: "SHORT",
    plannedRR: 2,
    riskAmount: 300,
    result: "LOSS",
  });
  approx(m.actualR, -1, "SHORT LOSS: -1R");
  approx(m.pnl, -300, "SHORT LOSS: P&L -$300");
}

// F. SHORT BREAKEVEN
{
  const m = calculateSingleTradeMetrics({
    direction: "SHORT",
    plannedRR: 3,
    riskAmount: 300,
    result: "BREAKEVEN",
  });
  approx(m.actualR, 0, "SHORT BREAKEVEN: 0R");
}

// G. Flexible RR + partial actual R
{
  const m = calculateSingleTradeMetrics({
    direction: "LONG",
    plannedRR: 2,
    actualR: 1.5,
    riskAmount: 300,
    result: "WIN",
  });
  approx(m.actualR, 1.5, "Partial WIN: +1.5R");
  approx(m.pnl, 450, "Partial WIN: P&L +$450");
}

// SHORT example from spec (Entry 1.0850, SL 1.0870, TP 1.0790 → 3R)
{
  const m = calculateSingleTradeMetrics({
    direction: "SHORT",
    entryPrice: 1.085,
    stopLoss: 1.087,
    takeProfit: 1.079,
    plannedRR: 3,
    riskAmount: 300,
    result: "WIN",
  });
  approx(m.plannedRR, 3, "SHORT spec: plannedRR 3.0");
  approx(m.actualR, 3, "SHORT spec WIN: +3R");
  approx(m.pnl, 900, "SHORT spec WIN: P&L +$900");
}

// SHORT price-derived R:R when no explicit R:R is provided
{
  const m = calculateSingleTradeMetrics({
    direction: "SHORT",
    entryPrice: 100,
    stopLoss: 101,
    takeProfit: 98,
    riskAmount: 300,
    result: "WIN",
  });
  approx(m.plannedRR, 2, "SHORT price-derived R:R");
  approx(m.actualR, 2, "SHORT price-derived actual R");
  approx(m.pnl, 600, "SHORT price-derived P&L");
}

// User plannedRR takes precedence over price-derived
{
  const m = calculateSingleTradeMetrics({
    direction: "LONG",
    entryPrice: 100,
    stopLoss: 99,
    takeProfit: 102,
    plannedRR: 1.5,
    riskAmount: 100,
    result: "WIN",
  });
  approx(m.plannedRR, 1.5, "User plannedRR 1.5 preserved");
  approx(m.actualR, 1.5, "WIN uses user plannedRR 1.5");
}

console.log(`\nTOTAL: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
