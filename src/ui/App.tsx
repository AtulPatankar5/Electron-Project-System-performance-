import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { useStatistics } from './useStatistics'
import { Chart } from './Chart'

function App() {

  const statistics = useStatistics(10);
  const [activeView, setActiveView] = useState<View>("CPU");
  const [label, setLabel] = useState("CPU Usage");

  const cpuUsage = useMemo(() =>
    statistics.map((stat) =>
      stat.cpuUsage
    ), [statistics]);

  const ramUsage = useMemo(() =>
    statistics.map((stat) =>
      stat.ramUsage
    ), [statistics]);

  const storageUsage = useMemo(() =>
    statistics.map((stat) =>
      stat.storageUsage
    ), [statistics]);



  const activeUsages = useMemo(() => {
    switch (activeView) {
      case "CPU":
        return cpuUsage;
      case "RAM":
        return ramUsage;
      case "STORAGE":
        return storageUsage;

    }
  }, [activeView, cpuUsage, ramUsage, storageUsage])

  useEffect(() => {
    return window.electron.subscribeChangeView((view) => setActiveView(view));
  }, [])

  useEffect(() => {
    switch (activeView) {
      case "CPU":
        setLabel("CPU Usage");
        break;
      case "RAM":
        setLabel("RAM Usage");
        break;
      case "STORAGE":
        setLabel("Storage Usage");
        break;
    }
  }, [activeView]);


  return (
    <>

      <header>
        <div className="menu-container">
          <button id="menu-app" className="menu-btn" onClick={() => window.electron.sendFrameAction('SHOW_APP_MENU')}>App</button>
          <button id="menu-view" className="menu-btn" onClick={() => window.electron.sendFrameAction('SHOW_VIEW_MENU')}>View</button>
        </div>
        <div className="window-controls">
          <button title="minimize" id="minimize" onClick={() => window.electron.sendFrameAction('MINIMIZE')}></button>
          <button  title="maximize"id="maximize" onClick={() => window.electron.sendFrameAction('MAXIMIZE')}></button>
          <button title="close" id="close" onClick={() => window.electron.sendFrameAction('CLOSE')}></button>
        </div>
      </header>
      <div className="chart-container">
        <div className="chart-title">
          {label}
        </div>
        <div className="chart-wrapper">
          <Chart data={activeUsages} maxDataPoints={10} />
        </div>
      </div>

    </>
  )
}

export default App
