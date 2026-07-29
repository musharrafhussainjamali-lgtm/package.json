import React, { useRef, useState } from "react"; import Papa from "papaparse"; import useStore from "../store/useStore";

export default function FileUploader() { const inputRef = useRef(); const setData = useStore((s) => s.setData); const setMapping = useStore((s) => s.setMapping); const [preview, setPreview] = useState([]); const [filename, setFilename] = useState("");

async function handleFile(file) { setFilename(file.name); Papa.parse(file, { header: true, dynamicTyping: true, skipEmptyLines: true, complete: (results) => { const rows = results.data.map((r) => r); // Auto-detect common column names const lower = Object.keys(rows[0] || {}).reduce((acc, k) => { acc[k.toLowerCase()] = k; return acc; }, {}); const detect = {}; detect.date = lower["date"] || lower["time"] || lower["datetime"] || Object.keys(lower)[0]; detect.open = lower["open"] || lower["o"]; detect.high = lower["high"] || lower["h"]; detect.low = lower["low"] || lower["l"]; detect.close = lower["close"] || lower["c"]; detect.volume = lower["volume"] || lower["v"] || null; // Build normalized array const parsed = rows.map((r) => { return { date: r[detect.date], open: Number(r[detect.open]), high: Number(r[detect.high]), low: Number(r[detect.low]), close: Number(r[detect.close]), volume: detect.volume ? Number(r[detect.volume]) : 0 }; }).filter(row => row.date != null && !Number.isNaN(row.close)); setPreview(parsed.slice(0, 10)); setMapping({ date: detect.date, open: detect.open, high: detect.high, low: detect.low, close: detect.close, volume: detect.volume }); setData(parsed); } }); }

function onDrop(e) { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); } function onSelect(e) { const f = e.target.files[0]; if (f) handleFile(f); }

return ( <div> <div className="uploader" onDrop={onDrop} onDragOver={(e) => e.preventDefault()} onClick={() => inputRef.current && inputRef.current.click()} > <div style={{fontWeight:600}}>Upload CSV</div> <div className="small">Drag & drop or click to select a CSV file with Date,O,H,L,C,Volume</div> <input ref={inputRef} type="file" accept=".csv" style={{display:"none"}} onChange={onSelect} /> </div>  {filename && <div className="small" style={{marginTop:8}}>Loaded: {filename}</div>}

  <div className="preview">
    <div style={{fontWeight:600}}>Preview (first 10 rows)</div>
    {preview.length ? (
      <table style={{width:"100%",fontSize:12}}>
        <thead><tr><th>Date</th><th>O</th><th>H</th><th>L</th><th>C</th><th>V</th></tr></thead>
        <tbody>
          {preview.map((r, idx) => (
            <tr key={idx}>
              <td>{String(r.date)}</td>
              <td>{r.open}</td>
              <td>{r.high}</td>
              <td>{r.low}</td>
              <td>{r.close}</td>
              <td>{r.volume}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : <div className="small">No data loaded</div>}
  </div>
</div>
