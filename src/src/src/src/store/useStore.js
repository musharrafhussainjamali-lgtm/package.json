import create from "zustand";

const useStore = create((set) => ({ data: [], // parsed OHLCV rows: {date, open, high, low, close, volume} mapping: { date: "Date", open: "Open", high: "High", low: "Low", close: "Close", volume: "Volume" }, strategy: { condition1: { indicator: "SMA-20", operator: ">", value: 0 }, condition2: { indicator: "SMA-50", operator: "<", value: 0 }, logic: "AND", direction: "LONG", tp: 50, // pips sl: 25, // pips tpMode: "pips", // or percent slMode: "pips" }, results: { trades: [], equity: [], metrics: {} }, running: false, progress: 0, setData: (d) => set({ data: d }), setMapping: (m) => set({ mapping: m }), setStrategy: (s) => set((st) => ({ strategy: { ...st.strategy, ...s } })), setResults: (r) => set({ results: r }), setRunning: (r) => set({ running: r }), setProgress: (p) => set({ progress: p }), }));

export default useStore;
