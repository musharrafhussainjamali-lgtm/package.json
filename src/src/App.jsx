import React from "react";
import FileUploader from "./components/FileUploader";
import StrategyBuilder from "./components/StrategyBuilder";
import ChartArea from "./components/ChartArea";
import Metrics from "./components/Metrics";
import Header from "./components/Header";
import useStore from "./store/useStore";

export default function App() {
  const { data } = useStore();

  return (
    <div className="app">
      <Header />
      <div className="container">
        <aside className="sidebar">
          <FileUploader />
          <StrategyBuilder disabled={!data.length} />
        </aside>
        <main className="main">
          <ChartArea />
          <Metrics />
        </main>
      </div>
    </div>
  );
}
