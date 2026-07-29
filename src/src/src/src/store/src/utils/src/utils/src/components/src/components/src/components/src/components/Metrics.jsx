import React from "react"; import useStore from "../store/useStore"; import { saveAs } from "file-saver";

export default function Metrics() { const results = useStore((s) => s.results);

function exportCSV() { if (!results.trades) return; const lines = [["EntryDate","ExitDate","Side","Entry","Exit","P&L","P&L%"]]; results.trades.forEach(t=>{ lines.push([t.entryDate,t.exitDate,t.side,t.entryPrice,t.exitPrice,t.pnl.toFixed(2),t.pnlPercent.toFixed(4)]); }); const csv = lines.map(r=>r.join(",")).join("\n"); const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"}); saveAs(blob, "backtest_trades.csv"); }

if (!results || !results.metrics) { return <div className="metrics"><div className="small">No results yet. Run a backtest.</div></div>; } const m = results.metrics; return ( <div> <div className="metrics"> <div className="metric"><div className="small">Total Return</div><div style={{fontWeight:700}}>{m.totalReturn.toFixed(2)}%</div></div> <div className="metric"><div className="small">Annualized Return</div><div style={{fontWeight:700}}>{m.annualizedReturn.toFixed(2)}%</div></div> <div className="metric"><div className="small">Sharpe Ratio</div><div style={{fontWeight:700}}>{m.sharpe.toFixed(2)}</div></div> <div className="metric"><div className="small">Max Drawdown</div><div style={{fontWeight:700}}>{m.maxDrawdown.toFixed(2)}%</div></div> <div className="metric"><div className="small">Win Rate</div><div style={{fontWeight:700}}>{m.winRate.toFixed(2)}%</div></div> <div className="metric"><div className="small">Total Trades</div><div style={{fontWeight:700}}>{m.totalTrades}</div></div> <div className="metric"><div className="small">Profit Factor</div><div style={{fontWeight:700}}>{Number.isFinite(m.profitFactor) ? m.profitFactor.toFixed(2) : "∞"}</div></div> </div>  <div style={{marginTop:8, display:"flex", gap:8}}>
    <button className="button" onClick={exportCSV}>Export Trades CSV</button>
  </div>
</div>
