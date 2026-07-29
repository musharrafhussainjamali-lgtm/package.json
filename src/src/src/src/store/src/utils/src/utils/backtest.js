import { computeIndicatorByName } from "./indicators";

// Evaluate single condition for index i. cond: {indicator: "SMA-20"/.. , operator, value} // Supports operators: ">", "<", "==", "crosses above", "crosses below" function evalConditionAt(indicatorSeries, i, operator, value) { const v = indicatorSeries[i]; if (v == null) return false; switch (operator) { case ">": return v > value; case "<": return v < value; case "==": return v === value; case "crosses above": if (i === 0 || indicatorSeries[i - 1] == null) return false; return indicatorSeries[i - 1] <= value && indicatorSeries[i] > value; case "crosses below": if (i === 0 || indicatorSeries[i - 1] == null) return false; return indicatorSeries[i - 1] >= value && indicatorSeries[i] < value; default: return false; } }

// Compute performance metrics from equity curve and trades function computeMetrics(trades, equity, dates, initialCapital = 10000) { const finalBalance = equity.length ? equity[equity.length - 1] : initialCapital; const totalReturn = ((finalBalance - initialCapital) / initialCapital) * 100;

// Annualized return: compute years from first to last date let years = 1; if (dates.length >= 2) { const d0 = new Date(dates[0]); const d1 = new Date(dates[dates.length - 1]); years = (d1 - d0) / (1000 * 60 * 60 * 24 * 365); if (years <= 0) years = 1 / 365; } const annualized = Math.pow(finalBalance / initialCapital, 1 / years) - 1;

// Equity returns per step const rets = []; for (let i = 1; i < equity.length; i++) { if (equity[i - 1] > 0) rets.push((equity[i] / equity[i - 1]) - 1); } const mean = rets.reduce((a, b) => a + b, 0) / (rets.length || 1); const std = Math.sqrt(rets.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / (rets.length || 1)); const sharpe = std === 0 ? 0 : (mean / std) * Math.sqrt(252); // assume daily frequency for annualization

// Max drawdown let peak = -Infinity; let maxDD = 0; for (let v of equity) { if (v > peak) peak = v; const dd = (peak - v) / peak; if (dd > maxDD) maxDD = dd; }

// Trades metrics const wins = trades.filter(t => t.pnlPercent > 0); const losses = trades.filter(t => t.pnlPercent <= 0); const winRate = trades.length ? (wins.length / trades.length) * 100 : 0; const grossProfit = wins.reduce((s, t) => s + t.pnl, 0); const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0)); const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? Infinity : 0) : grossProfit / grossLoss;

return { totalReturn, annualizedReturn: annualized * 100, sharpe, maxDrawdown: maxDD * 100, winRate, totalTrades: trades.length, profitFactor }; }

// Main backtest. data: array of OHLCV with date string. strategy: object with conditions & TP/SL settings. // progressCallback(percent) optional for UI updates. export async function runBacktest(data, strategy, progressCallback) { const initialCapital = 10000; if (!data || data.length === 0) return null;

// Precompute indicators referenced by strategy conditions const indicatorNames = []; if (strategy.condition1?.indicator) indicatorNames.push(strategy.condition1.indicator); if (strategy.condition2?.indicator) indicatorNames.push(strategy.condition2.indicator); const uniqueIndicators = [...new Set(indicatorNames)];

const indicatorMap = {}; for (const name of uniqueIndicators) { const res = computeIndicatorByName(data, name); if (res.series) indicatorMap[name] = res.series; else indicatorMap[name] = []; }

const trades = []; const equity = []; const equityDates = [];

let capital = initialCapital; let position = null; // {side: 'LONG'|'SHORT', entryPrice, entryIndex, entryDate}

const total = data.length; const batch = Math.max(1, Math.floor(total / 100)); // update progress 100 times

