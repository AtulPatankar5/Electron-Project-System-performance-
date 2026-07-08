import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { useStatistics } from './useStatistics'
import { Chart } from './Chart'

function App() {
  const staticData = useStaticData();
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
        setLabel("CPU Usage" + (staticData?.cpuModel ? " " + staticData.cpuModel : ""));
        break;
      case "RAM":
        setLabel("RAM Usage" + (staticData?.totalMemoryGB ? " " + staticData.totalMemoryGB + " GB" : ""));
        break;
      case "STORAGE":
        setLabel("Storage Usage" + (staticData?.totalStorage ? " " + staticData.totalStorage + " GB" : ""));
        break;
    }
  }, [activeView, staticData]);

  function Header() {
    return <>

      <header>
        <div className="menu-container">
          <button id="menu-app" className="menu-btn" onClick={() => window.electron.sendFrameAction('SHOW_APP_MENU')}>App</button>
          <button id="menu-view" className="menu-btn" onClick={() => window.electron.sendFrameAction('SHOW_VIEW_MENU')}>View</button>
        </div>
        <div className="window-controls">
          <button title="minimize" id="minimize" onClick={() => window.electron.sendFrameAction('MINIMIZE')}></button>
          <button title="maximize" id="maximize" onClick={() => window.electron.sendFrameAction('MAXIMIZE')}></button>
          <button title="close" id="close" onClick={() => window.electron.sendFrameAction('CLOSE')}></button>
        </div>
      </header>
    </>
  }

  function useStaticData() {
    const [staticData, setStaticData] = useState<StaticData>();

    useEffect(() => {
      (async () => {
        const data = await window.electron.getStaticData();
        setStaticData(data);
      })();
    }, []);

    return staticData;
  }

  function SelectOption({ title, subtitle, data, onclick }: SelectOptionProps) {
    return <button className='selectOption' onClick={onclick}>
      <div className='selectOptionTitle'>
        <div>{title}</div>
        <div>{subtitle}</div>
      </div>
      <div className='selectOptionChart'>
        <Chart selectedView={title} data={data} maxDataPoints={10} />
      </div>
    </button>
  }
  return (
    <>
      <Header />

      <div className="main">
        <div>
          <SelectOption onclick={() => setActiveView('CPU')} title="CPU" subtitle={staticData?.cpuModel ?? ""} data={cpuUsage} />
          <SelectOption onclick={() => setActiveView('RAM')} title="RAM" subtitle={(staticData?.totalMemoryGB.toString() ?? "") + " GB"} data={ramUsage} />
          <SelectOption onclick={() => setActiveView('STORAGE')} title="STORAGE" subtitle={(staticData?.totalStorage ?? "") + " GB"} data={storageUsage} />
        </div>
        <div className="chart-container">
          <div className="chart-title">
            {label}
          </div>
          <div className="chart-wrapper">
            <Chart  selectedView={activeView} data={activeUsages} maxDataPoints={10} />
          </div>
        </div>
      </div>

    </>
  )
}

export default App
