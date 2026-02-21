import { useMemo } from 'react'
import Plot from 'react-plotly.js'
import { useStore } from '@/stores'
import { computeLagrangeResult, generateTransferProfile } from '@/lib/lagrange'

const darkLayout = {
  paper_bgcolor: 'transparent',
  plot_bgcolor: 'transparent',
  font: { family: 'JetBrains Mono, monospace', size: 10, color: '#9CA3AF' },
  margin: { l: 60, r: 20, t: 30, b: 40 },
  legend: { font: { size: 9, color: '#9CA3AF' }, bgcolor: 'transparent', orientation: 'h' as const, y: 1.12 },
}

export default function LagrangeChart() {
  const params = useStore((s) => s.beyondLeo.lagrangeParams)

  const result = useMemo(() => computeLagrangeResult(params), [params])
  const profile = useMemo(() => generateTransferProfile(params), [params])

  // Transfer profile chart data
  const transferTrace = useMemo(() => ({
    x: profile.map((p) => p.day),
    y: profile.map((p) => p.distanceKm / 1e3), // thousands of km
    type: 'scatter' as const,
    mode: 'lines' as const,
    name: 'Distance from Earth',
    line: { color: '#3B82F6', width: 2 },
    fill: 'tozeroy' as const,
    fillcolor: 'rgba(59,130,246,0.1)',
  }), [profile])

  // Station-keeping budget chart data
  const skData = useMemo(() => {
    const years: number[] = []
    const cumDV: number[] = []
    const totalYears = params.missionLifetimeYears
    const steps = 50
    for (let i = 0; i <= steps; i++) {
      const yr = (i / steps) * totalYears
      years.push(yr)
      cumDV.push(yr * result.annualStationKeepingMs)
    }
    return { years, cumDV }
  }, [params.missionLifetimeYears, result.annualStationKeepingMs])

  const skTrace = useMemo(() => ({
    x: skData.years,
    y: skData.cumDV,
    type: 'scatter' as const,
    mode: 'lines' as const,
    name: 'Cumulative SK ΔV',
    line: { color: '#10B981', width: 2 },
    fill: 'tozeroy' as const,
    fillcolor: 'rgba(16,185,129,0.1)',
  }), [skData])

  return (
    <div className="flex h-full gap-2">
      <div className="flex-1 h-full">
        <Plot
          data={[transferTrace] as any}
          layout={{
            ...darkLayout,
            title: { text: 'Transfer Profile', font: { size: 11, color: '#9CA3AF' } },
            xaxis: {
              title: { text: 'Time (days)', font: { size: 10 } },
              gridcolor: 'rgba(255,255,255,0.05)',
              color: '#6B7280',
            },
            yaxis: {
              title: { text: 'Distance (×10³ km)', font: { size: 10 } },
              gridcolor: 'rgba(255,255,255,0.05)',
              color: '#6B7280',
            },
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler
        />
      </div>

      <div className="flex-1 h-full">
        <Plot
          data={[skTrace] as any}
          layout={{
            ...darkLayout,
            title: { text: 'Station-Keeping Budget', font: { size: 11, color: '#9CA3AF' } },
            xaxis: {
              title: { text: 'Time (years)', font: { size: 10 } },
              gridcolor: 'rgba(255,255,255,0.05)',
              color: '#6B7280',
            },
            yaxis: {
              title: { text: 'Cumulative ΔV (m/s)', font: { size: 10 } },
              gridcolor: 'rgba(255,255,255,0.05)',
              color: '#6B7280',
            },
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler
        />
      </div>
    </div>
  )
}
