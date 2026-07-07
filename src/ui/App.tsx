import { useMemo, useState } from 'react'
import './App.css'
import { useStatistics } from './useStatistics'
import { Chart } from './Chart'

function App() {

  const statistics = useStatistics(10);

  const cpuUsage = useMemo(() =>
    statistics.map((stat) =>
      stat.cpuUsage
    ), [statistics]);

  return (
    <>

      <div className="chart-container">
        <div className="chart-title">
          CPU Usage
        </div>

        <div className="chart-wrapper">
          <Chart data={cpuUsage} maxDataPoints={10}/>
        </div>
      </div>

    </>
  )
}

export default App
