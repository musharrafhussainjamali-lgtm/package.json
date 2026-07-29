import React, { useState } from "react"; import useStore from "../store/useStore"; import { runBacktest } from "../utils/backtest"; import { saveAs } from "file-saver";

const indicatorOptions = [ "SMA-10","SMA-20","SMA-50","EMA-10","EMA-20","EMA-50","RSI-14","MACD","BB-20" ]; const operators = [">","<","==","crosses above","crosses below"];

export default function StrategyBuilder({ disabled }) { const strategy = useStore((s) => s.strategy); const setStrategy = useStore((s) => s.setStrategy); const data = useStore((s) => s.data); const setResults = useStore((s) => s.setResults); const setRunning = useStore((s) => s.setRunning); const progress = useStore((s) => s.progress); const setProgress = useStore((s) => s.setProgress);

const [local, setLocal] = useState(strategy);

function handleChange(partial) { const next = { ...local, ...partial }; setLocal(next); setStrategy(partial); }

async function onRun() { setRunning(true); setProgress(0); const callback = (pct) => setProgress(pct); const res = await runBacktest(data, { ...local }, callback); setResults(res); setRunning(false); }

function exportStrategy() { const blob = new Blob([JSON.stringify(local, null, 2)], { type: "application/json" }); saveAs(blob, "strategy.json"); }

async function loadStrategy(e) { const f = e.target.files[0]; if (!f) return; const text = await f.text(); const obj = JSON.parse(text); setLocal(obj); setStrategy(obj); }

return ( <div className="strategy-group"> <div style={{fontWeight:700}}>Strategy Builder</div> <div className="small">Condition 1</div> <div className="form-row"> <select className="select" value={local.condition1.indicator} onChange={(e)=>handleChange({condition1:{...local.condition1, indicator:e.target.value}})}> {indicatorOptions.map(i=> <option key={i} value={i}>{i}</option>)} </select> <select className="select" value={local.condition1.operator} onChange={(e)=>handleChange({condition1:{...local.condition1, operator:e.target.value}})}> {operators.map(o=> <option key={o} value={o}>{o}</option>)} </select> <input className="select" value={local.condition1.value} onChange={(e)=>handleChange({condition1:{...local.condition1, value:e.target.value}})} placeholder="value"/> </div>

Code
  <div className="small">Condition 2</div>
  <div className="form-row">
    <select className="select" value={local.condition2.indicator} onChange={(e)=>handleChange({condition2:{...local.condition2, indicator:e.target.value}})}>
      {indicatorOptions.map(i=> <option key={i} value={i}>{i}</option>)}
    </select>
    <select className="select" value={local.condition2.operator} onChange={(e)=>handleChange({condition2:{...local.condition2, operator:e.target.value}})}>
      {operators.map(o=> <option key={o} value={o}>{o}</option>)}
    </select>
    <input className="select" value={local.condition2.value} onChange={(e)=>handleChange({condition2:{...local.condition2, value:e.target.value}})} placeholder="value"/>
  </div>

  <div className="form-row" style={{marginTop:10}}>
    <select className="select" value={local.logic} onChange={(e)=>handleChange({logic:e.target.value})}>
      <option value="AND">AND</option>
      <option value="OR">OR</option>
    </select>
    <select className="select" value={local.direction} onChange={(e)=>handleChange({direction:e.target.value})}>
      <option value="LONG">Enter Long</option>
      <option value="SHORT">Enter Short</option>
    </select>
  </div>

  <div style={{marginTop:8}} className="small">Take Profit / Stop Loss</div>
  <div className="form-row">
    <input className="select" value={local.tp} onChange={(e)=>handleChange({tp:Number(e.target.value)})} />
    <select className="select" value={local.tpMode} onChange={(e)=>handleChange({tpMode:e.target.value})}>
      <option value="pips">pips</option>
      <option value="percent">percent</option>
    </select>
    <input className="select" value={local.sl} onChange={(e)=>handleChange({sl:Number(e.target.value)})} />
    <select className="select" value={local.slMode} onChange={(e)=>handleChange({slMode:e.target.value})}>
      <option value="pips">pips</option>
      <option value="percent">percent</option>
    </select>
  </div>

  <div className="controls">
    <button className="button" onClick={onRun} disabled={disabled}>Run Backtest</button>
    <button className="button" onClick={exportStrategy} disabled={disabled}>Save Strategy</button>
    <label className="button" style={{display:"inline-block", cursor:"pointer"}}>
      Load Strategy
      <input type="file" accept=".json" onChange={loadStrategy} style={{display:"none"}}/>
    </label>
  </div>

  <div style={{marginTop:8}}>
    <div className="small">Progress</div>
    <div className="progress"><div style={{width:`${progress}%`}} /></div>
  </div>
</div>
);
