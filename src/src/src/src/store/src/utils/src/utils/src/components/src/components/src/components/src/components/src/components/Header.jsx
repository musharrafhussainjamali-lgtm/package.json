import React from "react"; import useStore from "../store/useStore"; import Spinner from "./Spinner";

export default function Header() { const running = useStore((s) => s.running); const progress = useStore((s) => s.progress); return ( <header className="header"> <h1>Forex Strategy Backtester</h1> <div style={{display:"flex",alignItems:"center",gap:10}}> {running ? <div style={{display:"flex",alignItems:"center",gap:8}}><Spinner /> <div className="small">{progress}%</div></div> : <div className="small">Ready</div>} </div> </header> ); } 3. Commit with message: "feat: add Header component".