for (let i = 0; i < data.length; i++) { // periodically yield to UI and update progress if (i % batch === 0) { const pct = Math.floor((i / total) * 100); if (progressCallback) progressCallback(pct); // yield control await new Promise((r) => setTimeout(r, 0)); }const c1 = strategy.condition1;
const c2 = strategy.condition2;
const ind1 = c1?.indicator ? (indicatorMap[c1.indicator] || []) : [];
const ind2 = c2?.indicator ? (indicatorMap[c2.indicator] || []) : [];

const cond1True = c1 && ind1 ? evalConditionAt(ind1, i, c1.operator, Number(c1.value)) : false;
const cond2True = c2 && ind2 ? evalConditionAt(ind2, i, c2.operator, Number(c2.value)) : false;

let entrySignal = false;
if (strategy.logic === "AND") entrySignal = cond1True && cond2True;
else entrySignal = cond1True || cond2True;

// If no open position and entry signal, open at close
if (!position && entrySignal) {
  position = {
    side: strategy.direction === "LONG" ? "LONG" : "SHORT",
    entryPrice: data[i].close,
    entryIndex: i,
    entryDate: data[i].date
  };
}

// If position open, evaluate TP/SL across subsequent candles (we check high/low of current candle to see if levels hit)
if (position) {
  let hitExit = false;
  let exitPrice = data[i].close;
  // compute price levels depending on pips mode
  const pipFactor = 0.0001; // typical pip assumption, adjust if using JPY
  const tpValue = strategy.tpMode === "pips" ? (strategy.tp * pipFactor) : ((strategy.tp / 100) * position.entryPrice);
  const slValue = strategy.slMode === "pips" ? (strategy.sl * pipFactor) : ((strategy.sl / 100) * position.entryPrice);

  if (position.side === "LONG") {
    const tpPrice = position.entryPrice + tpValue;
    const slPrice = position.entryPrice - slValue;
    // check current candle high/low
    if (data[i].high >= tpPrice) {
      hitExit = true;
      exitPrice = tpPrice;
    } else if (data[i].low <= slPrice) {
      hitExit = true;
      exitPrice = slPrice;
    }
  } else {
    // SHORT
    const tpPrice = position.entryPrice - tpValue;
    const slPrice = position.entryPrice + slValue;
    if (data[i].low <= tpPrice) {
      hitExit = true;
      exitPrice = tpPrice;
    } else if (data[i].high >= slPrice) {
      hitExit = true;
      exitPrice = slPrice;
    }
  }

  // If exit hit, close position and record trade
  if (hitExit) {
    const pnl = position.side === "LONG" ? (exitPrice - position.entryPrice) : (position.entryPrice - exitPrice);
    const pnlPercent = (pnl / position.entryPrice) * 100;
    const pnlCash = (pnlPercent / 100) * capital; // percent of capital
    capital += pnlCash;
    trades.push({
      entryPrice: position.entryPrice,
      exitPrice,
      pnl: pnlCash,
      pnlPercent,
      entryDate: position.entryDate,
      exitDate: data[i].date,
      entryIndex: position.entryIndex,
      exitIndex: i,
      side: position.side
    });
    position = null;
  }
}

// Track equity per candle
equity.push(capital);
equityDates.push(data[i].date);}

// If position still open at end, close at last candle close if (position) { const i = data.length - 1; const exitPrice = data[i].close; const pnl = position.side === "LONG" ? (exitPrice - position.entryPrice) : (position.entryPrice - exitPrice); const pnlPercent = (pnl / position.entryPrice) * 100; const pnlCash = (pnlPercent / 100) * capital; capital += pnlCash; trades.push({ entryPrice: position.entryPrice, exitPrice, pnl: pnlCash, pnlPercent, entryDate: position.entryDate, exitDate: data[i].date, entryIndex: position.entryIndex, exitIndex: i, side: position.side }); equity.push(capital); equityDates.push(data[i].date); position = null; }

// final progress if (progressCallback) progressCallback(100);

// compute metrics const metrics = computeMetrics(trades, equity, equityDates, initialCapital);

return { trades, equity, equityDates, metrics }; }
