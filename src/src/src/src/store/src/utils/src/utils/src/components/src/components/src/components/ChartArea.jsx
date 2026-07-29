import React, { useEffect, useRef } from "react"; import useStore from "../store/useStore"; import { createChart } from "lightweight-charts";

export default function ChartArea() { const data = useStore((s) => s.data); const results = useStore((s) => s.results); const chartRef = useRef(); const chartApi = useRef(); const eqChartApi = useRef();

useEffect(() => { if (!chartRef.current) return; chartApi.current = createChart(chartRef.current, { width: chartRef.current.clientWidth, height: 420, layout: { background: { color: "#0b1220" }, textColor: "#d9e6f2" }, grid: { vertLines: { color: "#1b2433" }, horzLines: { color: "#1b2433" } }, timeScale: { timeVisible: true, secondsVisible: false } }); // add main candlestick series chartApi.current.addCandlestickSeries();// equity chart below
const eqContainer = chartRef.current.parentElement.querySelector(".equity");
if (eqContainer) {
  eqChartApi.current = createChart(eqContainer, {
    width: chartRef.current.clientWidth,
    height: 140,
    layout: { background: { color: "#0b1220" }, textColor: "#d9e6f2" },
    grid: { vertLines: { color: "#1b2433" }, horzLines: { color: "#1b2433" } }
  });
  eqChartApi.current.addLineSeries({ color: "#00b894" });
}

function resize() {
  const w = chartRef.current.clientWidth;
  chartApi.current.applyOptions({ width: w });
  if (eqChartApi.current) eqChartApi.current.applyOptions({ width: w });
}
window.addEventListener("resize", resize);

return () => {
  window.removeEventListener("resize", resize);
  if (chartApi.current) chartApi.current.remove();
  if (eqChartApi.current) eqChartApi.current.remove();
};}, []);

useEffect(() => { if (!chartApi.current) return; const c = chartApi.current;// build candlestick data
const candleData = data.map((d) => ({
  time: typeof d.date === "string" ? d.date : new Date(d.date).toISOString().split("T")[0],
  open: d.open,
  high: d.high,
  low: d.low,
  close: d.close
}));

// clear existing series and add again
// lightweight-charts doesn't have removeAllSeries; simple approach: recreate the chart by removing and re-creating.
try {
  c.remove();
} catch (e) {}
// re-create chart instance (quick and safe)
chartApi.current = createChart(chartRef.current, {
  width: chartRef.current.clientWidth,
  height: 420,
  layout: { background: { color: "#0b1220" }, textColor: "#d9e6f2" },
  grid: { vertLines: { color: "#1b2433" }, horzLines: { color: "#1b2433" } },
  timeScale: { timeVisible: true, secondsVisible: false }
});
const candlestickSeries = chartApi.current.addCandlestickSeries();
candlestickSeries.setData(candleData);

// draw trade markers
if (results && results.trades && results.trades.length) {
  const markers = [];
  results.trades.forEach((t) => {
    markers.push({
      time: data[t.entryIndex].date,
      position: t.side === "LONG" ? "belowBar" : "aboveBar",
      color: t.side === "LONG" ? "#00b894" : "#ff7675",
      shape: t.side === "LONG" ? "arrowUp" : "arrowDown",
      text: "Entry"
    });
    markers.push({
      time: data[t.exitIndex].date,
      position: t.side === "LONG" ? "aboveBar" : "belowBar",
      color: t.pnl > 0 ? "#00b894" : "#ff7675",
      shape: "circle",
      text: "Exit"
    });
  });
  candlestickSeries.setMarkers(markers);
}

// equity chart
if (eqChartApi.current && results && results.equity && results.equity.length) {
  const eqSeries = eqChartApi.current.getSeries()[0];
  if (eqSeries) {
    const eqData = results.equity.map((v, i) => ({ time: data[i].date, value: v }));
    // lightweight-charts requires a fresh series object for simplicity
    try {
      eqChartApi.current.remove();
    } catch (e) {}
    // recreate eq chart
    const eqContainer = chartRef.current.parentElement.querySelector(".equity");
    if (eqContainer) {
      eqChartApi.current = createChart(eqContainer, {
        width: chartRef.current.clientWidth,
        height: 140,
        layout: { background: { color: "#0b1220" }, textColor: "#d9e6f2" },
        grid: { vertLines: { color: "#1b2433" }, horzLines: { color: "#1b2433" } }
      });
      const newEqSeries = eqChartApi.current.addLineSeries({ color: "#00b894" });
      newEqSeries.setData(eqData);
    }
  }
}}, [data, results]);

return ( <div className="chart-card"> <div ref={chartRef} style={{width:"100%",height:420}} /> <div style={{height:140, marginTop:12}}> <div className="equity" style={{width:"100%",height:140}} /> </div> <div className="legend"> <div><span className="marker-buy" /> Buy</div> <div><span className="marker-sell" /> Sell</div> </div> </div> ); 3. Commit with message: "feat: add ChartArea component".
