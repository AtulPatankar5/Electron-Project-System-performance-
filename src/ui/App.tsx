import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { useStatistics } from './useStatistics'
import { Chart } from './Chart'

function App() {
  const staticData = useStaticData();
  const statistics = useStatistics(10);
  const [activeView, setActiveView] = useState<View>("CPU");
  const [label, setLabel] = useState("CPU Usage");
  const [copyState, setCopyState] = useState<{ [key: string]: boolean }>({});

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopyState((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopyState((prev) => ({ ...prev, [key]: false }));
    }, 2000);
  };

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
    if (!window.electron) return;
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
          <button id="menu-app" className="menu-btn" onClick={() => window.electron?.sendFrameAction('SHOW_APP_MENU')}>App</button>
          <button id="menu-view" className="menu-btn" onClick={() => window.electron?.sendFrameAction('SHOW_VIEW_MENU')}>View</button>
        </div>
        {/* <div className="window-controls">
          <button title="minimize" id="minimize" onClick={() => window.electron?.sendFrameAction('MINIMIZE')}></button>
          <button title="maximize" id="maximize" onClick={() => window.electron?.sendFrameAction('MAXIMIZE')}></button>
          <button title="close" id="close" onClick={() => window.electron?.sendFrameAction('CLOSE')}></button>
        </div> */}
      </header>
    </>
  }

  function useStaticData() {
    const [staticData, setStaticData] = useState<StaticData>();

    useEffect(() => {
      if (!window.electron) return;
      (async () => {
        const data = await window.electron.getStaticData();
        setStaticData(data);
      })();
    }, []);

    return staticData;
  }

  // function SelectOption({ title, subtitle, data, onclick }: SelectOptionProps) {
  //   return <button className='selectOption' onClick={onclick}>
  //     <div className='selectOptionTitle'>
  //       <div>{title}</div>
  //       <div>{subtitle}</div>
  //     </div>
  //     <div className='selectOptionChart'>
  //       <Chart selectedView={title} data={data} maxDataPoints={10} />
  //     </div>
  //   </button>
  // }

  return (
    <>
      <Header />

      <div className="main">
        {/* <div> */}
          {/* <SelectOption onclick={() => setActiveView('CPU')} title="CPU" subtitle={staticData?.cpuModel ?? ""} data={cpuUsage} /> */}
          {/* <SelectOption onclick={() => setActiveView('RAM')} title="RAM" subtitle={(staticData?.totalMemoryGB.toString() ?? "") + " GB"} data={ramUsage} />
          <SelectOption onclick={() => setActiveView('STORAGE')} title="STORAGE" subtitle={(staticData?.totalStorage ?? "") + " GB"} data={storageUsage} /> */}
        {/* </div> */}
        <div className="right-panel">
          <div className="chart-container">
            <div className="chart-title">
              {label}
            </div>
            <div className="chart-wrapper">
              <Chart selectedView={activeView} data={activeUsages} maxDataPoints={10} />
            </div>
          </div>

          <div className="details-dashboard">
            <div className="section-title">Hardware Specifications</div>
            <div className="specs-grid">
              <div className="spec-card">
                <div className="spec-label">Machine GUID</div>
                <div className="spec-value-container">
                  <span className="spec-value" title={staticData?.machineGuid}>{staticData?.machineGuid ?? "Loading..."}</span>
                  {staticData?.machineGuid && (
                    <button className="copy-btn" onClick={() => handleCopy(staticData.machineGuid, 'guid')}>
                      {copyState['guid'] ? 'Copied!' : 'Copy'}
                    </button>
                  )}
                </div>
              </div>

              <div className="spec-card">
                <div className="spec-label">System / BIOS UUID</div>
                <div className="spec-value-container">
                  <span className="spec-value" title={staticData?.systemUuid}>{staticData?.systemUuid ?? "Loading..."}</span>
                  {staticData?.systemUuid && (
                    <button className="copy-btn" onClick={() => handleCopy(staticData.systemUuid, 'uuid')}>
                      {copyState['uuid'] ? 'Copied!' : 'Copy'}
                    </button>
                  )}
                </div>
              </div>

              <div className="spec-card">
                <div className="spec-label">Disk Serial Number</div>
                <div className="spec-value-container">
                  <span className="spec-value" title={staticData?.diskSerialNumber}>{staticData?.diskSerialNumber ?? "Loading..."}</span>
                  {staticData?.diskSerialNumber && (
                    <button className="copy-btn" onClick={() => handleCopy(staticData.diskSerialNumber, 'disk')}>
                      {copyState['disk'] ? 'Copied!' : 'Copy'}
                    </button>
                  )}
                </div>
              </div>

              <div className="spec-card">
                <div className="spec-label">OS Version</div>
                <div className="spec-value-container">
                  <span className="spec-value" title={staticData?.osVersion}>{staticData?.osVersion ?? "Loading..."}</span>
                  {staticData?.osVersion && (
                    <button className="copy-btn" onClick={() => handleCopy(staticData.osVersion, 'osVersion')}>
                      {copyState['osVersion'] ? 'Copied!' : 'Copy'}
                    </button>
                  )}
                </div>
              </div>

              <div className="spec-card">
                <div className="spec-label">OS Build / Patch</div>
                <div className="spec-value-container">
                  <span className="spec-value" title={staticData?.osPatch}>{staticData?.osPatch ?? "Loading..."}</span>
                  {staticData?.osPatch && (
                    <button className="copy-btn" onClick={() => handleCopy(staticData.osPatch, 'osPatch')}>
                      {copyState['osPatch'] ? 'Copied!' : 'Copy'}
                    </button>
                  )}
                </div>
              </div>

              <div className="spec-card">
                <div className="spec-label">CPU Information</div>
                <div className="cpu-details-grid">
                  <div className="cpu-detail-item"><strong>Arch:</strong> {staticData?.cpuDetails?.arch ?? "Loading..."}</div>
                  <div className="cpu-detail-item"><strong>Cores:</strong> {staticData?.cpuDetails?.cores ?? "Loading..."}</div>
                  <div className="cpu-detail-item"><strong>Speed:</strong> {staticData?.cpuDetails?.speed ? `${staticData.cpuDetails.speed} MHz` : "Loading..."}</div>
                </div>
              </div>
            </div>

            <div className="section-title">Network & Interfaces</div>
            <div className="network-container">
              {staticData?.networkInterfaces && staticData.networkInterfaces.length > 0 ? (
                <div className="network-table-wrapper">
                  <table className="network-table">
                    <thead>
                      <tr>
                        <th>Interface</th>
                        <th>IPv4 Address</th>
                        <th>IPv6 Address</th>
                        <th>MAC Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staticData.networkInterfaces.map((net, idx) => (
                        <tr key={idx}>
                          <td className="net-name">{net.interfaceName}</td>
                          <td>
                            <div className="net-val-copy">
                              <span className="net-val-text">{net.v4}</span>
                              {net.v4 && net.v4 !== 'N/A' && (
                                <button className="mini-copy-btn" onClick={() => handleCopy(net.v4, `v4-${idx}`)}>
                                  {copyState[`v4-${idx}`] ? '✓' : 'Copy'}
                                </button>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="net-val-copy">
                              <span className="net-val-text v6-text" title={net.v6}>{net.v6}</span>
                              {net.v6 && net.v6 !== 'N/A' && (
                                <button className="mini-copy-btn" onClick={() => handleCopy(net.v6, `v6-${idx}`)}>
                                  {copyState[`v6-${idx}`] ? '✓' : 'Copy'}
                                </button>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="net-val-copy">
                              <span className="net-val-text">{net.mac}</span>
                              {net.mac && net.mac !== 'N/A' && (
                                <button className="mini-copy-btn" onClick={() => handleCopy(net.mac, `mac-${idx}`)}>
                                  {copyState[`mac-${idx}`] ? '✓' : 'Copy'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="no-network">No network interfaces found</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
