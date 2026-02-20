import { useMemo } from 'react'
import Plot from 'react-plotly.js'
import { useStore } from '@/stores'
import { computeDoseVsShielding, computeDoseVsAltitude } from '@/lib/radiation'
import { R_EARTH_EQUATORIAL } from '@/lib/constants'

export default function RadiationChart() {
  const elements = useStore((s) => s.elements)
  const mission = useStore((s) => s.mission)
  const shieldingMm = useStore((s) => s.shieldingThicknessMm)

  const avgAlt = elements.semiMajorAxis - R_EARTH_EQUATORIAL
  const incDeg = elements.inclination

  const shieldingData = useMemo(
    () => computeDoseVsShielding(avgAlt, incDeg, mission.lifetimeTarget, 0, 10, 50),
    [avgAlt, incDeg, mission.lifetimeTarget]
  )

  const altitudeData = useMemo(
    () => computeDoseVsAltitude(incDeg, shieldingMm, 200, 5000, 100),
    [incDeg, shieldingMm]
  )

  const darkLayout = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { family: 'JetBrains Mono', size: 10, color: '#9CA3AF' },
    margin: { l: 55, r: 30, t: 30, b: 45 },
    legend: {
      font: { size: 9, color: '#9CA3AF' },
      bgcolor: 'transparent',
      orientation: 'h' as const,
      y: 1.12,
    },
  }

  // Dose vs Shielding curve
  const shieldingTrace: any = {
    x: shieldingData.map((p) => p.thicknessMm),
    y: shieldingData.map((p) => p.missionTotalKrad),
    type: 'scatter',
    mode: 'lines',
    name: 'Mission Total Dose',
    line: { color: '#3B82F6', width: 2 },
    fill: 'tozeroy',
    fillcolor: 'rgba(59, 130, 246, 0.1)',
    hovertemplate: '%{x:.1f} mm → %{y:.2f} krad<extra></extra>',
  }

  // Current shielding marker
  const currentShieldingDose = shieldingData.find(
    (p) => Math.abs(p.thicknessMm - shieldingMm) < 0.3
  )
  const markerTrace: any = {
    x: [shieldingMm],
    y: [currentShieldingDose?.missionTotalKrad ?? 0],
    type: 'scatter',
    mode: 'markers',
    name: 'Current',
    marker: { color: '#F59E0B', size: 10, symbol: 'diamond' },
    showlegend: true,
    hovertemplate: `Current: ${shieldingMm} mm → %{y:.2f} krad<extra></extra>`,
  }

  // Reference lines at 10 krad and 100 krad
  const refShapes = [
    {
      type: 'line',
      xref: 'paper',
      yref: 'y',
      x0: 0,
      x1: 1,
      y0: 10,
      y1: 10,
      line: { color: '#F59E0B', width: 1, dash: 'dash' },
    },
    {
      type: 'line',
      xref: 'paper',
      yref: 'y',
      x0: 0,
      x1: 1,
      y0: 100,
      y1: 100,
      line: { color: '#EF4444', width: 1, dash: 'dash' },
    },
  ]

  const refAnnotations = [
    {
      x: 1,
      xref: 'paper',
      y: Math.log10(10),
      yref: 'y',
      text: 'COTS limit (10 krad)',
      showarrow: false,
      font: { size: 8, color: '#F59E0B' },
      xanchor: 'right',
      yshift: -10,
    },
    {
      x: 1,
      xref: 'paper',
      y: Math.log10(100),
      yref: 'y',
      text: 'Rad-hard threshold (100 krad)',
      showarrow: false,
      font: { size: 8, color: '#EF4444' },
      xanchor: 'right',
      yshift: -10,
    },
  ]

  // Dose vs Altitude curve
  const altitudeTrace: any = {
    x: altitudeData.map((p) => p.altKm),
    y: altitudeData.map((p) => p.doseKradPerYear),
    type: 'scatter',
    mode: 'lines',
    name: 'Annual Dose',
    line: { color: '#EF4444', width: 2 },
    fill: 'tozeroy',
    fillcolor: 'rgba(239, 68, 68, 0.1)',
    hovertemplate: '%{x:.0f} km → %{y:.2f} krad/yr<extra></extra>',
  }

  // Current altitude marker
  const altMarkerTrace: any = {
    x: [avgAlt],
    y: [altitudeData.find((p) => Math.abs(p.altKm - avgAlt) < 30)?.doseKradPerYear ?? 0],
    type: 'scatter',
    mode: 'markers',
    name: 'Current Orbit',
    marker: { color: '#F59E0B', size: 10, symbol: 'diamond' },
    showlegend: true,
    hovertemplate: `Current: ${avgAlt.toFixed(0)} km → %{y:.2f} krad/yr<extra></extra>`,
  }

  return (
    <div className="flex h-full gap-2">
      <div className="flex-1 h-full">
        <Plot
          data={[shieldingTrace, markerTrace]}
          layout={{
            ...darkLayout,
            title: { text: 'Dose vs Shielding Thickness', font: { size: 11, color: '#9CA3AF' } },
            xaxis: {
              title: { text: 'Al Shielding (mm)', font: { size: 9 } },
              gridcolor: 'rgba(255,255,255,0.05)',
              color: '#6B7280',
            },
            yaxis: {
              title: { text: 'Mission Total (krad)', font: { size: 9 } },
              type: 'log',
              gridcolor: 'rgba(255,255,255,0.05)',
              color: '#6B7280',
            },
            shapes: refShapes as any[],
            annotations: refAnnotations as any[],
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler
        />
      </div>

      <div className="flex-1 h-full">
        <Plot
          data={[altitudeTrace, altMarkerTrace]}
          layout={{
            ...darkLayout,
            title: { text: 'Annual Dose vs Altitude', font: { size: 11, color: '#9CA3AF' } },
            xaxis: {
              title: { text: 'Altitude (km)', font: { size: 9 } },
              gridcolor: 'rgba(255,255,255,0.05)',
              color: '#6B7280',
            },
            yaxis: {
              title: { text: 'Annual Dose (krad/yr)', font: { size: 9 } },
              type: 'log',
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
