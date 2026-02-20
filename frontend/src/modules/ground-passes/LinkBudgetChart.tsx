import { useMemo } from 'react'
import Plot from 'react-plotly.js'
import { useStore } from '@/stores'
import { computeLinkMarginProfile, getDefaultLinkParams } from '@/lib/link-budget'
import { R_EARTH_EQUATORIAL } from '@/lib/constants'

export default function LinkBudgetChart() {
  const elements = useStore((s) => s.elements)
  const mission = useStore((s) => s.mission)

  const avgAlt = elements.semiMajorAxis - R_EARTH_EQUATORIAL

  const params = useMemo(
    () => getDefaultLinkParams(mission.spacecraft),
    [mission.spacecraft]
  )

  const profile = useMemo(
    () => computeLinkMarginProfile(params, avgAlt),
    [params, avgAlt]
  )

  const elevations = profile.map((p) => p.elevationDeg)
  const margins = profile.map((p) => p.linkMarginDb)
  const ebN0s = profile.map((p) => p.ebN0Db)
  const dataRates = profile.map((p) => p.maxDataRateKbps)

  const darkLayout = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { family: 'JetBrains Mono', size: 10, color: '#9CA3AF' },
    margin: { l: 55, r: 55, t: 30, b: 45 },
    legend: {
      font: { size: 9, color: '#9CA3AF' },
      bgcolor: 'transparent',
      orientation: 'h' as const,
      y: 1.12,
    },
  }

  return (
    <div className="flex h-full gap-2">
      {/* Left: Link margin + Eb/N0 vs elevation */}
      <div className="flex-1 h-full">
        <Plot
          data={[
            {
              x: elevations,
              y: margins,
              type: 'scatter',
              mode: 'lines',
              name: 'Link Margin',
              line: { color: '#3B82F6', width: 2 },
              fill: 'tozeroy',
              fillcolor: 'rgba(59, 130, 246, 0.1)',
            },
            {
              x: elevations,
              y: ebN0s,
              type: 'scatter',
              mode: 'lines',
              name: 'Eb/N0',
              line: { color: '#10B981', width: 2, dash: 'dot' },
              yaxis: 'y2',
            },
          ]}
          layout={{
            ...darkLayout,
            title: { text: 'Link Margin vs Elevation', font: { size: 11, color: '#9CA3AF' } },
            xaxis: {
              title: { text: 'Elevation (\u00B0)', font: { size: 9 } },
              gridcolor: 'rgba(255,255,255,0.05)',
              color: '#6B7280',
              range: [5, 90],
            },
            yaxis: {
              title: { text: 'Link Margin (dB)', font: { size: 9 } },
              gridcolor: 'rgba(255,255,255,0.05)',
              color: '#3B82F6',
              zeroline: true,
              zerolinecolor: 'rgba(239, 68, 68, 0.5)',
              zerolinewidth: 2,
            },
            yaxis2: {
              title: { text: 'Eb/N0 (dB)', font: { size: 9 } },
              overlaying: 'y',
              side: 'right',
              gridcolor: 'transparent',
              color: '#10B981',
            },
            shapes: [
              {
                type: 'line',
                xref: 'paper',
                x0: 0,
                x1: 1,
                yref: 'y',
                y0: 3,
                y1: 3,
                line: { color: 'rgba(245, 158, 11, 0.5)', width: 1, dash: 'dash' },
              },
            ],
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler
        />
      </div>

      {/* Right: Achievable data rate vs elevation */}
      <div className="flex-1 h-full">
        <Plot
          data={[
            {
              x: elevations,
              y: dataRates,
              type: 'scatter',
              mode: 'lines',
              name: 'Max Data Rate',
              line: { color: '#F59E0B', width: 2 },
              fill: 'tozeroy',
              fillcolor: 'rgba(245, 158, 11, 0.1)',
            },
            {
              x: elevations,
              y: elevations.map(() => params.dataRateKbps),
              type: 'scatter',
              mode: 'lines',
              name: `Nominal (${params.dataRateKbps} kbps)`,
              line: { color: 'rgba(239, 68, 68, 0.6)', width: 1, dash: 'dash' },
            },
          ]}
          layout={{
            ...darkLayout,
            title: { text: 'Achievable Data Rate', font: { size: 11, color: '#9CA3AF' } },
            xaxis: {
              title: { text: 'Elevation (\u00B0)', font: { size: 9 } },
              gridcolor: 'rgba(255,255,255,0.05)',
              color: '#6B7280',
              range: [5, 90],
            },
            yaxis: {
              title: { text: 'Data Rate (kbps)', font: { size: 9 } },
              gridcolor: 'rgba(255,255,255,0.05)',
              color: '#F59E0B',
              type: 'log',
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
