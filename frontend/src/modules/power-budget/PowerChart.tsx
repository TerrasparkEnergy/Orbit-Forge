import { useMemo } from 'react'
import Plot from 'react-plotly.js'
import { useStore } from '@/stores'
import { computeOrbitPowerProfile, computePowerAnalysis, totalAvgPowerDraw, subsystemAvgPower } from '@/lib/power-budget'

export default function PowerChart() {
  const elements = useStore((s) => s.elements)
  const mission = useStore((s) => s.mission)
  const subsystems = useStore((s) => s.subsystems)

  const profile = useMemo(
    () => computeOrbitPowerProfile(elements, mission.spacecraft, subsystems),
    [elements, mission.spacecraft, subsystems]
  )

  const analysis = useMemo(
    () => computePowerAnalysis(elements, mission.spacecraft, subsystems, mission.lifetimeTarget),
    [elements, mission.spacecraft, subsystems, mission.lifetimeTarget]
  )

  // Build eclipse shading shapes
  const eclipseShapes = useMemo(() => {
    const shapes: any[] = []
    let inEclipse = false
    let eclipseStart = 0

    for (let i = 0; i < profile.inSunlight.length; i++) {
      if (!profile.inSunlight[i] && !inEclipse) {
        eclipseStart = profile.timeMinutes[i]
        inEclipse = true
      } else if (profile.inSunlight[i] && inEclipse) {
        shapes.push({
          type: 'rect',
          xref: 'x',
          yref: 'paper',
          x0: eclipseStart,
          x1: profile.timeMinutes[i],
          y0: 0,
          y1: 1,
          fillcolor: 'rgba(107, 114, 128, 0.15)',
          line: { width: 0 },
          layer: 'below',
        })
        inEclipse = false
      }
    }
    if (inEclipse) {
      shapes.push({
        type: 'rect',
        xref: 'x',
        yref: 'paper',
        x0: eclipseStart,
        x1: profile.timeMinutes[profile.timeMinutes.length - 1],
        y0: 0,
        y1: 1,
        fillcolor: 'rgba(107, 114, 128, 0.15)',
        line: { width: 0 },
        layer: 'below',
      })
    }
    return shapes
  }, [profile])

  // Power timeline traces
  const timelineTraces: any[] = [
    {
      x: profile.timeMinutes,
      y: profile.powerGeneration,
      type: 'scatter',
      mode: 'lines',
      name: 'Generation',
      line: { color: '#F59E0B', width: 2 },
      fill: 'tozeroy',
      fillcolor: 'rgba(245, 158, 11, 0.1)',
    },
    {
      x: profile.timeMinutes,
      y: profile.powerConsumption,
      type: 'scatter',
      mode: 'lines',
      name: 'Consumption',
      line: { color: '#EF4444', width: 2, dash: 'dot' },
    },
  ]

  // Battery charge trace on secondary y-axis
  const batteryTrace: any = {
    x: profile.timeMinutes,
    y: profile.batteryCharge,
    type: 'scatter',
    mode: 'lines',
    name: 'Battery',
    line: { color: '#10B981', width: 2 },
    yaxis: 'y2',
  }

  // Pie chart for subsystem power distribution
  const pieLabels = subsystems.map((s) => s.name)
  const pieValues = subsystems.map((s) => subsystemAvgPower(s))
  const pieColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#EC4899', '#84CC16', '#F97316', '#14B8A6',
  ]

  const pieTrace: any = {
    labels: pieLabels,
    values: pieValues,
    type: 'pie',
    textinfo: 'label+percent',
    textfont: { size: 10, family: 'JetBrains Mono', color: '#F9FAFB' },
    marker: { colors: pieColors.slice(0, subsystems.length) },
    hole: 0.4,
  }

  const darkLayout = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { family: 'JetBrains Mono', size: 10, color: '#9CA3AF' },
    margin: { l: 50, r: 50, t: 30, b: 40 },
    legend: {
      font: { size: 9, color: '#9CA3AF' },
      bgcolor: 'transparent',
      orientation: 'h' as const,
      y: 1.12,
    },
  }

  return (
    <div className="flex h-full gap-2">
      {/* Power Timeline */}
      <div className="flex-[2] h-full">
        <Plot
          data={[...timelineTraces, batteryTrace]}
          layout={{
            ...darkLayout,
            title: { text: 'Power Profile — 1 Orbit', font: { size: 11, color: '#9CA3AF' } },
            xaxis: {
              title: { text: 'Time (min)', font: { size: 9 } },
              gridcolor: 'rgba(255,255,255,0.05)',
              color: '#6B7280',
            },
            yaxis: {
              title: { text: 'Power (W)', font: { size: 9 } },
              gridcolor: 'rgba(255,255,255,0.05)',
              color: '#6B7280',
            },
            yaxis2: {
              title: { text: 'Battery (Wh)', font: { size: 9 } },
              overlaying: 'y',
              side: 'right',
              gridcolor: 'transparent',
              color: '#10B981',
            },
            shapes: eclipseShapes,
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler
        />
      </div>

      {/* Pie Chart */}
      <div className="flex-1 h-full">
        <Plot
          data={[pieTrace]}
          layout={{
            ...darkLayout,
            title: { text: 'Power Distribution', font: { size: 11, color: '#9CA3AF' } },
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
