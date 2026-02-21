import { useMemo } from 'react'
import Plot from 'react-plotly.js'
import { useStore } from '@/stores'
import { computeLunarResult, generateAltitudeProfile } from '@/lib/lunar-transfer'
import { MOON_SEMI_MAJOR_AXIS } from '@/lib/beyond-leo-constants'

const darkLayout = {
  paper_bgcolor: 'transparent',
  plot_bgcolor: 'transparent',
  font: { family: 'JetBrains Mono, monospace', size: 10, color: '#9CA3AF' },
  margin: { l: 60, r: 20, t: 30, b: 40 },
  legend: { font: { size: 9, color: '#9CA3AF' }, bgcolor: 'transparent', orientation: 'h' as const, y: 1.12 },
}

export default function LunarChart() {
  const params = useStore((s) => s.beyondLeo.lunarParams)

  const result = useMemo(() => computeLunarResult(params), [params])
  const profile = useMemo(() => generateAltitudeProfile(params), [params])

  // Altitude profile trace
  const altTrace = useMemo(() => ({
    x: profile.map((p) => p.day),
    y: profile.map((p) => p.distanceKm / 1e3), // thousands of km
    type: 'scatter' as const,
    mode: 'lines' as const,
    name: 'Distance from Earth',
    line: { color: '#3B82F6', width: 2 },
    fill: 'tozeroy' as const,
    fillcolor: 'rgba(59,130,246,0.1)',
  }), [profile])

  // Moon distance reference line
  const moonRef = useMemo(() => ({
    x: [0, result.transferTimeDays],
    y: [MOON_SEMI_MAJOR_AXIS / 1e3, MOON_SEMI_MAJOR_AXIS / 1e3],
    type: 'scatter' as const,
    mode: 'lines' as const,
    name: 'Moon Distance',
    line: { color: '#6B7280', width: 1, dash: 'dash' as const },
  }), [result.transferTimeDays])

  // ΔV breakdown bar chart
  const dvTrace = useMemo(() => {
    const categories = ['TLI', 'LOI']
    const values = [result.tliDeltaVms, result.loiDeltaVms]
    const colors = ['#3B82F6', '#10B981']

    return categories.map((cat, i) => ({
      x: [cat],
      y: [values[i]],
      type: 'bar' as const,
      name: cat,
      marker: { color: colors[i] },
    }))
  }, [result])

  return (
    <div className="flex h-full gap-2">
      <div className="flex-1 h-full">
        <Plot
          data={[altTrace, moonRef] as any}
          layout={{
            ...darkLayout,
            title: { text: 'Transfer Altitude Profile', font: { size: 11, color: '#9CA3AF' } },
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
            showlegend: true,
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler
        />
      </div>

      <div className="flex-1 h-full">
        <Plot
          data={dvTrace as any}
          layout={{
            ...darkLayout,
            title: { text: 'ΔV Breakdown', font: { size: 11, color: '#9CA3AF' } },
            barmode: 'group',
            xaxis: {
              gridcolor: 'rgba(255,255,255,0.05)',
              color: '#6B7280',
            },
            yaxis: {
              title: { text: 'ΔV (m/s)', font: { size: 10 } },
              gridcolor: 'rgba(255,255,255,0.05)',
              color: '#6B7280',
            },
            showlegend: false,
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler
        />
      </div>
    </div>
  )
}
